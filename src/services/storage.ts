import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stock, Watchlist } from '../types/stock';

interface CachedData {
  topGainers: Stock[];
  topLosers: Stock[];
  watchlists: Watchlist[];
  theme: 'light' | 'dark';
  lastUpdated: string;
}

class StorageService {
  private static readonly CACHE_KEY = 'stockapp_cache';
  private static readonly THEME_KEY = 'theme_preference';
  private static readonly WATCHLISTS_KEY = 'watchlists_data';
  private static readonly CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

  static async saveData(data: Partial<CachedData>): Promise<void> {
    try {
      const existing = await this.getData();
      const updated = {
        ...existing,
        ...data,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(updated));
    } catch (error) {
    }
  }

  static async getData(): Promise<CachedData | null> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const data: CachedData = JSON.parse(cached);
      const lastUpdated = new Date(data.lastUpdated);
      const now = new Date();

      const isMarketDataExpired = now.getTime() - lastUpdated.getTime() > this.CACHE_EXPIRY;

      if (isMarketDataExpired) {
        return {
          topGainers: [],
          topLosers: [],
          watchlists: data.watchlists || [],
          theme: data.theme || 'light',
          lastUpdated: data.lastUpdated,
        };
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  static async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
    }
  }

  static async saveTheme(theme: 'light' | 'dark'): Promise<void> {
    try {
      await AsyncStorage.setItem(this.THEME_KEY, theme);
    } catch (error) {
    }
  }

  static async getTheme(): Promise<'light' | 'dark' | null> {
    try {
      return await AsyncStorage.getItem(this.THEME_KEY) as 'light' | 'dark' | null;
    } catch (error) {
      return null;
    }
  }

  static async saveWatchlists(watchlists: Watchlist[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.WATCHLISTS_KEY, JSON.stringify(watchlists));
    } catch (error) {
    }
  }

  static async getWatchlists(): Promise<Watchlist[]> {
    try {
      const data = await AsyncStorage.getItem(this.WATCHLISTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  static async saveStockQuote(symbol: string, quote: any): Promise<void> {
    try {
      const key = `stock_quote_${symbol}`;
      const data = {
        quote,
        timestamp: Date.now(),
        expiresAt: Date.now() + (30 * 60 * 1000),
      };
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
    }
  }

  static async getStockQuote(symbol: string): Promise<any | null> {
    try {
      const key = `stock_quote_${symbol}`;
      const data = await AsyncStorage.getItem(key);
      if (!data) return null;

      const parsed = JSON.parse(data);
      if (Date.now() > parsed.expiresAt) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return parsed.quote;
    } catch (error) {
      return null;
    }
  }

  static async saveFundamentals(symbol: string, fundamentals: any): Promise<void> {
    try {
      const key = `fundamentals_${symbol}`;
      const data = {
        fundamentals,
        timestamp: Date.now(),
        expiresAt: Date.now() + (60 * 60 * 1000),
      };
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
    }
  }

  static async getFundamentals(symbol: string): Promise<any | null> {
    try {
      const key = `fundamentals_${symbol}`;
      const data = await AsyncStorage.getItem(key);
      if (!data) return null;

      const parsed = JSON.parse(data);
      if (Date.now() > parsed.expiresAt) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return parsed.fundamentals;
    } catch (error) {
      return null;
    }
  }
}

export { StorageService };