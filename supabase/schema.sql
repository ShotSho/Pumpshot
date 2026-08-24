-- Pumpshot Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: tracked_wallets
CREATE TABLE IF NOT EXISTS tracked_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    label TEXT,
    tracking_enabled BOOLEAN DEFAULT TRUE,
    historical_scan_status TEXT DEFAULT 'PENDING',
    historical_scan_started_at TIMESTAMPTZ,
    historical_scan_completed_at TIMESTAMPTZ,
    oldest_indexed_slot BIGINT,
    last_indexed_slot BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: wallet_positions
CREATE TABLE IF NOT EXISTS wallet_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT NOT NULL,
    mint TEXT NOT NULL,
    position_number INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('OPEN', 'CLOSED')),
    first_entry_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    total_tokens_bought NUMERIC,
    total_tokens_sold NUMERIC,
    remaining_tokens NUMERIC,
    total_sol_spent NUMERIC,
    total_sol_received NUMERIC,
    average_entry_sol NUMERIC,
    average_exit_sol NUMERIC,
    realized_pnl_sol NUMERIC,
    unrealized_pnl_sol NUMERIC,
    entry_market_cap NUMERIC,
    current_market_cap NUMERIC,
    peak_market_cap NUMERIC,
    exit_market_cap NUMERIC,
    max_drawdown_pct NUMERIC,
    peak_unrealized_pct NUMERIC,
    data_quality TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(wallet_address, mint, position_number)
);

-- Table: position_events
CREATE TABLE IF NOT EXISTS position_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position_id UUID REFERENCES wallet_positions(id) ON DELETE CASCADE,
    signature TEXT NOT NULL,
    slot BIGINT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('BUY', 'SELL')),
    token_amount NUMERIC NOT NULL,
    quote_mint TEXT NOT NULL,
    quote_symbol TEXT NOT NULL,
    quote_amount NUMERIC NOT NULL,
    execution_price_sol NUMERIC,
    execution_price_usd NUMERIC,
    execution_market_cap NUMERIC,
    execution_quality TEXT CHECK (execution_quality IN ('EXACT', 'DERIVED', 'BAR_ESTIMATE')),
    venue TEXT,
    metadata_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_positions_wallet ON wallet_positions(wallet_address);
CREATE INDEX idx_events_position ON position_events(position_id);
CREATE INDEX idx_events_signature ON position_events(signature);
