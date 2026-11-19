import { StyleSheet, Text, View } from 'react-native';

import { LightCardShadow, Radius, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import type { FuelLog } from '@/types/fuel';
import { getFuelLogCost } from '@/utils/calculations';
import { formatCurrency, formatDateShort, formatNumber, formatOdometer } from '@/utils/format';

type LastFuelUpCardProps = {
  log: FuelLog | null;
};

export function LastFuelUpCard({ log }: LastFuelUpCardProps) {
  const theme = useTheme();
  const scheme = useColorScheme();

  return (
    <View
      accessible
      accessibilityLabel={
        log === null
          ? 'Last fuel-up, no fuel logged yet'
          : `Last fuel-up ${formatDateShort(log.date)}, ${formatNumber(log.liters, 1)} liters, ${formatCurrency(getFuelLogCost(log))}`
      }
      style={[
        styles.card,
        scheme === 'light' && LightCardShadow,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      <View style={styles.header}>
        <Text style={[Typography.label, { color: theme.textMuted }]}>Last fuel-up</Text>
        {log !== null ? (
          <Text style={[Typography.label, { color: theme.textMuted }]}>{formatDateShort(log.date)}</Text>
        ) : null}
      </View>
      {log === null ? (
        <Text style={[Typography.body, styles.empty, { color: theme.textMuted }]}>
          No fuel logged yet.
        </Text>
      ) : (
        <>
          <View style={styles.valueRow}>
            <Text style={[Typography.display, styles.value, { color: theme.text }]}>
              {formatCurrency(getFuelLogCost(log))}
            </Text>
          </View>
          <Text style={[Typography.body, styles.detail, { color: theme.textMuted }]}>
            {formatNumber(log.liters, 1)} L · {formatOdometer(log.odometer ?? 0)} km ·{' '}
            {log.fullTank ? 'Full tank' : 'Partial'}
          </Text>
        </>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  valueRow: {
    marginTop: Spacing.two,
  },
  value: {
    flexShrink: 1,
  },
  detail: {
    marginTop: Spacing.two,
  },
  empty: {
    marginTop: Spacing.three,
  },
});
