import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { WalletAction } from "../lib/realtime/walletReducer";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface UseWalletRealtimeProps {
  walletAddress: string;
  dispatch: React.Dispatch<WalletAction>;
}

export function useWalletRealtime({ walletAddress, dispatch }: UseWalletRealtimeProps) {
  useEffect(() => {
    if (!walletAddress) return;

    dispatch({ type: "CONNECTION_STATE_CHANGED", payload: "RECONNECTING" });

    // Setup Supabase realtime subscriptions
    const channel = supabase.channel(`wallet-${walletAddress}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wallet_positions', filter: `wallet_address=eq.${walletAddress}` },
        (payload) => {
          if (payload.new.status === "OPEN") {
            dispatch({ type: "POSITION_INSERTED", payload: payload.new });
          } else {
            dispatch({ type: "POSITION_CLOSED", payload: payload.new });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'wallet_positions', filter: `wallet_address=eq.${walletAddress}` },
        (payload) => {
          if (payload.new.status === "OPEN") {
            dispatch({ type: "POSITION_UPDATED", payload: payload.new });
          } else {
            dispatch({ type: "POSITION_CLOSED", payload: payload.new });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'position_events', filter: `wallet_address=eq.${walletAddress}` },
        (payload) => {
          dispatch({ type: "EVENT_INSERTED", payload: payload.new });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          dispatch({ type: "CONNECTION_STATE_CHANGED", payload: "LIVE" });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          dispatch({ type: "CONNECTION_STATE_CHANGED", payload: "DELAYED" });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [walletAddress, dispatch]);
}
