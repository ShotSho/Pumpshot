import { prisma } from "@/lib/prisma";
import { applyTradeEventToPosition } from "../positions";
import { Prisma } from "@prisma/client";

// The Helius Enriched Transaction type (simplified)
export interface HeliusEnrichedTransaction {
  signature: string;
  slot: number;
  timestamp: number;
  fee: number;
  tokenTransfers: {
    fromUserAccount: string;
    toUserAccount: string;
    fromTokenAccount: string;
    toTokenAccount: string;
    mint: string;
    tokenAmount: number;
  }[];
  nativeTransfers: {
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }[];
  events?: {
    swap?: {
      nativeInput?: { amount: string };
      nativeOutput?: { amount: string };
      tokenInputs?: { mint: string; tokenAmount: number }[];
      tokenOutputs?: { mint: string; tokenAmount: number }[];
    };
  };
}

export async function processRealtimeTransaction(tx: HeliusEnrichedTransaction) {
  // 1. Find which of the involved wallets we are tracking
  const involvedWallets = new Set<string>();
  const involvedMints = new Set<string>();

  for (const transfer of tx.tokenTransfers || []) {
    if (transfer.fromUserAccount) involvedWallets.add(transfer.fromUserAccount);
    if (transfer.toUserAccount) involvedWallets.add(transfer.toUserAccount);
    if (transfer.mint) involvedMints.add(transfer.mint);
  }

  if (involvedWallets.size === 0) return;

  const trackedWallets = await prisma.trackedWallet.findMany({
    where: {
      walletAddress: { in: Array.from(involvedWallets) },
      trackingEnabled: true,
    },
  });

  const trackedWalletAddresses = new Set(trackedWallets.map(w => w.walletAddress));

  if (trackedWalletAddresses.size === 0) return;

  // 2. Process each tracked wallet and each mint
  for (const wallet of trackedWalletAddresses) {
    for (const mint of involvedMints) {
      
      // Calculate token delta for this wallet and mint
      let tokenDelta = 0;
      for (const transfer of tx.tokenTransfers || []) {
        if (transfer.mint !== mint) continue;
        if (transfer.toUserAccount === wallet) tokenDelta += transfer.tokenAmount;
        if (transfer.fromUserAccount === wallet) tokenDelta -= transfer.tokenAmount;
      }

      // If token balance didn't change, no trade
      if (tokenDelta === 0) continue;

      const isBuy = tokenDelta > 0;
      const tokenAmount = Math.abs(tokenDelta);

      // Estimate quote (SOL) amount
      let solDelta = 0;
      for (const native of tx.nativeTransfers || []) {
        // Exclude tiny fee/tip amounts (< 0.01 SOL) if we only want exact trade sizes,
        // or just sum all to/from for simplicity MVP
        const solAmt = native.amount / 1e9;
        if (native.toUserAccount === wallet) solDelta += solAmt;
        if (native.fromUserAccount === wallet) solDelta -= solAmt;
      }
      
      const quoteAmount = Math.abs(solDelta);
      
      // If there's a token transfer but 0 SOL delta, it might be a transfer, not a swap.
      // For MVP, we will record it as a swap if quoteAmount > 0, otherwise skip or mark as transfer
      if (quoteAmount === 0) {
        // Could be a transfer. We skip it or log it. (Brief says: do not create fake BUY for transfers)
        console.log(`[Realtime] Ignoring transfer-only tx ${tx.signature} for ${wallet} on ${mint}`);
        continue;
      }

      // 3. Apply transaction in database atomically
      const eventKey = `${tx.signature}:${wallet}:${mint}:0`;

      await prisma.$transaction(async (db) => {
        // Deduplication
        const exists = await db.positionEvent.findUnique({
          where: { eventKey },
        });
        if (exists) return;

        // Find or create OPEN position
        let position = await db.walletPosition.findFirst({
          where: { walletAddress: wallet, mint, status: "OPEN" },
          orderBy: { positionNumber: "desc" },
        });

        if (!position) {
          // Check what the highest position number is
          const lastPos = await db.walletPosition.findFirst({
            where: { walletAddress: wallet, mint },
            orderBy: { positionNumber: "desc" },
          });
          const positionNumber = (lastPos?.positionNumber || 0) + 1;

          position = await db.walletPosition.create({
            data: {
              walletAddress: wallet,
              mint,
              positionNumber,
              status: "OPEN",
              firstEntryAt: new Date(tx.timestamp * 1000),
              lastActivityAt: new Date(tx.timestamp * 1000),
              totalTokensBought: 0,
              totalTokensSold: 0,
              remainingTokens: 0,
              totalSolSpent: 0,
              totalSolReceived: 0,
            },
          });
        }

        // Apply trade
        const updatedPosition = applyTradeEventToPosition(position, {
          isBuy,
          tokenAmount,
          quoteAmount,
          timestamp: tx.timestamp,
        });

        // Update position in DB
        await db.walletPosition.update({
          where: { id: position.id },
          data: updatedPosition,
        });

        // Insert event
        await db.positionEvent.create({
          data: {
            eventKey,
            positionId: position.id,
            walletAddress: wallet,
            mint,
            signature: tx.signature,
            slot: tx.slot,
            timestamp: new Date(tx.timestamp * 1000),
            eventType: isBuy ? "BUY" : "SELL",
            tokenAmount: new Prisma.Decimal(tokenAmount),
            quoteMint: "So11111111111111111111111111111111111111112",
            quoteSymbol: "SOL",
            quoteAmount: new Prisma.Decimal(quoteAmount),
          },
        });

        // Update tracker
        await db.trackedWallet.update({
          where: { walletAddress: wallet },
          data: {
            lastIndexedSlot: tx.slot,
          },
        });
      });
    }
  }
}
