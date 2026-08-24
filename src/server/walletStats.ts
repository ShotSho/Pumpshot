import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";

export type WalletStats = {
  walletAddress: string;
  totalTrades: number;
  openPositionsCount: number;
  closedPositionsCount: number;
  realizedPnlSol: number;
  winRatePct: number;
  bestTradeReturnPct: number | null;
};

export async function getWalletStats(walletAddress: string): Promise<WalletStats> {
  const positions = await prisma.walletPosition.findMany({
    where: { walletAddress },
  });

  const totalTrades = positions.length;
  const openPositionsCount = positions.filter((p) => p.status === "OPEN").length;
  const closedPositionsCount = positions.filter((p) => p.status === "CLOSED").length;
  
  let realizedPnlSol = 0;
  let winningTrades = 0;
  let bestTradeReturnPct: number | null = null;

  for (const p of positions) {
    const pnl = p.realizedPnlSol ? Number(p.realizedPnlSol) : 0;
    realizedPnlSol += pnl;
    
    if (p.status === "CLOSED" && pnl > 0) {
      winningTrades++;
    }

    if (p.totalSolSpent && Number(p.totalSolSpent) > 0) {
      // Return percentage = (realizedPnl / totalSpent) * 100
      const returnPct = (pnl / Number(p.totalSolSpent)) * 100;
      if (bestTradeReturnPct === null || returnPct > bestTradeReturnPct) {
        bestTradeReturnPct = returnPct;
      }
    }
  }

  const winRatePct = closedPositionsCount > 0 
    ? (winningTrades / closedPositionsCount) * 100 
    : 0;

  return {
    walletAddress,
    totalTrades,
    openPositionsCount,
    closedPositionsCount,
    realizedPnlSol,
    winRatePct,
    bestTradeReturnPct,
  };
}

export async function getWalletPositions(walletAddress: string, status?: "OPEN" | "CLOSED") {
  return prisma.walletPosition.findMany({
    where: { 
      walletAddress,
      ...(status ? { status } : {})
    },
    orderBy: {
      firstEntryAt: "desc"
    }
  });
}

export async function getLiveActivity(walletAddress: string, limit = 20) {
  return prisma.positionEvent.findMany({
    where: {
      position: {
        walletAddress
      }
    },
    include: {
      position: true
    },
    orderBy: {
      timestamp: "desc"
    },
    take: limit,
  });
}
