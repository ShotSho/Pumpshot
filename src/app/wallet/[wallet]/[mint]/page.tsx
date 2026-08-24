import { WalletReplay } from "@/components/WalletReplay";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchHistory } from "@/lib/replay";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ wallet: string; mint: string }> }) {
  const { wallet, mint } = await params;
  return {
    title: `Pumpshot Replay: ${mint}`,
    description: `Watch the full historical trade replay for wallet ${wallet} on token ${mint}. Powered by Pumpshot.`,
    openGraph: {
      title: `Pumpshot Replay: ${mint}`,
      description: `Watch the full historical trade replay for wallet ${wallet} on token ${mint}. Powered by Pumpshot.`,
      type: "video.other",
    },
    twitter: {
      card: "summary_large_image",
      title: `Pumpshot Replay: ${mint}`,
      description: `Watch the full historical trade replay for wallet ${wallet} on token ${mint}.`,
    },
  };
}
export default async function WalletReplayPage({
  params,
}: {
  params: Promise<{ wallet: string; mint: string }>;
}) {
  const { wallet, mint } = await params;
  
  if (!wallet || !mint) {
    notFound();
  }

  // Preload history so it's ready for WalletReplay
  const preloaded = await fetchHistory(mint, wallet, 300, []);

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-zinc-800 p-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-zinc-500 text-xs">MINT REPLAY</span>
          <h1 className="text-sm font-bold truncate max-w-[200px] text-white">
            {mint}
          </h1>
        </div>
        <Link 
          href={`/wallet/${wallet}`}
          className="border border-zinc-700 text-zinc-300 px-3 py-1 text-xs hover:bg-zinc-800 transition-colors"
        >
          BACK TO WALLET
        </Link>
      </div>

      {/* Main Replay Component */}
      <div className="flex-grow flex flex-col w-full max-w-2xl mx-auto border-x border-zinc-900">
        <WalletReplay 
          mint={mint} 
          wallet={wallet} 
          preloaded={preloaded || undefined} 
          onClose={() => {}} 
        />
      </div>
    </div>
  );
}
