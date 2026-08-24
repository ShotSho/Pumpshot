import { NextResponse } from "next/server";
import { getLiveActivity } from "@/server/walletStats";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;
    if (!wallet) return new NextResponse("Missing wallet", { status: 400 });

    const activity = await getLiveActivity(wallet, 20);
    return NextResponse.json(activity);
  } catch (error) {
    console.error("Failed to fetch live activity:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
