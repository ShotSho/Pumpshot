import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reconstruct } from "@/server/history";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // 1. Verify Authorization Header
    const authHeader = request.headers.get("Authorization");
    const expectedSecret = process.env.HELIUS_WEBHOOK_SECRET;
    
    if (expectedSecret && authHeader !== expectedSecret) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const payload = await request.json();
    
    // Helius sends an array of transactions
    if (!Array.isArray(payload)) {
      return new NextResponse("Invalid payload", { status: 400 });
    }

    // 2. Extract unique (wallet, mint) pairs to update
    const updatesNeeded = new Set<string>();

    for (const tx of payload) {
      if (!tx.tokenTransfers || tx.tokenTransfers.length === 0) continue;
      
      const involvedWallets = new Set<string>();
      const involvedMints = new Set<string>();
      
      for (const transfer of tx.tokenTransfers) {
        if (transfer.fromUserAccount) involvedWallets.add(transfer.fromUserAccount);
        if (transfer.toUserAccount) involvedWallets.add(transfer.toUserAccount);
        if (transfer.mint) involvedMints.add(transfer.mint);
      }

      // We only care about wallets that we are currently tracking
      for (const wallet of involvedWallets) {
        for (const mint of involvedMints) {
          updatesNeeded.add(`${wallet}|${mint}`);
        }
      }
    }

    // 3. Fire and forget the sync process (background processing)
    // We do not await this because we want to respond to Helius quickly.
    const runUpdates = async () => {
      for (const pair of updatesNeeded) {
        const [wallet, mint] = pair.split("|");
        
        // Check if we actually track this wallet
        const isTracked = await prisma.trackedWallet.findUnique({
          where: { walletAddress: wallet },
        });

        if (isTracked && isTracked.trackingEnabled) {
          try {
            console.log(`[Webhook] Syncing ${wallet} on ${mint}`);
            // This will pull the latest tx from Helius and run syncPositionBook internally
            // Call reconstruct directly on the server side instead of the client-side fetch wrapper
            await reconstruct(mint, wallet, 100, []);
          } catch (err) {
            console.error(`[Webhook] Failed to sync ${wallet} ${mint}:`, err);
          }
        }
      }
    };

    // Execute asynchronously
    runUpdates();

    return NextResponse.json({ success: true, message: "Webhook accepted" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
