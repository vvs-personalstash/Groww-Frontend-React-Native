import { StorageService } from './storage';

export interface CompanyFundamentals {
  symbol: string;
  name?: string;
  marketCap: number;
  peRatio: number;
  pegRatio: number;
  bookValue: number;
  dividendYield: number;
  eps: number;
  beta: number;
  week52High: number;
  week52Low: number;
  movingAverage50: number;
  movingAverage200: number;
  sharesOutstanding: number;
  revenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  totalDebt: number;
  totalCash: number;
  sector: string;
  industry: string;
  description: string;
}

class FundamentalsService {
  private cache = new Map<string, { data: CompanyFundamentals; timestamp: number }>();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  async getCompanyFundamentals(symbol: string): Promise<CompanyFundamentals> {
    // Check in-memory cache first
    const cached = this.cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('Returning fundamentals from in-memory cache for:', symbol);
      return cached.data;
    }

    // Check AsyncStorage cache
    const storedData = await StorageService.getFundamentals(symbol);
    if (storedData) {
      console.log('Returning fundamentals from AsyncStorage for:', symbol);
      // Update in-memory cache
      this.cache.set(symbol, {
        data: storedData,
        timestamp: Date.now(),
      });
      return storedData;
    }

    try {
      console.log('Fetching fresh fundamentals data for:', symbol);
      // In a real app, you would use AlphaVantage's OVERVIEW endpoint
      // const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`;

      // For demo, return mock data
      const fundamentals = this.getMockFundamentals(symbol);

      // Cache the result in memory
      this.cache.set(symbol, {
        data: fundamentals,
        timestamp: Date.now(),
      });

      // Save to AsyncStorage for persistence
      await StorageService.saveFundamentals(symbol, fundamentals);

      return fundamentals;
    } catch (error) {
      console.error('Failed to fetch fundamentals:', error);
      return this.getMockFundamentals(symbol);
    }
  }

  private getMockFundamentals(symbol: string): CompanyFundamentals {
    const baseData = {
      symbol,
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
      sharesOutstanding: 1000000000 + Math.random() * 5000000000,
      revenue: 100000000000 + Math.random() * 200000000000,
      grossProfit: 50000000000 + Math.random() * 100000000000,
      operatingIncome: 25000000000 + Math.random() * 50000000000,
      netIncome: 15000000000 + Math.random() * 30000000000,
      totalDebt: 10000000000 + Math.random() * 50000000000,
      totalCash: 20000000000 + Math.random() * 100000000000,
      sector: 'Technology',
      industry: 'Software',
      description: `${symbol} is a leading technology company focused on innovative solutions and digital transformation.`,
    };

    // Customize based on symbol
    switch (symbol) {
      case 'AAPL':
        return {
          ...baseData,
          sector: 'Technology',
          industry: 'Consumer Electronics',
          description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
        };
      case 'GOOGL':
        return {
          ...baseData,
          sector: 'Communication Services',
          industry: 'Internet Content & Information',
          description: 'Alphabet Inc. provides online advertising services in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.',
        };
      case 'MSFT':
        return {
          ...baseData,
          sector: 'Technology',
          industry: 'Software—Infrastructure',
          description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.',
        };
      default:
        return baseData;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const fundamentalsService = new FundamentalsService();