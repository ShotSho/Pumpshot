import { prisma } from "../lib/prisma";
import type { PositionBook } from "./positions";

export async function upsertTrackedWallet(walletAddress: string): Promise<void> {
  try {
    await prisma.trackedWallet.upsert({
      where: { walletAddress },
      update: {},
      create: {
        walletAddress,
        trackingEnabled: true,
      },
    });
  } catch (err) {
    console.error(`[db] Failed to upsert tracked wallet ${walletAddress}:`, err);
  }
}

export async function syncPositionBook(mint: string, book: PositionBook): Promise<void> {
  try {
    const snapshot = book.snapshot(mint);

    for (const [walletAddress, p] of Object.entries(snapshot)) {
      const positionNumber = 1;

      const isHolding = p.qty > 0;
      const firstEntryAt = new Date(p.firstTs * 1000);
      const lastActivityAt = new Date(p.lastTs * 1000);
      const closedAt = isHolding ? null : lastActivityAt;

      const pos = await prisma.walletPosition.upsert({
        where: {
          walletAddress_mint_positionNumber: {
            walletAddress,
            mint,
            positionNumber,
          },
        },
        update: {
          status: isHolding ? "OPEN" : "CLOSED",
          lastActivityAt,
          closedAt,
          totalTokensBought: p.boughtBase,
          totalTokensSold: p.soldBase,
          remainingTokens: p.qty,
          totalSolSpent: p.boughtUsd,
          totalSolReceived: p.soldUsd,
          realizedPnlSol: p.realized,
        },
        create: {
          walletAddress,
          mint,
          positionNumber,
          status: isHolding ? "OPEN" : "CLOSED",
          firstEntryAt,
          lastActivityAt,
          closedAt,
          totalTokensBought: p.boughtBase,
          totalTokensSold: p.soldBase,
          remainingTokens: p.qty,
          totalSolSpent: p.boughtUsd,
          totalSolReceived: p.soldUsd,
          realizedPnlSol: p.realized,
        },
      });

      const fills = book.fillsFor(mint, walletAddress);
      for (const fill of fills) {
        if (!fill.signature) continue;

        const existing = await prisma.positionEvent.findFirst({
          where: { signature: fill.signature, positionId: pos.id },
        });

        if (!existing) {
          await prisma.positionEvent.create({
            data: {
              positionId: pos.id,
              signature: fill.signature,
              slot: BigInt(0), 
              timestamp: new Date(fill.ts * 1000),
              eventType: fill.isBuy ? "BUY" : "SELL",
              tokenAmount: fill.base,
              quoteMint: "So11111111111111111111111111111111111111112",
              quoteSymbol: "SOL",
              quoteAmount: fill.usd,
              executionPriceSol: fill.base > 0 ? fill.usd / fill.base : 0,
            },
          });
        }
      }
    }
  } catch (err) {
    console.error(`[db] Failed to sync position book for mint ${mint}:`, err);
  }
}
