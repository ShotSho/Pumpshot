import { getWalletStats, getWalletPositions, getLiveActivity } from "@/server/walletStats";
import { upsertTrackedWallet } from "@/server/db";
import { WalletTracker } from "@/components/WalletTracker";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function WalletPage({
  params,
}: {
  params: Promise<{ wallet: string }>;
}) {
  const { wallet } = await params;
  if (!wallet || wallet.length < 32 || wallet.length > 44) {
    notFound();
  }

  // Ensure wallet is marked for tracking
  await upsertTrackedWallet(wallet);

  // Fetch all required data for the client component in parallel
  const [stats, openPositions, closedPositions, initialActivity] = await Promise.all([
    getWalletStats(wallet),
    getWalletPositions(wallet, "OPEN"),
    getWalletPositions(wallet, "CLOSED"),
    getLiveActivity(wallet, 20),
  ]);

  return (
    <div className="min-h-screen bg-black">
      <WalletTracker 
        walletAddress={wallet} 
        stats={stats} 
        initialOpen={openPositions}
        initialClosed={closedPositions}
        initialActivity={initialActivity}
      />
    </div>
  );
}
