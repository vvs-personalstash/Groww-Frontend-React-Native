import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Stock, Watchlist, ApiResponse } from '../types/stock';
import { StorageService } from '../services/storage';

interface AppState {
  topGainers: ApiResponse<Stock[]>;
  topLosers: ApiResponse<Stock[]>;
  watchlists: Watchlist[];
  selectedStock: Stock | null;
  theme: 'light' | 'dark';
  isOffline: boolean;
}

type AppAction =
  | { type: 'SET_TOP_GAINERS'; payload: ApiResponse<Stock[]> }
  | { type: 'SET_TOP_LOSERS'; payload: ApiResponse<Stock[]> }
  | { type: 'SET_WATCHLISTS'; payload: Watchlist[] }
  | { type: 'ADD_WATCHLIST'; payload: Watchlist }
  | { type: 'UPDATE_WATCHLIST'; payload: Watchlist }
  | { type: 'DELETE_WATCHLIST'; payload: string }
  | { type: 'SET_SELECTED_STOCK'; payload: Stock | null }
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_OFFLINE_STATUS'; payload: boolean }
  | { type: 'ADD_TO_WATCHLIST'; payload: { watchlistId: string; symbol: string } }
  | { type: 'REMOVE_FROM_WATCHLIST'; payload: { watchlistId: string; symbol: string } };

const initialState: AppState = {
  topGainers: { data: [], loading: false },
  topLosers: { data: [], loading: false },
  watchlists: [
    {
      id: 'default',
      name: 'My Watchlist',
      stocks: [],
      createdAt: new Date().toISOString(),
    },
  ],
  selectedStock: null,
  theme: 'light',
  isOffline: false,
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_TOP_GAINERS':
      return { ...state, topGainers: action.payload };
    case 'SET_TOP_LOSERS':
      return { ...state, topLosers: action.payload };
    case 'SET_WATCHLISTS':
      // Save watchlists to storage whenever they change
      StorageService.saveWatchlists(action.payload);
      return { ...state, watchlists: action.payload };
    case 'ADD_WATCHLIST':
      const newWatchlists = [...state.watchlists, action.payload];
      StorageService.saveWatchlists(newWatchlists);
      return { ...state, watchlists: newWatchlists };
    case 'UPDATE_WATCHLIST':
      const updatedWatchlists = state.watchlists.map(w =>
        w.id === action.payload.id ? action.payload : w
      );
      StorageService.saveWatchlists(updatedWatchlists);
      return { ...state, watchlists: updatedWatchlists };
    case 'DELETE_WATCHLIST':
      const filteredWatchlists = state.watchlists.filter(w => w.id !== action.payload);
      StorageService.saveWatchlists(filteredWatchlists);
      return { ...state, watchlists: filteredWatchlists };
    case 'SET_SELECTED_STOCK':
      return { ...state, selectedStock: action.payload };
    case 'TOGGLE_THEME':
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      StorageService.saveTheme(newTheme);
      return { ...state, theme: newTheme };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_OFFLINE_STATUS':
      return { ...state, isOffline: action.payload };
    case 'ADD_TO_WATCHLIST':
      const addedWatchlists = state.watchlists.map(w =>
        w.id === action.payload.watchlistId
          ? { ...w, stocks: [...w.stocks, action.payload.symbol] }
          : w
      );
      StorageService.saveWatchlists(addedWatchlists);
      return { ...state, watchlists: addedWatchlists };
    case 'REMOVE_FROM_WATCHLIST':
      const removedWatchlists = state.watchlists.map(w =>
        w.id === action.payload.watchlistId
          ? { ...w, stocks: w.stocks.filter(s => s !== action.payload.symbol) }
          : w
      );
      StorageService.saveWatchlists(removedWatchlists);
      return { ...state, watchlists: removedWatchlists };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    // Load saved data on app start
    const loadSavedData = async () => {
      try {
        // Load theme
        const savedTheme = await StorageService.getTheme();
        if (savedTheme) {
          dispatch({ type: 'SET_THEME', payload: savedTheme });
        }

        // Load watchlists
        const savedWatchlists = await StorageService.getWatchlists();
        if (savedWatchlists.length > 0) {
          dispatch({ type: 'SET_WATCHLISTS', payload: savedWatchlists });
        }

        // Load cached market data
        const cachedData = await StorageService.getData();
        if (cachedData) {
          if (cachedData.topGainers.length > 0) {
            dispatch({
              type: 'SET_TOP_GAINERS',
              payload: { data: cachedData.topGainers, loading: false },
            });
          }
          if (cachedData.topLosers.length > 0) {
            dispatch({
              type: 'SET_TOP_LOSERS',
              payload: { data: cachedData.topLosers, loading: false },
            });
          }
        }
      } catch (error) {
        console.error('Failed to load saved data:', error);
      }
    };

    loadSavedData();
  }, []);

  // Save market data to cache whenever it changes
  useEffect(() => {
    if (state.topGainers.data.length > 0 || state.topLosers.data.length > 0) {
      StorageService.saveData({
        topGainers: state.topGainers.data,
        topLosers: state.topLosers.data,
        theme: state.theme,
      });
    }
  }, [state.topGainers.data, state.topLosers.data, state.theme]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}