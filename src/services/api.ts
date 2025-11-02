import { Stock, StockQuote, StockTimeSeries, CacheEntry } from '../types/stock';
import { API_KEY, BASE_URL } from '@env';
import { StorageService } from './storage';

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 12000;

const cache = new Map<string, CacheEntry<any>>();
const CACHE_DURATION = 5 * 60 * 1000;

class ApiService {
  private async makeRequest(url: string): Promise<any> {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise<void>(resolve =>
        setTimeout(() => resolve(), MIN_REQUEST_INTERVAL - timeSinceLastRequest)
      );
    }
    lastRequestTime = Date.now();

    const cacheKey = url;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'User-Agent': 'ReactNative',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }
      if (data['Note']) {
        throw new Error(data['Note']);
      }
      if (data['Information']) {
        throw new Error(data['Information']);
      }

      cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION,
      });

      return data;
    } catch (error) {
      const cached = cache.get(cacheKey);
      if (cached) {
        return cached.data;
      }
      throw error;
    }
  }

  async getTopGainersLosers(): Promise<{ gainers: Stock[]; losers: Stock[] }> {
    try {
      const timestamp = Date.now();
      const url = `${BASE_URL}?function=TOP_GAINERS_LOSERS&apikey=${API_KEY}&_t=${timestamp}`;

      const data = await this.makeRequest(url);

      if (!data.top_gainers || !data.top_losers) {
        return this.getMockData();
      }

      const gainers: Stock[] = (data.top_gainers || []).slice(0, 20).map((item: any) => ({
        symbol: item.ticker,
        name: item.ticker,
        price: parseFloat(item.price),
        change: parseFloat(item.change_amount),
        changePercent: parseFloat(item.change_percentage.replace('%', '')),
        volume: parseInt(item.volume),
      }));

      const losers: Stock[] = (data.top_losers || []).slice(0, 20).map((item: any) => ({
        symbol: item.ticker,
        name: item.ticker,
        price: parseFloat(item.price),
        change: parseFloat(item.change_amount),
        changePercent: parseFloat(item.change_percentage.replace('%', '')),
        volume: parseInt(item.volume),
      }));

      return { gainers, losers };
    } catch (error) {
      return this.getMockData();
    }
  }

  async getStockQuote(symbol: string): Promise<StockQuote> {
    const cachedQuote = await StorageService.getStockQuote(symbol);
    if (cachedQuote) {
      return cachedQuote;
    }

    try {
      const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
      const data = await this.makeRequest(url);

      const quote = data['Global Quote'];
      if (!quote || Object.keys(quote).length === 0) {
        throw new Error('Stock not found');
      }

      const stockQuote: StockQuote = {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        previousClose: parseFloat(quote['08. previous close']),
        open: parseFloat(quote['02. open']),
        dayHigh: parseFloat(quote['03. high']),
        dayLow: parseFloat(quote['04. low']),
      };

      await StorageService.saveStockQuote(symbol, stockQuote);

      return stockQuote;
    } catch (error) {
      return this.getMockQuote(symbol);
    }
  }

  async getStockTimeSeries(symbol: string): Promise<StockTimeSeries[]> {
    try {
      const url = `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`;
      const data = await this.makeRequest(url);

      const timeSeries = data['Time Series (Daily)'];
      if (!timeSeries) {
        throw new Error('Time series data not found');
      }

      const entries = Object.entries(timeSeries)
        .slice(0, 30)
        .map(([date, values]: [string, any]) => ({
          timestamp: date,
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseInt(values['5. volume']),
        }))
        .reverse();

      return entries;
    } catch (error) {
      return this.getMockTimeSeries();
    }
  }

  async searchStocks(query: string): Promise<Array<{symbol: string; name: string; type: string; region: string}>> {
    try {
      const url = `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${API_KEY}`;
      const data = await this.makeRequest(url);

      const matches = data['bestMatches'] || [];
      return matches.slice(0, 10).map((match: any) => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        type: match['3. type'],
        region: match['4. region'],
      }));
    } catch (error) {
      return this.getMockSearchResults(query);
    }
  }

  async getCompanyOverview(symbol: string): Promise<any> {
    try {
      const url = `${BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`;
      const data = await this.makeRequest(url);

      if (!data.Symbol) {
        throw new Error('Company overview not found');
      }

      return {
        symbol: data.Symbol,
        name: data.Name,
        description: data.Description,
        sector: data.Sector,
        industry: data.Industry,
        marketCap: parseFloat(data.MarketCapitalization) || 0,
        peRatio: parseFloat(data.PERatio) || 0,
        pegRatio: parseFloat(data.PEGRatio) || 0,
        bookValue: parseFloat(data.BookValue) || 0,
        dividendYield: parseFloat(data.DividendYield) || 0,
        eps: parseFloat(data.EPS) || 0,
        beta: parseFloat(data.Beta) || 0,
        week52High: parseFloat(data['52WeekHigh']) || 0,
        week52Low: parseFloat(data['52WeekLow']) || 0,
        movingAverage50: parseFloat(data['50DayMovingAverage']) || 0,
        movingAverage200: parseFloat(data['200DayMovingAverage']) || 0,
      };
    } catch (error) {
      return this.getMockCompanyOverview(symbol);
    }
  }

  private getMockData(): { gainers: Stock[]; losers: Stock[] } {
    const gainers: Stock[] = [
      { symbol: 'AAPL', name: 'Apple Inc.', price: 150.25, change: 5.75, changePercent: 3.98, volume: 45623000 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2750.80, change: 85.30, changePercent: 3.20, volume: 1234000 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', price: 305.15, change: 8.90, changePercent: 3.01, volume: 23456000 },
      { symbol: 'TSLA', name: 'Tesla Inc.', price: 850.45, change: 22.10, changePercent: 2.67, volume: 18934000 },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 3200.75, change: 65.25, changePercent: 2.08, volume: 3456000 },
      { symbol: 'NFLX', name: 'Netflix Inc.', price: 425.60, change: 8.15, changePercent: 1.95, volume: 5678000 },
      { symbol: 'META', name: 'Meta Platforms', price: 320.90, change: 12.50, changePercent: 4.06, volume: 15678000 },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 520.30, change: 18.75, changePercent: 3.74, volume: 25789000 },
      { symbol: 'AMD', name: 'Advanced Micro Devices', price: 105.45, change: 3.80, changePercent: 3.74, volume: 45123000 },
      { symbol: 'CRM', name: 'Salesforce Inc.', price: 195.75, change: 6.25, changePercent: 3.30, volume: 8901000 },
    ];

    const losers: Stock[] = [
      { symbol: 'INTC', name: 'Intel Corp.', price: 45.20, change: -1.65, changePercent: -3.52, volume: 67890000 },
      { symbol: 'UBER', name: 'Uber Technologies', price: 32.10, change: -1.05, changePercent: -3.17, volume: 23456000 },
      { symbol: 'SNAP', name: 'Snap Inc.', price: 12.45, change: -0.40, changePercent: -3.11, volume: 89012000 },
      { symbol: 'TWTR', name: 'Twitter Inc.', price: 38.90, change: -1.20, changePercent: -2.99, volume: 34567000 },
      { symbol: 'ROKU', name: 'Roku Inc.', price: 65.30, change: -1.85, changePercent: -2.75, volume: 12345000 },
      { symbol: 'ZOOM', name: 'Zoom Video', price: 78.20, change: -2.10, changePercent: -2.61, volume: 56789000 },
      { symbol: 'SHOP', name: 'Shopify Inc.', price: 45.80, change: -1.15, changePercent: -2.45, volume: 78901000 },
      { symbol: 'SQ', name: 'Block Inc.', price: 67.40, change: -1.60, changePercent: -2.32, volume: 23456000 },
      { symbol: 'PYPL', name: 'PayPal Holdings', price: 89.50, change: -2.00, changePercent: -2.19, volume: 45678000 },
      { symbol: 'SPOT', name: 'Spotify Technology', price: 123.70, change: -2.70, changePercent: -2.14, volume: 34567000 },
    ];

    return { gainers, losers };
  }

  private getMockQuote(symbol: string): StockQuote {
    const basePrice = 100 + Math.random() * 400;
    const change = (Math.random() - 0.5) * 20;
    return {
      symbol,
      price: basePrice,
      change: change,
      changePercent: (change / (basePrice - change)) * 100,
      volume: Math.floor(Math.random() * 50000000) + 1000000,
      previousClose: basePrice - change,
      open: basePrice - change + (Math.random() - 0.5) * 5,
      dayHigh: basePrice + Math.random() * 10,
      dayLow: basePrice - Math.random() * 10,
    };
  }

  private getMockTimeSeries(): StockTimeSeries[] {
    const data: StockTimeSeries[] = [];
    const basePrice = 150;
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      data.push({
        timestamp: date.toISOString().split('T')[0],
        open: basePrice,
        high: basePrice,
        low: basePrice,
        close: basePrice,
        volume: 25000000,
      });
    }

    return data;
  }

  private getMockSearchResults(query: string): Array<{symbol: string; name: string; type: string; region: string}> {
    const mockStocks = [
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'Equity', region: 'United States' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Equity', region: 'United States' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Equity', region: 'United States' },
      { symbol: 'TSLA', name: 'Tesla Inc.', type: 'Equity', region: 'United States' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'Equity', region: 'United States' },
      { symbol: 'META', name: 'Meta Platforms Inc.', type: 'Equity', region: 'United States' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'Equity', region: 'United States' },
      { symbol: 'NFLX', name: 'Netflix Inc.', type: 'Equity', region: 'United States' },
    ];

    return mockStocks.filter(stock => 
      stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  private getMockCompanyOverview(symbol: string): any {
    return {
      symbol,
      name: `${symbol} Company`,
      description: `${symbol} is a leading technology company focused on innovative solutions and digital transformation.`,
      sector: 'Technology',
      industry: 'Software',
      marketCap: 2500000000000 + Math.random() * 1000000000000,
      peRatio: 15 + Math.random() * 20,
      pegRatio: 0.5 + Math.random() * 2,
      bookValue: 10 + Math.random() * 50,
      dividendYield: Math.random() * 5,
      eps: 5 + Math.random() * 15,
      beta: 0.5 + Math.random() * 1.5,
      week52High: 200 + Math.random() * 100,
      week52Low: 100 + Math.random() * 50,
      movingAverage50: 150 + Math.random() * 50,
      movingAverage200: 140 + Math.random() * 60,
    };
  }

  clearCache(): void {
    cache.clear();
  }
}

export const apiService = new ApiService();