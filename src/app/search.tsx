import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, TrendingUp, Search } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { apiService } from '../services/api';
import { Stock } from '../types/stock';
import { lightTheme, darkTheme } from '../constants/theme';
import { SearchBar } from '../components/SearchBar';

export default function SearchScreen() {
  const { state, dispatch } = useAppContext();
  const navigation = useNavigation();
  const theme = state.theme === 'light' ? lightTheme : darkTheme;
  const { width } = useWindowDimensions();
  const styles = createStyles(theme, width);

  const [loading, setLoading] = useState(false);

  const handleSelectStock = async (symbol: string) => {
    setLoading(true);
    try {
      const quote = await apiService.getStockQuote(symbol);
      const stock: Stock = {
        symbol: quote.symbol,
        name: quote.symbol,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
      };
      dispatch({ type: 'SET_SELECTED_STOCK', payload: stock });
      (navigation as any).navigate('StockDetails');
    } catch (error) {
      console.error('Failed to load stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const popularStocks = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX'];

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Search Stocks</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar onSelectStock={handleSelectStock} placeholder="Search by name or symbol..." />
        </View>

        {/* Loading Spinner */}
        {loading && (
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={styles.loadingIndicator}
          />
        )}

        {/* Main Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Popular Stocks */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Popular Stocks</Text>
            </View>
            <View style={styles.popularStocks}>
              {popularStocks.map((symbol) => (
                <TouchableOpacity
                  key={symbol}
                  style={styles.popularStock}
                  onPress={() => handleSelectStock(symbol)}
                  disabled={loading}
                >
                  <Text style={styles.popularStockText}>{symbol}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Searches */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            <View style={styles.emptyContainer}>
              <Search size={32} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>No recent searches yet</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: isSmallScreen ? 16 : 20,
      paddingTop: 50,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: 4,
    },
    title: {
      fontSize: isDesktop ? 24 : isTablet ? 22 : isSmallScreen ? 18 : 20,
      fontWeight: '700',
      color: theme.colors.text,
      fontFamily: 'Inter-Bold',
    },
    placeholder: {
      width: 24,
    },
    searchContainer: {
      paddingHorizontal: isSmallScreen ? 16 : 20,
      paddingVertical: 12,
    },
    content: {
      flex: 1,
    },
    section: {
      paddingHorizontal: isSmallScreen ? 16 : 20,
      paddingVertical: 12,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: isDesktop ? 20 : isTablet ? 19 : isSmallScreen ? 16 : 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginLeft: 8,
      fontFamily: 'Inter-SemiBold',
    },
    popularStocks: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: isSmallScreen ? 8 : 12,
    },
    popularStock: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: isSmallScreen ? 12 : 16,
      paddingVertical: isSmallScreen ? 8 : 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 10,
    },
    popularStockText: {
      fontSize: isSmallScreen ? 13 : 14,
      fontWeight: '600',
      color: theme.colors.text,
      fontFamily: 'Inter-SemiBold',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 32,
    },
    emptyText: {
      fontSize: isSmallScreen ? 14 : 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      fontFamily: 'Inter-Regular',
    },
    loadingIndicator: {
      marginTop: 16,
    },
  });
}
