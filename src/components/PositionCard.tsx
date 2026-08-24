import type { WalletPosition } from "@prisma/client";

export function PositionCard({ position }: { position: WalletPosition }) {
  const isOpen = position.status === "OPEN";
  const pnl = isOpen ? position.unrealizedPnlSol : position.realizedPnlSol;
  const isProfit = Number(pnl) > 0;
  
  const pnlColor = isProfit ? "text-[#00ff00]" : "text-[#ff0000]";
  
  // Return format: 35.61x
  const totalSpent = Number(position.totalSolSpent || 0);
  const totalReceived = Number(position.totalSolReceived || 0);
  const multiplier = totalSpent > 0 ? (totalReceived / totalSpent).toFixed(2) + "x" : "-";

  return (
    <div className="border border-zinc-800 bg-zinc-950 p-4 font-mono text-sm uppercase flex flex-col gap-4">
      <div className="flex justify-between items-start border-b border-zinc-800 pb-2">
        <div className="flex flex-col">
          <span className="text-zinc-400 text-xs">MINT</span>
          <span className="truncate max-w-[150px] sm:max-w-[200px]" title={position.mint}>
            {position.mint}
          </span>
        </div>
        <div className={`px-2 py-1 text-xs font-bold ${isOpen ? 'bg-[#00ff00] text-black' : 'bg-zinc-800 text-zinc-400'}`}>
          {isOpen ? "● OPEN" : "CLOSED"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="text-zinc-500 text-xs">ENTRY MC</span>
          <span>${Number(position.entryMarketCap || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-zinc-500 text-xs">{isOpen ? "CURRENT MC" : "EXIT MC"}</span>
          <span>${Number((isOpen ? position.currentMarketCap : position.exitMarketCap) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-zinc-500 text-xs">INVESTED</span>
          <span>{Number(position.totalSolSpent || 0).toFixed(4)} SOL</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-zinc-500 text-xs">{isOpen ? "UNREALIZED" : "REALIZED"}</span>
          <span className={pnlColor}>{Number(pnl || 0).toFixed(4)} SOL</span>
        </div>
      </div>

      <div className="flex justify-between items-end border-t border-zinc-800 pt-2 mt-2">
        <div className="flex flex-col">
          <span className="text-zinc-500 text-xs">RETURN</span>
          <span className={isProfit ? "text-[#00ff00]" : "text-white"}>{multiplier}</span>
        </div>
        <div>
          {isOpen ? (
             <button className="border border-[#00ff00] text-[#00ff00] px-4 py-1 hover:bg-[#00ff00] hover:text-black transition-colors">
               WATCH LIVE
             </button>
          ) : (
             <button className="border border-zinc-600 text-zinc-300 px-4 py-1 hover:bg-zinc-800 transition-colors">
               REPLAY
             </button>
          )}
        </div>
      </div>
    </div>
  );
}
