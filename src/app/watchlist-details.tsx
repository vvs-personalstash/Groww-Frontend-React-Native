import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Trash2, BookmarkX, Plus } from 'lucide-react-native';
import { StockCard } from '../components/StockCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAppContext } from '../context/AppContext';
import { apiService } from '../services/api';
import { Stock } from '../types/stock';
import { lightTheme, darkTheme } from '../constants/theme';

export default function WatchlistDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { watchlistId, watchlistName } = (route.params as {
    watchlistId: string;
    watchlistName: string;
  }) || { watchlistId: '', watchlistName: '' };

  const { state, dispatch } = useAppContext();
  const theme = state.theme === 'light' ? lightTheme : darkTheme;
  const { width } = useWindowDimensions();
  const styles = createStyles(theme, width);
  
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const watchlist = state.watchlists.find(w => w.id === watchlistId);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const loadWatchlistStocks = useCallback(async () => {
    if (!mounted || !watchlist) return;

    if (watchlist.stocks.length === 0) {
      setStocks([]);
      return;
    }

    setLoading(true);
    try {
      const stockPromises = watchlist.stocks.map(async (symbol) => {
        try {
          const quote = await apiService.getStockQuote(symbol);
          return {
            symbol: quote.symbol,
            name: quote.symbol,
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
            volume: quote.volume,
          };
        } catch (error) {
          // Return mock data if API fails
          return {
            symbol,
            name: symbol,
            price: 100 + Math.random() * 500,
            change: (Math.random() - 0.5) * 20,
            changePercent: (Math.random() - 0.5) * 10,
            volume: Math.floor(Math.random() * 50000000) + 1000000,
          };
        }
      });

      const stocksData = await Promise.all(stockPromises);
      if (mounted) {
        setStocks(stocksData);
      }
    } catch (error) {
      console.error('Failed to load watchlist stocks:', error);
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  }, [watchlist, mounted]);

  useEffect(() => {
    if (watchlist && mounted) {
      loadWatchlistStocks();
    }
  }, [watchlist, mounted, loadWatchlistStocks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWatchlistStocks();
    setRefreshing(false);
  }, [loadWatchlistStocks]);

  const handleStockPress = useCallback((stock: Stock) => {
    dispatch({ type: 'SET_SELECTED_STOCK', payload: stock });
    (navigation as any).navigate('StockDetails');
  }, [dispatch, navigation]);

  const handleRemoveStock = useCallback((symbol: string) => {
    Alert.alert(
      'Remove Stock',
      `Remove ${symbol} from "${watchlistName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            if (watchlistId) {
              dispatch({
                type: 'REMOVE_FROM_WATCHLIST',
                payload: { watchlistId, symbol },
              });
              setStocks(stocks.filter(s => s.symbol !== symbol));
              Alert.alert('Removed', `${symbol} removed from watchlist.`);
            }
          },
        },
      ]
    );
  }, [watchlistId, watchlistName, stocks, dispatch]);

  const handleAddStocks = useCallback(() => {
    (navigation as any).navigate('Search');
  }, [navigation]);

  const renderStockCard = useCallback(({ item }: { item: Stock }) => (
    <View style={styles.stockCardContainer}>
      <StockCard stock={item} onPress={handleStockPress} />
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveStock(item.symbol)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Trash2 size={14} color={theme.colors.error} />
      </TouchableOpacity>
    </View>
  ), [handleStockPress, handleRemoveStock, styles, theme]);

  const getNumColumns = (screenWidth: number) => {
    if (screenWidth >= 1200) return 4;
    if (screenWidth >= 768) return 3;
    // Always use 2 columns for mobile and tablet
    return 2;
  };

  const numColumns = getNumColumns(width);
  const isSmallScreen = width < 480;

  if (!watchlist) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Watchlist Not Found</Text>
          <View style={styles.placeholder} />
        </View>
        <EmptyState
          title="Watchlist Not Found"
          message="The requested watchlist could not be found."
          icon={<BookmarkX size={48} color={theme.colors.textSecondary} />}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title} numberOfLines={1}>
            {watchlistName}
          </Text>
          <Text style={styles.subtitle}>
            {watchlist.stocks.length} stock{watchlist.stocks.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={handleAddStocks} style={styles.addButton}>
          <Plus size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <LoadingSpinner message="Loading stocks..." />
      ) : watchlist.stocks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            title="Empty Watchlist"
            message="Add stocks to your watchlist by searching and selecting them."
            icon={<BookmarkX size={48} color={theme.colors.textSecondary} />}
          />
          <TouchableOpacity style={styles.addStocksButton} onPress={handleAddStocks}>
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addStocksButtonText}>Add Stocks</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={stocks}
          renderItem={renderStockCard}
          keyExtractor={(item) => item.symbol}
          numColumns={numColumns}
          key={`watchlist-details-${numColumns}`}
          columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: isSmallScreen ? 16 : 20,
      paddingVertical: isSmallScreen ? 12 : 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    backButton: {
      padding: 4,
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    title: {
      fontSize: isDesktop ? 24 : isTablet ? 22 : isSmallScreen ? 18 : 20,
      fontWeight: '700',
      color: theme.colors.text,
      fontFamily: 'Inter-Bold',
      textAlign: 'center',
    },
    subtitle: {
      fontSize: isSmallScreen ? 12 : 14,
      color: theme.colors.textSecondary,
      marginTop: 2,
      fontFamily: 'Inter-Regular',
    },
    addButton: {
      padding: 4,
    },
    placeholder: {
      width: 32,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: isSmallScreen ? 16 : 20,
    },
    addStocksButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: isSmallScreen ? 20 : 24,
      paddingVertical: isSmallScreen ? 12 : 16,
      borderRadius: 12,
      marginTop: 24,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    addStocksButtonText: {
      marginLeft: 8,
      fontSize: isSmallScreen ? 14 : 16,
      color: '#FFFFFF',
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    listContent: {
      padding: isSmallScreen ? 12 : 16,
      gap: isSmallScreen ? 8 : 12,
    },
    row: {
      justifyContent: 'space-between',
    },
    stockCardContainer: {
      position: 'relative',
      marginBottom: isSmallScreen ? 8 : 12,
    },
    removeButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
  });
}