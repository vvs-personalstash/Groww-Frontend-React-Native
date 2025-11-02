import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Bookmark, BookmarkCheck, TrendingUp, Building2, BarChart3, DollarSign, Activity, TrendingDown } from 'lucide-react-native';
import { StockChart } from '../components/StockChart';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { WatchlistModal } from '../components/WatchlistModal';
import { useAppContext } from '../context/AppContext';
import { apiService } from '../services/api';
import { fundamentalsService } from '../services/fundamentals';
import { StockQuote, StockTimeSeries } from '../types/stock';
import { lightTheme, darkTheme } from '../constants/theme';

export default function StockDetailsScreen() {
  const { state, dispatch } = useAppContext();
  const navigation = useNavigation();
  const theme = state.theme === 'light' ? lightTheme : darkTheme;
  const { width } = useWindowDimensions();
  const styles = createStyles(theme, width);

  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [timeSeries, setTimeSeries] = useState<StockTimeSeries[]>([]);
  const [companyOverview, setCompanyOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);

  const selectedStock = state.selectedStock;

  useEffect(() => {
    if (selectedStock) {
      loadStockData();
    }
  }, [selectedStock]);

  const loadStockData = async () => {
    if (!selectedStock) return;

    setLoading(true);
    setError(null);

    try {
      const [quoteData, timeSeriesData, fundamentalsData] = await Promise.allSettled([
        apiService.getStockQuote(selectedStock.symbol),
        apiService.getStockTimeSeries(selectedStock.symbol),
        fundamentalsService.getCompanyFundamentals(selectedStock.symbol),
      ]);

      if (quoteData.status === 'fulfilled') {
        setQuote(quoteData.value);
      }

      if (timeSeriesData.status === 'fulfilled') {
        setTimeSeries(timeSeriesData.value);
      }

      if (fundamentalsData.status === 'fulfilled') {
        setCompanyOverview(fundamentalsData.value);
      }

      if (quoteData.status === 'rejected' && timeSeriesData.status === 'rejected' && fundamentalsData.status === 'rejected') {
        setError('Failed to load stock data. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  const isInWatchlist = () => {
    if (!selectedStock) return false;
    return state.watchlists.some(watchlist =>
      watchlist.stocks.includes(selectedStock.symbol)
    );
  };

  const handleWatchlistToggle = () => {
    if (!selectedStock) return;

    if (isInWatchlist()) {
      state.watchlists.forEach(watchlist => {
        if (watchlist.stocks.includes(selectedStock.symbol)) {
          dispatch({
            type: 'REMOVE_FROM_WATCHLIST',
            payload: { watchlistId: watchlist.id, symbol: selectedStock.symbol },
          });
        }
      });
      Alert.alert('Removed', 'Stock removed from watchlists.');
    } else {
      setShowWatchlistModal(true);
    }
  };

  if (!selectedStock) {
    return (
      <View style={styles.container}>
        <ErrorState message="No stock selected" />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.symbol}>{selectedStock.symbol}</Text>
          <View style={styles.placeholder} />
        </View>
        <LoadingSpinner message="Loading stock details..." />
      </View>
    );
  }

  if (error && !quote && !timeSeries.length && !companyOverview) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.symbol}>{selectedStock.symbol}</Text>
          <View style={styles.placeholder} />
        </View>
        <ErrorState message={error} onRetry={loadStockData} />
      </View>
    );
  }

  const currentQuote = quote || {
    symbol: selectedStock.symbol,
    price: selectedStock.price,
    change: selectedStock.change,
    changePercent: selectedStock.changePercent,
    volume: selectedStock.volume,
    previousClose: selectedStock.price - selectedStock.change,
    open: selectedStock.price - selectedStock.change + 1,
    dayHigh: selectedStock.price + 5,
    dayLow: selectedStock.price - 5,
  };

  const isPositive = currentQuote.change >= 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.symbol}>{currentQuote.symbol}</Text>
            {companyOverview?.name && (
              <Text style={styles.companyName} numberOfLines={1}>
                {companyOverview.name}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={handleWatchlistToggle} style={styles.watchlistButton}>
            {isInWatchlist() ? (
              <BookmarkCheck size={24} color={theme.colors.primary} />
            ) : (
              <Bookmark size={24} color={theme.colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Price Section */}
        <View style={styles.priceSection}>
          <Text style={styles.price}>${currentQuote.price.toFixed(2)}</Text>
          <View style={styles.changeRow}>
            <View style={isPositive ? styles.changeIndicatorPositive : styles.changeIndicatorNegative}>
              {isPositive ? (
                <TrendingUp size={16} color={theme.colors.success} />
              ) : (
                <TrendingDown size={16} color={theme.colors.error} />
              )}
              <Text style={isPositive ? styles.changeTextPositive : styles.changeTextNegative}>
                {isPositive ? '+' : ''}{currentQuote.change.toFixed(2)} ({isPositive ? '+' : ''}{currentQuote.changePercent.toFixed(2)}%)
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Enhanced Chart Section */}
        {timeSeries.length > 0 && (
          <View style={styles.chartCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <TrendingUp size={20} color={theme.colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>Price Chart (30 Days)</Text>
            </View>
            <View style={styles.chartContainer}>
              <StockChart data={timeSeries} />
            </View>
          </View>
        )}

        {/* Price Range Indicator */}
        <View style={styles.priceRangeCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconContainer}>
              <BarChart3 size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Today's Range</Text>
          </View>
          
          <View style={styles.priceRangeContainer}>
            <View style={styles.priceRangeLabels}>
              <Text style={styles.rangeLowLabel}>Low: ${currentQuote.dayLow.toFixed(2)}</Text>
              <Text style={styles.rangeHighLabel}>High: ${currentQuote.dayHigh.toFixed(2)}</Text>
            </View>

            <View style={styles.priceRangeBar}>
              <View style={styles.rangeTrack} />
              <View
                style={[
                  isPositive ? styles.rangeTrianglePositive : styles.rangeTriangleNegative,
                  {
                    left: `${Math.min(Math.max(((currentQuote.price - currentQuote.dayLow) / (currentQuote.dayHigh - currentQuote.dayLow)) * 100, 0), 100)}%`,
                  }
                ]}
              />
              <View
                style={[
                  isPositive ? styles.rangePointerPositive : styles.rangePointerNegative,
                  {
                    left: `${Math.min(Math.max(((currentQuote.price - currentQuote.dayLow) / (currentQuote.dayHigh - currentQuote.dayLow)) * 100, 0), 100)}%`,
                  }
                ]}
              />
            </View>

            <View style={styles.currentPriceIndicator}>
              <Text style={isPositive ? styles.currentPriceTextPositive : styles.currentPriceTextNegative}>
                Current: ${currentQuote.price.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats Cards */}
        <View style={styles.quickStatsContainer}>
          <View style={styles.quickStatCard}>
            <View style={styles.statIcon}>
              <Activity size={18} color={theme.colors.primary} />
            </View>
            <Text style={styles.statLabel}>Volume</Text>
            <Text style={styles.statValue}>{currentQuote.volume.toLocaleString()}</Text>
          </View>
          <View style={styles.quickStatCard}>
            <View style={styles.statIcon}>
              <DollarSign size={18} color={theme.colors.primary} />
            </View>
            <Text style={styles.statLabel}>Previous Close</Text>
            <Text style={styles.statValue}>${currentQuote.previousClose.toFixed(2)}</Text>
          </View>
        </View>

        {/* Enhanced Company Overview */}
        {companyOverview ? (
          <View style={styles.overviewCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <Building2 size={20} color={theme.colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>Company Overview</Text>
            </View>

            {companyOverview.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.description}>{companyOverview.description}</Text>
              </View>
            )}

            <View style={styles.overviewGrid}>
              {companyOverview.sector && (
                <View style={styles.overviewItem}>
                  <Text style={styles.overviewLabel}>Sector</Text>
                  <Text style={styles.overviewValue}>{companyOverview.sector}</Text>
                </View>
              )}
              {companyOverview.industry && (
                <View style={styles.overviewItem}>
                  <Text style={styles.overviewLabel}>Industry</Text>
                  <Text style={styles.overviewValue}>{companyOverview.industry}</Text>
                </View>
              )}
              {companyOverview.marketCap > 0 && (
                <View style={styles.overviewItem}>
                  <Text style={styles.overviewLabel}>Market Cap</Text>
                  <Text style={styles.overviewValue}>
                    ${(companyOverview.marketCap / 1000000000).toFixed(2)}B
                  </Text>
                </View>
              )}
              {companyOverview.peRatio > 0 && (
                <View style={styles.overviewItem}>
                  <Text style={styles.overviewLabel}>P/E Ratio</Text>
                  <Text style={styles.overviewValue}>{companyOverview.peRatio.toFixed(2)}</Text>
                </View>
              )}
              {companyOverview.eps > 0 && (
                <View style={styles.overviewItem}>
                  <Text style={styles.overviewLabel}>EPS</Text>
                  <Text style={styles.overviewValue}>${companyOverview.eps.toFixed(2)}</Text>
                </View>
              )}
              {companyOverview.beta > 0 && (
                <View style={styles.overviewItem}>
                  <Text style={styles.overviewLabel}>Beta</Text>
                  <Text style={styles.overviewValue}>{companyOverview.beta.toFixed(2)}</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.overviewCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <Building2 size={20} color={theme.colors.textSecondary} />
              </View>
              <Text style={styles.sectionTitle}>Company Overview</Text>
            </View>
            <View style={styles.emptyOverview}>
              <Text style={styles.emptyOverviewText}>
                Company information is currently unavailable.
              </Text>
            </View>
          </View>
        )}

        {/* Enhanced Market Data */}
        <View style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconContainer}>
              <DollarSign size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Market Data</Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Previous Close</Text>
              <Text style={styles.infoValue}>${currentQuote.previousClose.toFixed(2)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Open</Text>
              <Text style={styles.infoValue}>${currentQuote.open.toFixed(2)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Day High</Text>
              <Text style={styles.infoValue}>${currentQuote.dayHigh.toFixed(2)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Day Low</Text>
              <Text style={styles.infoValue}>${currentQuote.dayLow.toFixed(2)}</Text>
            </View>
            {companyOverview?.week52High > 0 && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>52W High</Text>
                <Text style={styles.infoValue}>${companyOverview.week52High.toFixed(2)}</Text>
              </View>
            )}
            {companyOverview?.week52Low > 0 && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>52W Low</Text>
                <Text style={styles.infoValue}>${companyOverview.week52Low.toFixed(2)}</Text>
              </View>
            )}
            {companyOverview?.dividendYield > 0 && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Dividend Yield</Text>
                <Text style={styles.infoValue}>{companyOverview.dividendYield.toFixed(2)}%</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom padding for better scrolling */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <WatchlistModal
        visible={showWatchlistModal}
        onClose={() => setShowWatchlistModal(false)}
        stockSymbol={selectedStock.symbol}
      />
    </View>
  );
}

function createStyles(theme: typeof lightTheme, screenWidth: number) {
  const isTablet = screenWidth >= 768;
  const isDesktop = screenWidth >= 1200;
  const isSmallScreen = screenWidth < 480;
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: 50,
    },
    headerContainer: {
      backgroundColor: theme.colors.surface,
      paddingBottom: theme.spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '30',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    backButton: {
      padding: theme.spacing.sm,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
    },
    symbol: {
      fontSize: isDesktop ? 28 : isTablet ? 24 : 22,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      fontFamily: 'Inter-Bold',
      letterSpacing: 0.5,
    },
    companyName: {
      fontSize: isTablet ? theme.typography.fontSize.md : theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      marginTop: 4,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
    },
    watchlistButton: {
      padding: theme.spacing.sm,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
    },
    placeholder: {
      width: 40,
    },
    priceSection: {
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
    },
    price: {
      fontSize: isDesktop ? 48 : isTablet ? 42 : 36,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      fontFamily: 'Inter-Bold',
      letterSpacing: -0.5,
    },
    changeRow: {
      marginTop: theme.spacing.md,
    },
    changeIndicatorPositive: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: 8,
      gap: theme.spacing.xs,
      backgroundColor: theme.colors.success + '15',
    },
    changeIndicatorNegative: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: 8,
      gap: theme.spacing.xs,
      backgroundColor: theme.colors.error + '15',
    },
    changeTextPositive: {
      fontSize: isTablet ? theme.typography.fontSize.md : theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.success,
    },
    changeTextNegative: {
      fontSize: isTablet ? theme.typography.fontSize.md : theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.error,
    },
    content: {
      flex: 1,
      paddingTop: theme.spacing.lg,
    },
    chartCard: {
      marginHorizontal: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border + '20',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
      paddingBottom: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '20',
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: isTablet ? theme.typography.fontSize.lg : theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      fontFamily: 'Inter-Bold',
      letterSpacing: 0.3,
    },
    chartContainer: {
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: theme.colors.background,
      padding: theme.spacing.sm,
    },
    priceRangeCard: {
      marginHorizontal: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border + '20',
    },
    priceRangeContainer: {
      paddingVertical: theme.spacing.sm,
    },
    priceRangeLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.lg,
    },
    rangeLowLabel: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.error,
      fontFamily: 'Inter-SemiBold',
      fontWeight: theme.typography.fontWeight.semibold,
    },
    rangeHighLabel: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.success,
      fontFamily: 'Inter-SemiBold',
      fontWeight: theme.typography.fontWeight.semibold,
    },
    priceRangeBar: {
      height: 24,
      position: 'relative',
      marginVertical: theme.spacing.md,
    },
    rangeTrack: {
      height: 8,
      borderRadius: 4,
      position: 'absolute',
      top: 8,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.border,
    },
    rangeTrianglePositive: {
      position: 'absolute',
      top: 0,
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderBottomWidth: 8,
      borderStyle: 'solid',
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: theme.colors.success,
      marginLeft: -6,
    },
    rangeTriangleNegative: {
      position: 'absolute',
      top: 0,
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderBottomWidth: 8,
      borderStyle: 'solid',
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: theme.colors.error,
      marginLeft: -6,
    },
    rangePointerPositive: {
      position: 'absolute',
      top: 6,
      width: 14,
      height: 14,
      borderRadius: 7,
      marginLeft: -7,
      borderWidth: 3,
      borderColor: theme.colors.surface,
      backgroundColor: theme.colors.success,
    },
    rangePointerNegative: {
      position: 'absolute',
      top: 6,
      width: 14,
      height: 14,
      borderRadius: 7,
      marginLeft: -7,
      borderWidth: 3,
      borderColor: theme.colors.surface,
      backgroundColor: theme.colors.error,
    },
    currentPriceIndicator: {
      alignItems: 'center',
      marginTop: theme.spacing.md,
    },
    currentPriceTextPositive: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.bold,
      fontFamily: 'Inter-Bold',
      color: theme.colors.success,
    },
    currentPriceTextNegative: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.bold,
      fontFamily: 'Inter-Bold',
      color: theme.colors.error,
    },
    quickStatsContainer: {
      flexDirection: 'row',
      marginHorizontal: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    quickStatCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      padding: theme.spacing.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border + '20',
    },
    statIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: theme.colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
    statLabel: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
      fontFamily: 'Inter-Regular',
      marginBottom: theme.spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statValue: {
      fontSize: isTablet ? theme.typography.fontSize.lg : theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      fontFamily: 'Inter-Bold',
      textAlign: 'center',
    },
    overviewCard: {
      marginHorizontal: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border + '20',
    },
    descriptionContainer: {
      backgroundColor: theme.colors.background,
      padding: theme.spacing.lg,
      borderRadius: 12,
      marginBottom: theme.spacing.lg,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
    },
    description: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text,
      lineHeight: 24,
      fontFamily: 'Inter-Regular',
    },
    emptyOverview: {
      padding: theme.spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyOverviewText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      fontFamily: 'Inter-Regular',
    },
    overviewGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
    },
    overviewItem: {
      width: isDesktop ? '31%' : isTablet ? '47%' : '47%',
      backgroundColor: theme.colors.background,
      padding: theme.spacing.lg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border + '30',
    },
    overviewLabel: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
      fontFamily: 'Inter-Medium',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      fontWeight: '500',
    },
    overviewValue: {
      fontSize: isTablet ? theme.typography.fontSize.lg : theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      fontFamily: 'Inter-Bold',
    },
    infoCard: {
      marginHorizontal: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border + '20',
    },
    infoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
    },
    infoItem: {
      width: isDesktop ? '31%' : isTablet ? '47%' : '47%',
      backgroundColor: theme.colors.background,
      padding: theme.spacing.lg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border + '30',
    },
    infoLabel: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
      fontFamily: 'Inter-Medium',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      fontWeight: '500',
    },
    infoValue: {
      fontSize: isTablet ? theme.typography.fontSize.lg : theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      fontFamily: 'Inter-Bold',
    },
    bottomPadding: {
      height: theme.spacing.xl * 2,
    },
  });
}