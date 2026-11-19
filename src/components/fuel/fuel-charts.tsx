import { BarChart, LineChart } from 'react-native-gifted-charts';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ChartPoint } from '@/utils/calculations';
import { roundTo } from '@/utils/calculations';

type FuelChartProps = {
  data: ChartPoint[];
  height: number;
  accessibilityLabel: string;
};

function useChartWidth(): number {
  const { width } = useWindowDimensions();
  return Math.max(200, Math.min(width - Spacing.three * 4, MaxContentWidth - Spacing.three * 4));
}

function chartScale(values: number[]) {
  const largest = Math.max(1, ...values);
  const step = Math.max(1, Math.ceil(largest / 4));
  return { maxValue: step * 4, stepValue: step, noOfSections: 4 };
}

export function FuelEfficiencyChart({ data, height, accessibilityLabel }: FuelChartProps) {
  const theme = useTheme();
  const chartWidth = useChartWidth();
  const scale = chartScale(data.map((point) => point.value));
  const points = data.map((point) => ({ value: point.value, label: point.label }));

  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={styles.chart}>
      <LineChart
        data={points}
        width={chartWidth}
        height={height}
        color={theme.accent}
        thickness={2}
        dataPointsColor={theme.accent}
        dataPointsRadius={3}
        xAxisColor={theme.border}
        yAxisColor={theme.border}
        rulesColor={theme.border}
        rulesThickness={1}
        yAxisLabelWidth={30}
        yAxisTextStyle={[styles.axisText, { color: theme.textMuted }]}
        xAxisLabelTextStyle={[styles.axisText, { color: theme.textMuted }]}
        maxValue={scale.maxValue}
        stepValue={scale.stepValue}
        noOfSections={scale.noOfSections}
        adjustToWidth
        scrollToEnd={points.length > 4}
        disableScroll={points.length <= 4}
      />
    </View>
  );
}

export function MonthlySpendChart({ data, height, accessibilityLabel }: FuelChartProps) {
  const theme = useTheme();
  const chartWidth = useChartWidth();
  const scale = chartScale(data.map((point) => point.value));
  const bars = data.map((point) => ({
    value: roundTo(point.value, 0),
    label: point.label,
    frontColor: theme.accent,
    labelTextStyle: [styles.axisText, { color: theme.textMuted }],
  }));

  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={styles.chart}>
      <BarChart
        data={bars}
        width={chartWidth}
        height={height}
        barWidth={18}
        roundedTop
        xAxisColor={theme.border}
        yAxisColor={theme.border}
        rulesColor={theme.border}
        rulesThickness={1}
        yAxisLabelWidth={42}
        yAxisTextStyle={[styles.axisText, { color: theme.textMuted }]}
        maxValue={scale.maxValue}
        stepValue={scale.stepValue}
        noOfSections={scale.noOfSections}
        adjustToWidth
        parentWidth={chartWidth}
        disableScroll
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    alignItems: 'center',
  },
  axisText: {
    fontSize: 10,
  },
});
