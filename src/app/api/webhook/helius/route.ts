import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processRealtimeTransaction, HeliusEnrichedTransaction } from "@/server/realtime/processHeliusTransaction";

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

    // 2. Queue into WebhookInbox and process incrementally
    for (const tx of payload as HeliusEnrichedTransaction[]) {
      if (!tx.signature) continue;

      // Dedupe in WebhookInbox
      try {
        await prisma.webhookInbox.create({
          data: {
            signature: tx.signature,
            source: "HELIUS",
            payload: tx as any,
            status: "PROCESSING"
          }
        });
      } catch (err) {
        // If unique constraint fails, we already received this signature
        continue;
      }

      try {
        // Process it
        await processRealtimeTransaction(tx);
        
        await prisma.webhookInbox.update({
          where: {
            source_signature: { source: "HELIUS", signature: tx.signature }
          },
          data: { status: "COMPLETED", processedAt: new Date() }
        });
      } catch (err) {
        console.error(`[Webhook] Failed to process tx ${tx.signature}:`, err);
        await prisma.webhookInbox.update({
          where: {
            source_signature: { source: "HELIUS", signature: tx.signature }
          },
          data: { status: "FAILED", error: (err as Error).message }
        });
      }
    }

    return NextResponse.json({ success: true, message: "Webhook accepted" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
