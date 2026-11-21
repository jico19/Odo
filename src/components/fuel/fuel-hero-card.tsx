import { Ionicons } from '@react-native-vector-icons/ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { LightCardShadow, Radius, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import type { ChartPoint } from '@/utils/calculations';
import { formatNumber } from '@/utils/format';

import { EfficiencySparkline } from './efficiency-sparkline';
import { TelemetryTrough, type TelemetryTroughData } from './telemetry-trough';

type FuelHeroCardProps = {
  average: number | null;
  series: ChartPoint[];
  trend: number | null;
  fullTankCount: number;
  trough: TelemetryTroughData;
  target?: number;
};

function efficiencyHint(fullTankCount: number): string {
  if (fullTankCount === 0) return 'No full tanks logged yet. Mark a fill as full tank to start.';
  if (fullTankCount === 1) return '1 full tank logged. Log another at a higher odometer to see km/L.';
  return `${fullTankCount} full tanks logged, but the odometer did not increase. Check the readings.`;
}

export function FuelHeroCard({
  average,
  series,
  trend,
  fullTankCount,
  trough,
  target = 20,
}: FuelHeroCardProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const hasTrend = series.length > 0;
  const trendLabel =
    trend === null
      ? 'TREND N/A'
      : `${trend >= 0 ? '+' : ''}${formatNumber(trend, 1)}% VS LAST MO`;
  const trendColor =
    trend === null ? theme.textMuted : trend >= 0 ? theme.accentInk : theme.warningInk;

  return (
    <View
      accessible
      accessibilityLabel={
        average === null
          ? 'Average fuel economy, no full-tank data yet'
          : `Average fuel economy ${formatNumber(average, 1)} kilometers per liter`
      }
      style={[
        styles.card,
        scheme === 'light' && LightCardShadow,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      <View style={styles.header}>
        <View style={styles.headerLabel}>
          <View style={[styles.dot, { backgroundColor: theme.accent }]} />
          <Text style={[Typography.label, styles.labelText, { color: theme.textMuted }]}>
            Avg Fuel Economy
          </Text>
        </View>
        <View style={[styles.trend, { backgroundColor: theme.accentSoft }]}>
          {trend !== null && trend >= 0 ? (
            <Ionicons name="trending-up" size={14} color={trendColor} accessible={false} />
          ) : null}
          {trend !== null && trend < 0 ? (
            <Ionicons name="trending-down" size={14} color={trendColor} accessible={false} />
          ) : null}
          <Text style={[Typography.label, styles.trendText, { color: trendColor }]}>
            {trendLabel}
          </Text>
        </View>
      </View>

      <View style={styles.valueRow}>
        <Text style={[Typography.display, styles.value, { color: theme.text }]}>
          {average === null ? '—' : formatNumber(average, 1)}
        </Text>
        <Text style={[Typography.label, styles.unit, { color: theme.textMuted }]}>KM / L</Text>
      </View>

      <View style={[styles.chartPanel, { backgroundColor: theme.background }]}>
        <View style={styles.chartHeader}>
          <Text style={[Typography.label, styles.chartCaption, { color: theme.textMuted }]}>
            {series.length}-INTERVAL EFFICIENCY TREND
          </Text>
          <Text style={[Typography.label, styles.chartCaption, { color: theme.accentInk }]}>
            TARGET: {formatNumber(target, 1)}
          </Text>
        </View>
        {hasTrend ? (
          <EfficiencySparkline
            points={series}
            target={target}
            accessibilityLabel="Fuel efficiency by full-tank interval with target line"
          />
        ) : (
          <Text style={[Typography.body, styles.hint, { color: theme.textMuted }]}>
            {efficiencyHint(fullTankCount)}
          </Text>
        )}
        <View style={styles.chartScale}>
          <Text style={[Typography.label, styles.chartCaption, { color: theme.textMuted }]}>
            {series[0]?.label ?? '—'}
          </Text>
          <Text style={[Typography.label, styles.chartCaption, { color: theme.text }]}>LATEST</Text>
        </View>
      </View>

      <View style={[styles.troughWrap, { backgroundColor: theme.surfaceAlt }]}>
        <TelemetryTrough data={trough} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  headerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexShrink: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
  },
  labelText: {
    flexShrink: 1,
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  trendText: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  value: {
    flexShrink: 1,
  },
  unit: {
    paddingBottom: Spacing.one,
  },
  chartPanel: {
    width: '100%',
    borderRadius: Radius.control,
    padding: Spacing.two,
    gap: Spacing.half,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingHorizontal: Spacing.half,
  },
  chartCaption: {
    fontSize: 10,
    letterSpacing: 0.4,
  },
  chartScale: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingHorizontal: Spacing.half,
  },
  hint: {
    paddingVertical: Spacing.four,
    textAlign: 'center',
  },
  troughWrap: {
    borderRadius: Radius.control,
  },
});
