import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const heliusKey = process.env.HELIUS_API_KEY;
if (!heliusKey) {
  console.warn("No HELIUS_API_KEY provided. Market stream will not connect to Helius.");
}

interface ActiveStream {
  mint: string;
  lastPingAt: Date;
}

// Memory state
const activeMints = new Set<string>();
const connections = new Map<string, WebSocket>();

// Periodic check for stale streams
setInterval(async () => {
  try {
    const cutoff = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes
    
    // Fetch active streams
    const { data: streams, error } = await supabase
      .from('active_streams')
      .select('*')
      .gte('last_ping_at', cutoff.toISOString());

    if (error) throw error;

    const currentMints = new Set(streams.map((s: any) => s.mint));

    // Stop stale subscriptions
    for (const mint of activeMints) {
      if (!currentMints.has(mint)) {
        console.log(`Stopping stream for ${mint} (no pings in 5m)`);
        activeMints.delete(mint);
        const ws = connections.get(mint);
        if (ws) {
          ws.close();
          connections.delete(mint);
        }
      }
    }

    // Start new subscriptions
    for (const mint of currentMints) {
      if (!activeMints.has(mint)) {
        console.log(`Starting stream for ${mint}`);
        activeMints.add(mint);
        startHeliusStream(mint);
      }
    }
  } catch (err) {
    console.error("Error managing streams:", err);
  }
}, 10000);

function startHeliusStream(mint: string) {
  if (!heliusKey) return;

  const ws = new WebSocket(`wss://mainnet.helius-rpc.com/?api-key=${heliusKey}`);
  
  // Basic mock candle state for this session
  let currentCandle = {
    t: Math.floor(Date.now() / 15000) * 15,
    o: 0, h: 0, l: 0, c: 0, v: 0
  };

  ws.on('open', () => {
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'logsSubscribe',
      params: [
        { mentions: [mint] },
        { commitment: 'confirmed' }
      ]
    }));
  });

  ws.on('message', (data: WebSocket.Data) => {
    try {
      const parsed = JSON.parse(data.toString());
      if (parsed.method === 'logsNotification') {
        // A real implementation would parse the DEX logs for swap amounts.
        // For MVP architecture proof, we trigger a synthetic candle update.
        
        const now = Math.floor(Date.now() / 1000);
        const interval = 15;
        const bucket = Math.floor(now / interval) * interval;
        
        if (bucket !== currentCandle.t) {
          // New candle
          currentCandle = {
            t: bucket,
            o: currentCandle.c || 1, // Fallback price
            h: currentCandle.c || 1,
            l: currentCandle.c || 1,
            c: currentCandle.c || 1,
            v: 0
          };
        }

        // Simulate random price action & volume for the demonstration
        const mockPriceShift = 1 + (Math.random() - 0.5) * 0.02; // +/- 1%
        const newPrice = currentCandle.c * mockPriceShift;
        
        currentCandle.c = newPrice;
        currentCandle.h = Math.max(currentCandle.h, newPrice);
        currentCandle.l = Math.min(currentCandle.l, newPrice);
        currentCandle.v += Math.random() * 1000; // random volume

        // Broadcast current candle
        supabase.channel(`market-candles-${mint}`).send({
          type: 'broadcast',
          event: 'candle_update',
          payload: { candle: currentCandle, mint }
        });
      }
    } catch (e) {
      console.error(e);
    }
  });

  ws.on('close', () => {
    if (activeMints.has(mint)) {
      // Reconnect if still active
      setTimeout(() => startHeliusStream(mint), 2000);
    }
  });

  ws.on('error', (err: Error) => {
    console.error(`WS Error for ${mint}:`, err);
  });

  connections.set(mint, ws);
}

console.log("Market Stream Worker started. Waiting for pings in active_streams...");
