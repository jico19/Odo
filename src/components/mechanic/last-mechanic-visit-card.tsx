import { StyleSheet, Text, View } from 'react-native';

import { LightCardShadow, Radius, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import type { MechanicVisit } from '@/types/mechanic';
import { formatCurrency, formatDateShort, formatOdometer } from '@/utils/format';

type LastMechanicVisitCardProps = {
  visit: MechanicVisit | null;
};

export function LastMechanicVisitCard({ visit }: LastMechanicVisitCardProps) {
  const theme = useTheme();
  const scheme = useColorScheme();

  return (
    <View
      accessible
      accessibilityLabel={
        visit === null
          ? 'Last mechanic visit, no visits logged yet'
          : `Last mechanic visit ${formatDateShort(visit.date)}, ${visit.shop?.trim() || 'Unspecified shop'}${visit.cost === null ? '' : `, ${formatCurrency(visit.cost)}`}`
      }
      style={[
        styles.card,
        scheme === 'light' && LightCardShadow,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      <View style={styles.header}>
        <Text style={[Typography.label, { color: theme.textMuted }]}>Last mechanic visit</Text>
        {visit !== null ? (
          <Text style={[Typography.label, { color: theme.textMuted }]}>
            {formatDateShort(visit.date)}
          </Text>
        ) : null}
      </View>
      {visit === null ? (
        <Text style={[Typography.body, styles.empty, { color: theme.textMuted }]}>
          No visits logged yet.
        </Text>
      ) : (
        <>
          <View style={styles.valueRow}>
            <Text style={[Typography.heading, styles.value, { color: theme.text }]}>
              {visit.shop?.trim() || 'Unspecified shop'}
            </Text>
          </View>
          <Text style={[Typography.body, styles.detail, { color: theme.textMuted }]}>
            {[visit.workDone, visit.cost === null ? null : formatCurrency(visit.cost),
              visit.odometer === null ? null : `${formatOdometer(visit.odometer)} km`,
              visit.receiptUri === null ? null : 'Receipt']
              .filter((part) => part !== null && part !== '')
              .join(' · ')}
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
