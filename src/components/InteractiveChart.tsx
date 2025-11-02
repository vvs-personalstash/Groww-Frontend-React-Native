import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { StockTimeSeries } from '../types/stock';
import { useAppContext } from '../context/AppContext';
import { lightTheme, darkTheme } from '../constants/theme';

interface InteractiveChartProps {
  data: StockTimeSeries[];
  symbol: string;
}

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y';

export function InteractiveChart({ data, symbol }: InteractiveChartProps) {
  const { state } = useAppContext();
  const theme = state.theme === 'light' ? lightTheme : darkTheme;
  const { width } = useWindowDimensions();
  const styles = createStyles(theme, width);

  const [selectedRange, setSelectedRange] = useState<TimeRange>('1M');
  const [selectedPoint, setSelectedPoint] = useState<{ value: number; index: number } | null>(null);

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No chart data available</Text>
      </View>
    );
  }

  const getFilteredData = (range: TimeRange) => {
    const now = new Date();
    let daysBack = 30;

    switch (range) {
      case '1D':
        daysBack = 1;
        break;
      case '1W':
        daysBack = 7;
        break;
      case '1M':
        daysBack = 30;
        break;
      case '3M':
        daysBack = 90;
        break;
      case '1Y':
        daysBack = 365;
        break;
    }

    return data.slice(-daysBack);
  };

  const filteredData = getFilteredData(selectedRange);
  const prices = filteredData.map(item => item.close);
  const labels = filteredData.map((item, index) => {
    if (selectedRange === '1D') {
      return new Date(item.timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (index % Math.ceil(filteredData.length / 6) === 0) {
      return new Date(item.timestamp).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
    return '';
  });

  const chartConfig = {
    backgroundColor: theme.colors.background,
    backgroundGradientFrom: theme.colors.background,
    backgroundGradientTo: theme.colors.background,
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => theme.colors.textSecondary,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: selectedPoint ? '4' : '0',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: theme.colors.border,
      strokeWidth: 1,
    },
  };

  const getChartDimensions = (screenWidth: number) => {
    const padding = screenWidth < 480 ? 16 : 32;
    const chartWidth = screenWidth - padding;
    const chartHeight = screenWidth < 480 ? 200 : screenWidth < 768 ? 240 : 280;
    
    return { width: chartWidth, height: chartHeight };
  };

  const { width: chartWidth, height: chartHeight } = getChartDimensions(width);

  const timeRanges: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{symbol} Price Chart</Text>
        {selectedPoint && (
          <Text style={styles.selectedPrice}>
            ${selectedPoint.value.toFixed(2)}
          </Text>
        )}
      </View>

      <View style={styles.timeRangeContainer}>
        {timeRanges.map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeRangeButton,
              selectedRange === range && styles.selectedTimeRangeButton,
            ]}
            onPress={() => setSelectedRange(range)}
          >
            <Text
              style={[
                styles.timeRangeText,
                selectedRange === range && styles.selectedTimeRangeText,
              ]}
            >
              {range}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.chartContainer}>
        <LineChart
          data={{
            labels,
            datasets: [
              {
                data: prices,
                color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                strokeWidth: 2,
              },
            ],
          }}
          width={chartWidth}
          height={chartHeight}
          yAxisLabel="$"
          yAxisSuffix=""
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          onDataPointClick={(data) => {
            setSelectedPoint({ value: data.value, index: data.index });
          }}
        />
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>High</Text>
          <Text style={styles.statValue}>${Math.max(...prices).toFixed(2)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Low</Text>
          <Text style={styles.statValue}>${Math.min(...prices).toFixed(2)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Change</Text>
          <Text style={[
            styles.statValue,
            { color: prices[prices.length - 1] > prices[0] ? theme.colors.success : theme.colors.error }
          ]}>
            {((prices[prices.length - 1] - prices[0]) / prices[0] * 100).toFixed(2)}%
          </Text>
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: typeof lightTheme, screenWidth: number) {
  const isSmallScreen = screenWidth < 480;
  const isTablet = screenWidth >= 768;
  
  return StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
      margin: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: isTablet ? theme.typography.fontSize.xl : theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      fontFamily: 'Inter-Bold',
    },
    selectedPrice: {
      fontSize: isTablet ? theme.typography.fontSize.lg : theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.primary,
      fontFamily: 'Inter-SemiBold',
    },
    timeRangeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: theme.spacing.xs,
    },
    timeRangeButton: {
      paddingHorizontal: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: 6,
    },
    selectedTimeRangeButton: {
      backgroundColor: theme.colors.primary,
    },
    timeRangeText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      fontFamily: 'Inter-Medium',
    },
    selectedTimeRangeText: {
      color: '#FFFFFF',
    },
    chartContainer: {
      alignItems: 'center',
      marginVertical: theme.spacing.md,
    },
    chart: {
      borderRadius: 16,
    },
    stats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    statItem: {
      alignItems: 'center',
    },
    statLabel: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
      fontFamily: 'Inter-Regular',
    },
    statValue: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
      fontFamily: 'Inter-SemiBold',
    },
    noDataText: {
      textAlign: 'center',
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
      fontFamily: 'Inter-Regular',
      padding: theme.spacing.xl,
    },
  });
}