export type WalletState = {
  openPositions: any[];
  closedPositions: any[];
  activity: any[];
  walletStats: any;
  connectionState: "LIVE" | "RECONNECTING" | "DELAYED";
};

export type WalletAction = 
  | { type: "POSITION_INSERTED"; payload: any }
  | { type: "POSITION_UPDATED"; payload: any }
  | { type: "POSITION_CLOSED"; payload: any }
  | { type: "EVENT_INSERTED"; payload: any }
  | { type: "STATS_UPDATED"; payload: any }
  | { type: "CONNECTION_STATE_CHANGED"; payload: "LIVE" | "RECONNECTING" | "DELAYED" };

export function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case "POSITION_INSERTED": {
      // Avoid duplicates
      if (state.openPositions.find(p => p.id === action.payload.id)) return state;
      return {
        ...state,
        openPositions: [action.payload, ...state.openPositions]
      };
    }
    case "POSITION_UPDATED": {
      return {
        ...state,
        openPositions: state.openPositions.map(p => 
          p.id === action.payload.id ? { ...p, ...action.payload } : p
        )
      };
    }
    case "POSITION_CLOSED": {
      // Remove from open, add to closed
      const updatedOpen = state.openPositions.filter(p => p.id !== action.payload.id);
      // Avoid duplicate in closed
      if (state.closedPositions.find(p => p.id === action.payload.id)) {
        return { ...state, openPositions: updatedOpen };
      }
      return {
        ...state,
        openPositions: updatedOpen,
        closedPositions: [action.payload, ...state.closedPositions]
      };
    }
    case "EVENT_INSERTED": {
      // Avoid duplicates
      if (state.activity.find(e => e.id === action.payload.id)) return state;
      return {
        ...state,
        activity: [action.payload, ...state.activity]
      };
    }
    case "STATS_UPDATED": {
      return {
        ...state,
        walletStats: action.payload
      };
    }
    case "CONNECTION_STATE_CHANGED": {
      return {
        ...state,
        connectionState: action.payload
      };
    }
    default:
      return state;
  }
}
