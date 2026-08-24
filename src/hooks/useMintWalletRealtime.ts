import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface UseMintWalletRealtimeProps {
  walletAddress: string;
  mint: string;
  onPositionEvent: (event: any) => void;
  onPositionUpdate: (position: any) => void;
}

export function useMintWalletRealtime({ walletAddress, mint, onPositionEvent, onPositionUpdate }: UseMintWalletRealtimeProps) {
  useEffect(() => {
    if (!walletAddress || !mint) return;

    // Setup Supabase realtime subscriptions
    const channel = supabase.channel(`replay-${walletAddress}-${mint}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'position_events', filter: `wallet_address=eq.${walletAddress}` },
        (payload) => {
          if (payload.new.mint === mint) {
            onPositionEvent(payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'wallet_positions', filter: `wallet_address=eq.${walletAddress}` },
        (payload) => {
          if (payload.new.mint === mint) {
            onPositionUpdate(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [walletAddress, mint, onPositionEvent, onPositionUpdate]);
}
