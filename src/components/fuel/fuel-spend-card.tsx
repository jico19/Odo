import { StyleSheet, Text, View } from 'react-native';

import { LightCardShadow, Radius, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import type { ChartPoint } from '@/utils/calculations';
import { formatCurrency } from '@/utils/format';

import { MonthlySpendChart } from './fuel-charts';

type FuelSpendCardProps = {
  monthlySpend: number;
  series: ChartPoint[];
  compact?: boolean;
};

export function FuelSpendCard({ monthlySpend, series, compact = false }: FuelSpendCardProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const chartHeight = compact ? 72 : 128;

  return (
    <View
      accessible
      accessibilityLabel={`Fuel spend this month ${formatCurrency(monthlySpend)}`}
      style={[
        styles.card,
        scheme === 'light' && LightCardShadow,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      <Text style={[Typography.label, { color: theme.textMuted }]}>Fuel this month</Text>
      <View style={styles.valueRow}>
        <Text style={[Typography.display, styles.value, { color: theme.text }]}>
          {formatCurrency(monthlySpend)}
        </Text>
      </View>
      <MonthlySpendChart
        data={series}
        height={chartHeight}
        accessibilityLabel="Fuel spend by month for the last six months"
      />
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
    marginTop: Spacing.two,
  },
  value: {
    flexShrink: 1,
  },
});
