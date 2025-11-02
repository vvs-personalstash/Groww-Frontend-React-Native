import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react-native';
import { StockCard } from '../components/StockCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { useAppContext } from '../context/AppContext';
import { Stock } from '../types/stock';
import { lightTheme, darkTheme } from '../constants/theme';

export default function ViewAllScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { section } = (route.params as { section: 'gainers' | 'losers' }) || { section: 'gainers' };
  const { state, dispatch } = useAppContext();
  const theme = state.theme === 'light' ? lightTheme : darkTheme;
  const { width } = useWindowDimensions();
  const styles = createStyles(theme, width);

  const title = section === 'gainers' ? 'Top Gainers' : 'Top Losers';
  const sectionData = section === 'gainers' ? state.topGainers : state.topLosers;

  const handleStockPress = (stock: Stock) => {
    dispatch({ type: 'SET_SELECTED_STOCK', payload: stock });
    (navigation as any).navigate('StockDetails');
  };

  const renderStockCard = ({ item }: { item: Stock }) => (
    <StockCard stock={item} onPress={handleStockPress} />
  );

  const getNumColumns = (screenWidth: number) => {
    if (screenWidth >= 1200) return 4;
    if (screenWidth >= 768) return 3;
    // Always use 2 columns for mobile and tablet
    return 2;
  };

  const numColumns = getNumColumns(width);

  if (sectionData.loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.placeholder} />
        </View>
        <LoadingSpinner message={`Loading ${title.toLowerCase()}...`} />
      </View>
    );
  }

  if (sectionData.error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.placeholder} />
        </View>
        <ErrorState message={sectionData.error} />
      </View>
    );
  }

  if (sectionData.data.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.placeholder} />
        </View>
        <EmptyState
          title="No Data Available"
          message={`${title} data is currently unavailable. Please try again later.`}
          icon={section === 'gainers' ?
            <TrendingUp size={48} color={theme.colors.textSecondary} /> :
            <TrendingDown size={48} color={theme.colors.textSecondary} />
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={sectionData.data}
        renderItem={renderStockCard}
        keyExtractor={(item, index) => `${item.symbol}-${index}`}
        numColumns={numColumns}
        key={`viewall-${numColumns}`}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: theme.spacing.xs,
    },
    title: {
      fontSize: isDesktop ? theme.typography.fontSize.xxl : isTablet ? theme.typography.fontSize.xl : theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      fontFamily: 'Inter-Bold',
    },
    placeholder: {
      width: 32,
    },
    listContent: {
      padding: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
      gap: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
    },
    row: {
      justifyContent: 'space-between',
    },
    footerLoader: {
      paddingVertical: theme.spacing.lg,
    },
  });
}