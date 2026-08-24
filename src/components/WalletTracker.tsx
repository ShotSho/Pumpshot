"use client";

import { useState, useReducer } from "react";
import type { WalletPosition, PositionEvent } from "@prisma/client";
import { PositionCard } from "./PositionCard";
import type { WalletStats } from "@/server/walletStats";
import { walletReducer } from "@/lib/realtime/walletReducer";
import { useWalletRealtime } from "@/hooks/useWalletRealtime";

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

  const [state, dispatch] = useReducer(walletReducer, {
    openPositions: initialOpen,
    closedPositions: initialClosed,
    activity: initialActivity,
    walletStats: stats,
    connectionState: "RECONNECTING"
  });

  // Setup Supabase Realtime
  useWalletRealtime({ walletAddress, dispatch });

  const tabs: Tab[] = ["OVERVIEW", "OPEN", "CLOSED", "ACTIVITY"];

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col min-h-screen bg-black text-white font-mono uppercase pb-20">
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-zinc-800 p-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold mb-1 truncate text-[#00ff00]">
              {walletAddress}
            </h1>
            <p className="text-zinc-500 text-xs">Pumpshot Wallet Tracker</p>
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${
              state.connectionState === "LIVE" ? "bg-[#00ff00] shadow-[0_0_8px_#00ff00]" : 
              state.connectionState === "RECONNECTING" ? "bg-yellow-500 animate-pulse" : 
              "bg-red-500"
            }`}></span>
            <span className={`text-[10px] ${
              state.connectionState === "LIVE" ? "text-[#00ff00]" : 
              state.connectionState === "RECONNECTING" ? "text-yellow-500" : 
              "text-red-500"
            }`}>
              {state.connectionState}
            </span>
          </div>
        </div>
        
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
              {tab === "OPEN" && ` (${state.openPositions.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-grow flex flex-col gap-4">
        
        {activeTab === "OVERVIEW" && (
          <div className="grid grid-cols-2 gap-4">
            <StatBox label="WIN RATE" value={`${state.walletStats.winRatePct.toFixed(1)}%`} highlight={state.walletStats.winRatePct >= 50} />
            <StatBox label="TOTAL TRADES" value={state.walletStats.totalTrades.toString()} />
            <StatBox label="REALIZED PNL" value={`${state.walletStats.realizedPnlSol > 0 ? '+' : ''}${state.walletStats.realizedPnlSol.toFixed(4)} SOL`} highlight={state.walletStats.realizedPnlSol > 0} error={state.walletStats.realizedPnlSol < 0} />
            <StatBox label="BEST RETURN" value={state.walletStats.bestTradeReturnPct ? `${state.walletStats.bestTradeReturnPct.toFixed(0)}%` : "-"} highlight />
            <StatBox label="OPEN POSITIONS" value={state.openPositions.length.toString()} />
            <StatBox label="CLOSED POSITIONS" value={state.closedPositions.length.toString()} />
          </div>
        )}

        {activeTab === "OPEN" && (
          <div className="flex flex-col gap-4">
            {state.openPositions.length === 0 ? (
              <div className="text-zinc-500 text-center py-10">NO OPEN POSITIONS</div>
            ) : (
              state.openPositions.map(pos => <PositionCard key={pos.id} position={pos} />)
            )}
          </div>
        )}

        {activeTab === "CLOSED" && (
          <div className="flex flex-col gap-4">
            {state.closedPositions.length === 0 ? (
              <div className="text-zinc-500 text-center py-10">NO CLOSED POSITIONS</div>
            ) : (
              state.closedPositions.map(pos => <PositionCard key={pos.id} position={pos} />)
            )}
          </div>
        )}

        {activeTab === "ACTIVITY" && (
          <div className="flex flex-col gap-2">
            {state.activity.length === 0 ? (
              <div className="text-zinc-500 text-center py-10">NO RECENT ACTIVITY</div>
            ) : (
              state.activity.map(event => (
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
                      {event.mint || event.position?.mint}
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
