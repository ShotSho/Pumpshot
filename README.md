# Pumpshot

> Replay the Pump.

Pumpshot is an on-chain trade replay platform for Solana memecoin traders.

Instead of showing only the final PnL, Pumpshot reconstructs the full journey of a trade, including entries, drawdowns, unrealized gains, partial take-profits, exits, and realized profit.

The goal is simple:

> Turn every great trade into a replayable on-chain highlight.

---

## Overview

Trading memecoins often feels like playing a game.

Traditional PnL cards only show the final score.

They do not show:

- how early the trader entered
- how much drawdown they survived
- how high the position went
- when they started taking profit
- how much of the move they captured
- whether they exited near the top
- how long they held the position

Pumpshot reconstructs those moments directly from Solana on-chain activity.

---

## Core Experience

A user provides:

```text
Wallet Address
+
Token Mint
```

Pumpshot then reconstructs the trade.

Example:

```text
ENTRY
$42K MC
5.2 SOL

↓

MAX DRAWDOWN
-31%

↓

10X

↓

PARTIAL TP
20%

↓

NEW POSITION HIGH

↓

FINAL EXIT
$3.4M MC

↓

REALIZED PNL
+35.5 SOL
```

The entire trade can then be replayed on an interactive chart.

---

## Key Features

### Trade Replay

Replay the full lifecycle of a Solana trade.

Supported replay events include:

```text
BUY
ADD
SELL
PARTIAL TP
FULL EXIT
BREAK EVEN
MAX DRAWDOWN
NEW HIGH
2X
5X
10X
25X
50X
100X
```

---

### On-Chain Trade Reconstruction

Pumpshot reconstructs wallet activity from Solana transaction data.

The system identifies:

- token purchases
- token sales
- token balance changes
- SOL spent
- SOL received
- transaction fees
- partial exits
- remaining positions

---

### PnL Analytics

Pumpshot calculates:

- total SOL invested
- total SOL returned
- realized PnL
- unrealized PnL
- ROI
- weighted average entry
- average exit
- holding time
- maximum drawdown
- peak unrealized PnL
- entry market cap
- exit market cap
- peak market cap while holding

---

### Interactive Trade Chart

Wallet events are overlaid directly on the token chart.

Example:

```text
                 SELL ▲

          ┌───────────────
         /
        /
BUY ▼  /
──────
```

The replay moves chronologically through the wallet's actual trade history.

---

### Find My Best Shot

Users can scan a wallet and discover its strongest historical trades.

Example:

```text
YOUR BEST SHOTS

1. $CYBERLEEK    +14,820%
2. $TOKEN         +4,291%
3. $TOKEN         +1,842%
4. $TOKEN           +973%
```

Each trade can be opened as its own replay.

---

### Public Replay Pages

Every replay can have a public URL.

Example:

```text
pumpshot.fun/shot/7H3KQ
```

These pages are designed to be shared publicly without requiring wallet connection.

---

### Shareable Shots

Pumpshot can generate trade highlight cards.

Example:

```text
PUMPSHOT

$CYBERLEEK

+4,328%

$4,200 → $186,000

ENTRY
$42K MC

MAX DRAWDOWN
-42%

EXIT
$3.4M MC

pumpshot.fun
```

Planned formats:

```text
1200x675
1080x1080
1080x1920
```

Future support:

```text
MP4
WebM
GIF
```

---

## Architecture

```text
                    ┌─────────────────┐
                    │     Next.js     │
                    │    Frontend     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    API Layer    │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
     ┌─────────────────┐          ┌─────────────────┐
     │  Replay Service │          │  Wallet Scanner │
     └────────┬────────┘          └────────┬────────┘
              │                             │
              └──────────────┬──────────────┘
                             ▼
                    ┌─────────────────┐
                    │  Indexing Queue │
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │ Helius Indexer  │
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │ Swap Normalizer │
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │ Position Engine │
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │Analytics Engine │
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │  Replay Engine  │
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    └─────────────────┘
```

---

## Tech Stack

### Frontend

```text
Next.js
TypeScript
Tailwind CSS
TradingView Lightweight Charts
Framer Motion
TanStack Query
Zustand
```

### Backend

```text
Node.js
Fastify or Next.js API
PostgreSQL
Redis
BullMQ
```

### Solana Infrastructure

```text
Helius RPC
Helius Enhanced Transactions
Helius Historical APIs
Helius DAS API
Helius Webhooks
```

---

## Helius Integration

Pumpshot is designed around Helius as the primary Solana infrastructure provider.

### Enhanced Transactions

Used to parse human-readable Solana transaction activity.

https://www.helius.dev/docs/api-reference/enhanced-transactions/overview

Address transaction history:

https://www.helius.dev/docs/api-reference/enhanced-transactions/gettransactionsbyaddress

---

### Historical Transaction Indexing

Used for large wallet scans and historical backfills.

https://www.helius.dev/historical-data

https://www.helius.dev/blog/introducing-gettransactionsforaddress

---

### Token Metadata

Pumpshot uses the Helius DAS API for token information.

https://www.helius.dev/docs/das-api

https://www.helius.dev/docs/api-reference/das

---

### Webhooks

Webhooks can be used to update indexed wallets and active positions.

https://www.helius.dev/docs/webhooks

https://www.helius.dev/docs/api-reference/webhooks

---

## Initial Protocol Support

The first version should prioritize:

```text
Pump.fun Bonding Curve
PumpSwap
Jupiter-routed Pump.fun / PumpSwap trades
```

Future support can include:

```text
Raydium
Meteora
Orca
Other Solana liquidity venues
```

Accuracy is more important than supporting every protocol immediately.

---

## Position Reconstruction

Pumpshot reconstructs a position from normalized trade events.

Example:

```text
09:13
BUY
5 SOL
12,000,000 TOKEN

09:18
BUY
3 SOL
4,500,000 TOKEN

10:02
SELL
4,000,000 TOKEN
6.2 SOL

10:30
SELL
12,500,000 TOKEN
34 SOL
```

The engine calculates:

```text
Weighted Average Entry
Average Exit
Total Cost Basis
Realized PnL
Unrealized PnL
Remaining Position
ROI
Holding Time
Maximum Drawdown
Peak Unrealized PnL
```

---

## Swap Detection

Buy and sell classification must be based on wallet balance deltas.

Example buy:

```text
SOL Balance      ↓
Token Balance    ↑
```

Example sell:

```text
Token Balance    ↓
SOL Balance      ↑
```

The parser must handle:

```text
WSOL wrapping
WSOL unwrapping
Jito tips
Priority fees
ATA creation
Rent
Aggregator routes
Partial exits
Multiple swaps in one transaction
Failed transactions
```

---

## Candle Reconstruction

Pumpshot can reconstruct chart candles from normalized market-wide swap activity.

Price:

```text
Execution Price
=
Quote Amount
/
Token Amount
```

Supported intervals can include:

```text
1s
5s
15s
1m
5m
15m
1h
```

Each candle contains:

```ts
type Candle = {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}
```

Important:

The chart should not be reconstructed only from the target wallet's trades.

Pumpshot needs market-wide token activity during the replay window.

---

## Maximum Drawdown

Maximum drawdown represents the worst decline experienced while the wallet was holding the position.

Example:

```text
Peak Position Value
180

Later Position Value
110
```

Calculation:

```text
(110 - 180) / 180

= -38.89%
```

This metric helps show what the trader had to hold through before reaching the final result.

---

## API Structure

Suggested endpoints:

### Create Replay

```http
POST /api/replays
```

```json
{
  "wallet": "WALLET_ADDRESS",
  "mint": "TOKEN_MINT"
}
```

---

### Replay Job Status

```http
GET /api/replays/jobs/:jobId
```

---

### Get Replay

```http
GET /api/replays/:slug
```

---

### Wallet Best Shots

```http
GET /api/wallets/:wallet/shots
```

---

### Token Candles

```http
GET /api/tokens/:mint/candles?interval=1m
```

---

## Database

Recommended tables:

```text
tokens
wallets
transactions
trade_events
positions
candles
replays
replay_events
wallet_stats
token_index_jobs
```

Important indexes:

```text
(wallet, mint)
(wallet, timestamp)
(mint, timestamp)
signature UNIQUE
```

---

## Environment Variables

Create:

```text
.env.local
```

Example:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

HELIUS_API_KEY=
HELIUS_RPC_URL=

DATABASE_URL=
REDIS_URL=

HELIUS_WEBHOOK_AUTH=
```

Never expose private infrastructure keys to the client.

---

## Local Development

Clone the repository:

```bash
git clone https://github.com/YOUR_ORG/pumpshot.git
cd pumpshot
```

Install dependencies:

```bash
npm install
```

Configure environment variables:

```bash
cp .env.example .env.local
```

Start development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Suggested Project Structure

```text
pumpshot/
│
├── app/
│   ├── api/
│   ├── shot/
│   ├── wallet/
│   └── page.tsx
│
├── components/
│   ├── chart/
│   ├── replay/
│   ├── trade/
│   └── wallet/
│
├── lib/
│   ├── helius/
│   ├── solana/
│   ├── pnl/
│   ├── candles/
│   ├── positions/
│   └── replay/
│
├── workers/
│   ├── wallet-indexer.ts
│   ├── token-indexer.ts
│   └── replay-builder.ts
│
├── db/
│   ├── schema/
│   └── migrations/
│
├── public/
│
├── README.md
└── .env.example
```

---

## Development Priorities

Build in this order:

```text
1. Helius client
2. Wallet transaction indexer
3. Mint-specific transaction filter
4. Swap normalizer
5. Buy / sell classification
6. Position reconstruction
7. PnL engine
8. Candle engine
9. Chart markers
10. Replay timeline
11. Replay animation
12. Public replay pages
13. Share cards
14. Find My Best Shot
```

Do not prioritize visual polish before trade accounting is accurate.

---

## MVP

### v0.1

```text
Wallet input
Token input
Historical transaction fetch
Buy detection
Sell detection
Position reconstruction
PnL calculation
Holding time
Chart
Buy markers
Sell markers
Replay animation
Public replay URL
```

### v0.2

```text
Maximum drawdown
Peak unrealized PnL
Entry market cap
Exit market cap
Peak market cap
Partial TP visualization
Replay speed controls
Share cards
```

### v0.3

```text
Connect wallet
Find My Best Shot
Wallet historical trades
Trending shots
Pumpshot Score
Wallet leaderboard
```

### Future

```text
Video replay export
Automatic X sharing
Public profiles
Live positions
Social features
Protocol expansion
```

---

## Accuracy Requirements

A replay is considered valid only when its buy and sell events can be verified against Solana transactions.

The accounting should match actual token and SOL balance changes within expected network and trading fee differences.

Pumpshot should prioritize:

```text
Accuracy
>
Replay quality
>
Visual polish
```

Never display fabricated trade events.

Never estimate PnL when the underlying position cannot be reconstructed reliably.

---

## Product Reference

Original inspiration:

Nathan Liow on X:

https://x.com/nathan_liow/status/2091674780315308410?s=46

Pumpshot should use the core trade-replay concept as inspiration while developing its own product identity, UX, analytics, architecture, and implementation.

---

## Additional References

TradingView Lightweight Charts:

https://tradingview.github.io/lightweight-charts/

GitHub:

https://github.com/tradingview/lightweight-charts

Solana Documentation:

https://solana.com/docs

Solana Web3.js:

https://github.com/solana-foundation/solana-web3.js

Helius:

https://www.helius.dev

---

## Product Principle

Pumpshot is not a traditional wallet analytics dashboard.

The chart is the replay.

The wallet transactions are the game events.

The trade journey is the story.

The PnL is only the final score.

---

## Pumpshot

Replay the Pump.
