"use client";

import { useState, useEffect } from "react";
import type { WalletPosition, PositionEvent } from "@prisma/client";
import { PositionCard } from "./PositionCard";
import type { WalletStats } from "@/server/walletStats";

type Tab = "OVERVIEW" | "OPEN" | "CLOSED" | "ACTIVITY";

type LiveActivityEvent = PositionEvent & { position: WalletPosition | null };

export function WalletTracker({
  walletAddress,
  stats,
  initialOpen,
  initialClosed,
  initialActivity,
}: {
  walletAddress: string;
  stats: WalletStats;
  initialOpen: WalletPosition[];
  initialClosed: WalletPosition[];
  initialActivity: LiveActivityEvent[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("OVERVIEW");
  const [activity, setActivity] = useState<LiveActivityEvent[]>(initialActivity);

  // Polling for live activity every 10 seconds if on ACTIVITY tab
  useEffect(() => {
    if (activeTab !== "ACTIVITY") return;

    const fetchActivity = async () => {
      try {
        const res = await fetch(`/api/wallet/${walletAddress}/activity`);
        if (res.ok) {
          const data = await res.json();
          setActivity(data);
        }
      } catch (err) {
        console.error("Failed to fetch live activity", err);
      }
    };

    const interval = setInterval(fetchActivity, 10000);
    return () => clearInterval(interval);
  }, [activeTab, walletAddress]);

  const tabs: Tab[] = ["OVERVIEW", "OPEN", "CLOSED", "ACTIVITY"];

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col min-h-screen bg-black text-white font-mono uppercase pb-20">
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-zinc-800 p-4">
        <h1 className="text-xl font-bold mb-1 truncate text-[#00ff00]">
          {walletAddress}
        </h1>
        <p className="text-zinc-500 text-xs">Pumpshot Wallet Tracker</p>
        
        {/* Navigation */}
        <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-sm border whitespace-nowrap transition-colors ${
                activeTab === tab 
                  ? "bg-[#00ff00] text-black border-[#00ff00] font-bold" 
                  : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-500"
              }`}
            >
              {tab}
              {tab === "OPEN" && ` (${stats.openPositionsCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-grow flex flex-col gap-4">
        
        {activeTab === "OVERVIEW" && (
          <div className="grid grid-cols-2 gap-4">
            <StatBox label="WIN RATE" value={`${stats.winRatePct.toFixed(1)}%`} highlight={stats.winRatePct >= 50} />
            <StatBox label="TOTAL TRADES" value={stats.totalTrades.toString()} />
            <StatBox label="REALIZED PNL" value={`${stats.realizedPnlSol > 0 ? '+' : ''}${stats.realizedPnlSol.toFixed(4)} SOL`} highlight={stats.realizedPnlSol > 0} error={stats.realizedPnlSol < 0} />
            <StatBox label="BEST RETURN" value={stats.bestTradeReturnPct ? `${stats.bestTradeReturnPct.toFixed(0)}%` : "-"} highlight />
            <StatBox label="OPEN POSITIONS" value={stats.openPositionsCount.toString()} />
            <StatBox label="CLOSED POSITIONS" value={stats.closedPositionsCount.toString()} />
          </div>
        )}

        {activeTab === "OPEN" && (
          <div className="flex flex-col gap-4">
            {initialOpen.length === 0 ? (
              <div className="text-zinc-500 text-center py-10">NO OPEN POSITIONS</div>
            ) : (
              initialOpen.map(pos => <PositionCard key={pos.id} position={pos} />)
            )}
          </div>
        )}

        {activeTab === "CLOSED" && (
          <div className="flex flex-col gap-4">
            {initialClosed.length === 0 ? (
              <div className="text-zinc-500 text-center py-10">NO CLOSED POSITIONS</div>
            ) : (
              initialClosed.map(pos => <PositionCard key={pos.id} position={pos} />)
            )}
          </div>
        )}

        {activeTab === "ACTIVITY" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-2">
               <span className="w-2 h-2 bg-[#00ff00] rounded-full animate-pulse"></span>
               <span className="text-[#00ff00] text-xs">LIVE FEED POLLING</span>
            </div>
            {activity.length === 0 ? (
              <div className="text-zinc-500 text-center py-10">NO RECENT ACTIVITY</div>
            ) : (
              activity.map(event => (
                <div key={event.id} className="border border-zinc-800 p-3 bg-zinc-950 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-sm font-bold mt-1">
                      {event.eventType === "BUY" ? (
                         <span className="text-[#00ff00]">BUY</span>
                      ) : (
                         <span className="text-[#ff0000]">SELL</span>
                      )}
                      {" "} {Number(event.tokenAmount).toLocaleString()} TOKENS
                    </span>
                    <span className="text-xs text-zinc-400 mt-1 truncate max-w-[150px]">
                      {event.position?.mint}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm">{Number(event.quoteAmount).toFixed(4)} {event.quoteSymbol}</span>
                    {event.executionMarketCap && (
                      <span className="text-xs text-zinc-500 mt-1">
                        @ ${Number(event.executionMarketCap).toLocaleString(undefined, { maximumFractionDigits: 0 })} MC
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, highlight, error }: { label: string, value: string, highlight?: boolean, error?: boolean }) {
  return (
    <div className="border border-zinc-800 bg-zinc-950 p-4 flex flex-col justify-center items-center text-center">
      <span className="text-zinc-500 text-xs mb-2">{label}</span>
      <span className={`text-xl font-bold ${highlight ? 'text-[#00ff00]' : error ? 'text-[#ff0000]' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}
