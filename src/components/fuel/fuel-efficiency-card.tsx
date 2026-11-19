import { StyleSheet, Text, View } from 'react-native';

import { LightCardShadow, Radius, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import type { ChartPoint } from '@/utils/calculations';
import { formatNumber } from '@/utils/format';

import { FuelEfficiencyChart } from './fuel-charts';

type FuelEfficiencyCardProps = {
  average: number | null;
  series: ChartPoint[];
  compact?: boolean;
};

export function FuelEfficiencyCard({ average, series, compact = false }: FuelEfficiencyCardProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const chartHeight = compact ? 72 : 128;
  const hasTrend = series.length >= 2;
  const value = average === null ? '—' : formatNumber(average, 1);

  return (
    <View
      accessible
      accessibilityLabel={
        average === null
          ? 'Average fuel efficiency, no full-tank data yet'
          : `Average fuel efficiency ${formatNumber(average, 1)} kilometers per liter`
      }
      style={[
        styles.card,
        scheme === 'light' && LightCardShadow,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      <Text style={[Typography.label, { color: theme.textMuted }]}>Average efficiency</Text>
      <View style={styles.valueRow}>
        <Text style={[Typography.display, styles.value, { color: theme.text }]}>{value}</Text>
        <Text style={[Typography.mono, styles.unit, { color: theme.textMuted }]}>km/L</Text>
      </View>
      {hasTrend ? (
        <FuelEfficiencyChart
          data={series}
          height={chartHeight}
          accessibilityLabel="Fuel efficiency by full-tank interval"
        />
      ) : (
        <Text style={[Typography.body, styles.hint, { color: theme.textMuted }]}>
          Add more full-tank fills to see a trend.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.three,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  value: {
    flexShrink: 1,
  },
  unit: {
    paddingBottom: Spacing.half,
  },
  hint: {
    marginTop: Spacing.three,
  },
});
