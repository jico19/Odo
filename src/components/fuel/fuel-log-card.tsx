import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { FuelLog } from '@/types/fuel';
import { getFuelLogCost } from '@/utils/calculations';
import { formatCurrency, formatDateShort, formatNumber, formatOdometer } from '@/utils/format';

type FuelLogCardProps = {
  log: FuelLog;
  efficiency: number | null;
  onPress: () => void;
};

export function FuelLogCard({ log, efficiency, onPress }: FuelLogCardProps) {
  const theme = useTheme();
  const description = [
    log.fullTank ? 'Full tank' : 'Partial top-up',
    formatDateShort(log.date),
    formatCurrency(getFuelLogCost(log)),
    formatOdometer(log.odometer ?? 0),
    'kilometers',
    `${formatNumber(log.liters, 1)} liters`,
    efficiency === null ? null : `${formatNumber(efficiency, 1)} kilometers per liter`,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={description}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={styles.topRow}>
        <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name="car-sport-outline" size={20} color={theme.accentInk} accessible={false} />
        </View>
        <View style={styles.details}>
          <Text style={[Typography.heading, styles.title, { color: theme.text }]} numberOfLines={1}>
            {log.fullTank ? 'Full Tank' : 'Partial Top-up'}
          </Text>
          <Text style={[Typography.label, styles.subtitle, { color: theme.textMuted }]} numberOfLines={1}>
            {formatDateShort(log.date)} · {formatNumber(log.liters, 1)} L
          </Text>
        </View>
        <View style={styles.trailing}>
          <Text style={[Typography.mono, styles.cost, { color: theme.text }]} numberOfLines={1}>
            {formatCurrency(getFuelLogCost(log))}
          </Text>
          <Text style={[Typography.label, styles.unitPrice, { color: theme.textMuted }]} numberOfLines={1}>
            {formatCurrency(log.pricePerLiter ?? 0)} / L
          </Text>
        </View>
      </View>

      <View style={[styles.footer, { backgroundColor: theme.surfaceAlt }]}>
        <View style={styles.odometer}>
          <Ionicons name="speedometer-outline" size={16} color={theme.textMuted} accessible={false} />
          <Text style={[Typography.mono, styles.footerText, { color: theme.text }]}>
            {formatOdometer(log.odometer ?? 0)} km
          </Text>
        </View>
        {efficiency === null ? null : (
          <View style={[styles.efficiency, { backgroundColor: theme.accentSoft }]}>
            <View style={[styles.dot, { backgroundColor: theme.accent }]} />
            <Text style={[Typography.mono, styles.efficiencyText, { color: theme.accentInk }]}>
              {formatNumber(efficiency, 1)} km/L
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.85,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 15,
  },
  subtitle: {
    fontSize: 11,
    letterSpacing: 0.2,
    textTransform: 'none',
  },
  trailing: {
    alignItems: 'flex-end',
    flexShrink: 1,
    gap: 2,
  },
  cost: {
    fontSize: 18,
    lineHeight: 22,
  },
  unitPrice: {
    fontSize: 10,
    letterSpacing: 0,
    textTransform: 'none',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.two,
    borderRadius: Radius.control,
  },
  odometer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minWidth: 0,
  },
  footerText: {
    fontSize: 14,
  },
  efficiency: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Radius.pill,
  },
  efficiencyText: {
    fontSize: 12,
  },
});
