import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { StockTimeSeries } from '@/types/stock';
import { useAppContext } from '../context/AppContext';
import { lightTheme, darkTheme } from '../constants/theme';

interface StockChartProps {
  data: StockTimeSeries[];
}

export function StockChart({ data }: StockChartProps) {
  const { state } = useAppContext();
  const theme = state.theme === 'light' ? lightTheme : darkTheme;
  const { width } = useWindowDimensions();

  if (!data || data.length === 0) {
    return null;
  }

  const prices = data.map(item => item.close);
  const labels = data.map((item, index) => {
    if (index % 5 === 0) {
      return new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
      r: '0',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: theme.colors.border,
      strokeWidth: 1,
    },
  };

  // Calculate responsive chart dimensions
  const getChartDimensions = (screenWidth: number) => {
    const padding = screenWidth < 480 ? 16 : 32;
    const chartWidth = screenWidth - padding;
    const chartHeight = screenWidth < 480 ? 180 : screenWidth < 768 ? 220 : 260;
    
    return { width: chartWidth, height: chartHeight };
  };

  const { width: chartWidth, height: chartHeight } = getChartDimensions(width);

  return (
    <View style={styles.container}>
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  chart: {
    borderRadius: 16,
  },
});