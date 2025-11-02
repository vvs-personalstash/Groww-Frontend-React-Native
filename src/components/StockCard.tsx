import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Stock } from '../types/stock';
import { useAppContext } from '../context/AppContext';
import { lightTheme, darkTheme } from '../constants/theme';

interface StockCardProps {
  stock: Stock;
  onPress: (stock: Stock) => void;
}

export function StockCard({ stock, onPress }: StockCardProps) {
  const { state } = useAppContext();
  const theme = state.theme === 'light' ? lightTheme : darkTheme;
  const { width } = useWindowDimensions();
  const styles = createStyles(theme, width);

  const isPositive = stock.change >= 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(stock)}
      activeOpacity={0.7}
    >
      {/* Stock Symbol Circle */}
      <View style={styles.symbolContainer}>
        <View style={styles.symbolCircle}>
          <Text style={styles.symbolText}>
            {stock.symbol.substring(0, 2)}
          </Text>
        </View>
      </View>

      {/* Stock Info */}
      <View style={styles.infoContainer}>
        <View style={styles.header}>
          <Text style={styles.symbol} numberOfLines={1}>
            {stock.symbol}
          </Text>
          <Text style={styles.price}>
            ${stock.price.toFixed(2)}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.name} numberOfLines={1}>
            Stock Name
          </Text>
          <View style={[
            styles.changeContainer,
            { backgroundColor: isPositive ? theme.colors.success : theme.colors.error }
          ]}>
            <Text style={styles.change}>
              {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function getCardWidth(screenWidth: number): number {
  if (screenWidth >= 1200) {
    // Desktop: 4 columns with proper spacing
    return (screenWidth - 120) / 4;
  } else if (screenWidth >= 768) {
    // Tablet: 3 columns
    return (screenWidth - 80) / 3;
  } else {
    // Mobile: Always 2 columns
    return (screenWidth - 48) / 2;
  }
}

function createStyles(theme: typeof lightTheme, screenWidth: number) {
  const cardWidth = getCardWidth(screenWidth);
  const isSmallScreen = screenWidth < 480;
  const isTablet = screenWidth >= 768;
  
  return StyleSheet.create({
    container: {
      width: cardWidth,
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: isSmallScreen ? 12 : 16,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minHeight: isSmallScreen ? 100 : 120,
    },
    symbolContainer: {
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    symbolCircle: {
      width: isSmallScreen ? 32 : 40,
      height: isSmallScreen ? 32 : 40,
      borderRadius: isSmallScreen ? 16 : 20,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    symbolText: {
      fontSize: isSmallScreen ? 12 : 14,
      fontWeight: '700',
      color: theme.colors.text,
      fontFamily: 'Inter-Bold',
    },
    infoContainer: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    symbol: {
      fontSize: isSmallScreen ? 14 : isTablet ? 16 : 15,
      fontWeight: '700',
      color: theme.colors.text,
      fontFamily: 'Inter-Bold',
      flex: 1,
    },
    price: {
      fontSize: isSmallScreen ? 14 : isTablet ? 16 : 15,
      fontWeight: '600',
      color: theme.colors.text,
      fontFamily: 'Inter-SemiBold',
      textAlign: 'right',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    name: {
      fontSize: isSmallScreen ? 11 : 12,
      color: theme.colors.textSecondary,
      fontFamily: 'Inter-Regular',
      flex: 1,
    },
    changeContainer: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      minWidth: isSmallScreen ? 45 : 50,
      alignItems: 'center',
    },
    change: {
      fontSize: isSmallScreen ? 10 : 11,
      fontWeight: '600',
      color: '#FFFFFF',
      fontFamily: 'Inter-SemiBold',
    },
  });
}