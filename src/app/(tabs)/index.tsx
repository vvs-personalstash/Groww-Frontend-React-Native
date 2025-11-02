import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, RefreshControl, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StockCard } from '../../components/StockCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { useAppContext } from '../../context/AppContext';
import { apiService } from '../../services/api';
import { Stock } from '../../types/stock';
import { lightTheme, darkTheme } from '../../constants/theme';
import { TrendingUp, TrendingDown } from 'lucide-react-native';

export default function ExploreScreen() {
  const { state, dispatch } = useAppContext();
  const navigation = useNavigation();
  const theme = state.theme === 'light' ? lightTheme : darkTheme;
  const { width } = useWindowDimensions();
  const styles = createStyles(theme, width);
  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const loadData = useCallback(async () => {            
    if (!mounted) return;

    // Set loading state
    dispatch({
      type: 'SET_TOP_GAINERS',
      payload: { data: [], loading: true },
    });
    dispatch({
      type: 'SET_TOP_LOSERS',
      payload: { data: [], loading: true },
    });

    try {
      const { gainers, losers } = await apiService.getTopGainersLosers();

      console.log('Loaded market data:', { gainersCount: gainers.length, losersCount: losers.length });

      if (mounted) {
        dispatch({
          type: 'SET_TOP_GAINERS',
          payload: { data: gainers, loading: false },
        });
        dispatch({
          type: 'SET_TOP_LOSERS',
          payload: { data: losers, loading: false },
        });
      }
    } catch (error) {
      console.error('Error loading market data:', error);
      if (mounted) {
        dispatch({
          type: 'SET_TOP_GAINERS',
          payload: { data: [], loading: false, error: error instanceof Error ? error.message : 'Failed to load data' },
        });
        dispatch({
          type: 'SET_TOP_LOSERS',
          payload: { data: [], loading: false, error: error instanceof Error ? error.message : 'Failed to load data' },
        });
      }
    }
  }, [dispatch, mounted]);

  useEffect(() => {
    if (mounted) {
      loadData();
    }
  }, [mounted, loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    console.log('🔄 Clearing cache and refreshing data...');
    apiService.clearCache(); // Clear cache to force fresh API call
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleStockPress = useCallback((stock: Stock) => {
    dispatch({ type: 'SET_SELECTED_STOCK', payload: stock });
    (navigation as any).navigate('StockDetails');
  }, [dispatch, navigation]);

  const handleViewAll = useCallback((section: 'gainers' | 'losers') => {
    console.log(`🔍 View All clicked for: ${section}`);
    console.log(`📊 Navigating to ViewAll screen with section: ${section}`);
    console.log(`📊 Current ${section} count in context: ${section === 'gainers' ? state.topGainers.data.length : state.topLosers.data.length}`);
    (navigation as any).navigate('ViewAll', { section });
  }, [navigation, state.topGainers.data.length, state.topLosers.data.length]);

  const renderStockCard = useCallback(({ item }: { item: Stock }) => (
    <StockCard stock={item} onPress={handleStockPress} />
  ), [handleStockPress]);

  const getNumColumns = (screenWidth: number) => {
    if (screenWidth >= 1200) return 4;
    if (screenWidth >= 768) return 3;
    // Always use 2 columns for mobile and tablet
    return 2;
  };

  const numColumns = getNumColumns(width);
  const isSmallScreen = width < 480;

  if (state.topGainers.loading && state.topLosers.loading) {
    return <LoadingSpinner message="Loading market data..." />;
  }

  if (state.topGainers.error && state.topLosers.error) {
    return (
      <ErrorState
        message="Failed to load market data. Please check your connection."
        onRetry={loadData}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Top Gainers Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Text style={{ color: theme.colors.success, fontSize: 20, marginRight: 8 }}>📈</Text>
            <Text style={styles.sectionTitle}>Top Gainers</Text>
          </View>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => handleViewAll('gainers')}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Text style={{ color: theme.colors.primary, fontSize: 16 }}>›</Text>
          </TouchableOpacity>
        </View>

        {state.topGainers.loading ? (
          <LoadingSpinner size="small" message="Loading gainers..." />
        ) : state.topGainers.error ? (
          <ErrorState message={state.topGainers.error} onRetry={loadData} />
        ) : state.topGainers.data.length === 0 ? (
          <EmptyState
            title="No Data Available"
            message="Top gainers data is currently unavailable. Pull to refresh or try again later."
            icon={<TrendingUp size={48} color={theme.colors.textSecondary} />}
          />
        ) : (
          <FlatList
            data={state.topGainers.data.slice(0, isSmallScreen ? 6 : 8)}
            renderItem={renderStockCard}
            keyExtractor={(item) => item.symbol}
            numColumns={numColumns}
            key={`gainers-${numColumns}`}
            columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      {/* Top Losers Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Text style={{ color: theme.colors.error, fontSize: 20, marginRight: 8 }}>📉</Text>
            <Text style={styles.sectionTitle}>Top Losers</Text>
          </View>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => handleViewAll('losers')}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Text style={{ color: theme.colors.primary, fontSize: 16 }}>›</Text>
          </TouchableOpacity>
        </View>

        {state.topLosers.loading ? (
          <LoadingSpinner size="small" message="Loading losers..." />
        ) : state.topLosers.error ? (
          <ErrorState message={state.topLosers.error} onRetry={loadData} />
        ) : state.topLosers.data.length === 0 ? (
          <EmptyState
            title="No Data Available"
            message="Top losers data is currently unavailable. Pull to refresh or try again later."
            icon={<TrendingDown size={48} color={theme.colors.textSecondary} />}
          />
        ) : (
          <FlatList
            data={state.topLosers.data.slice(0, isSmallScreen ? 6 : 8)}
            renderItem={renderStockCard}
            keyExtractor={(item) => item.symbol}
            numColumns={numColumns}
            key={`losers-${numColumns}`}
            columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </ScrollView>
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
    },
    section: {
      padding: isSmallScreen ? 16 : isTablet ? 24 : 20,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: isSmallScreen ? 12 : 16,
    },
    sectionTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: isDesktop ? 24 : isTablet ? 22 : isSmallScreen ? 18 : 20,
      fontWeight: '700',
      color: theme.colors.text,
      fontFamily: 'Inter-Bold',
      marginLeft: 8,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    viewAllText: {
      fontSize: isTablet ? 16 : isSmallScreen ? 14 : 15,
      color: theme.colors.primary,
      marginRight: 4,
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
    },
    row: {
      justifyContent: 'space-between',
      gap: isSmallScreen ? 8 : 12,
    },
    listContainer: {
      gap: isSmallScreen ? 8 : 12,
    },
  });
}