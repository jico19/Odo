import { Ionicons } from '@react-native-vector-icons/ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Gauge, type IconName } from '@/components/ui';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatNumber, formatOdometer } from '@/utils/format';
import type { DueInfo, DueProgress } from '@/utils/calculations';

type GaugeHeroProps = {
  odometer: number;
  serviceDue: DueInfo | null;
  serviceProgress: DueProgress | null;
  efficiency: number | null;
  bestEfficiency: number | null;
  trend: number | null;
  columns: number;
  onUpdateOdometer: () => void;
};

export function GaugeHero({
  odometer,
  serviceDue,
  serviceProgress,
  efficiency,
  bestEfficiency,
  trend,
  columns,
  onUpdateOdometer,
}: GaugeHeroProps) {
  const percent =
    serviceProgress === null || serviceProgress.max <= 0
      ? null
      : Math.round((serviceProgress.value / serviceProgress.max) * 100);
  const remaining = serviceDue === null ? null : serviceDue.kmLeft ?? serviceDue.daysLeft;
  const remainingUnit = serviceDue?.kmLeft === null ? 'DAYS' : 'KM';
  const remainingText =
    remaining === null
      ? 'NOT SET'
      : remaining < 0
        ? `${formatOdometer(Math.abs(remaining))} ${remainingUnit} OVERDUE`
        : `${formatOdometer(remaining)} ${remainingUnit} LEFT`;

  const trendIcon: IconName = trend === null ? 'remove-outline' : trend >= 0 ? 'trending-up-outline' : 'trending-down-outline';
  const trendText =
    trend === null
      ? 'NOT ENOUGH DATA'
      : `${trend >= 0 ? '+' : ''}${formatNumber(trend, 1)} KM/L VS 30D`;

  return (
    <View style={styles.grid}>
      <View style={columns === 1 ? styles.stackItem : styles.gridItem}>
        <Gauge
          label="ODOMETER MASTER"
          value={formatOdometer(odometer)}
          unit="KILOMETERS"
          progress={percent === null ? 0 : percent / 100}
          tone={serviceProgress?.tone ?? 'ok'}
          badge={{
            label: percent === null ? 'NO DUE DATE' : `SERVICE: ${percent}%`,
            tone: serviceProgress?.tone ?? 'ok',
          }}
          footer={
            <GaugeFooter
              icon="construct-outline"
              label="NEXT SERVICE"
              value={remainingText}
              tone={serviceDue?.status ?? 'ok'}
            />
          }
          onPress={onUpdateOdometer}
          accessibilityLabel={`Odometer ${formatOdometer(odometer)} kilometers. ${remainingText}`}
        />
      </View>

      <View style={columns === 1 ? styles.stackItem : styles.gridItem}>
        <Gauge
          label="FUEL EFFICIENCY"
          value={efficiency === null ? '—' : formatNumber(efficiency, 1)}
          unit="KM/L"
          progress={efficiency === null || bestEfficiency === null ? 0 : efficiency / bestEfficiency}
          tone="ok"
          badge={
            bestEfficiency === null
              ? undefined
              : { label: `BEST ${formatNumber(bestEfficiency, 1)}`, tone: 'ok' }
          }
          footer={<GaugeFooter icon={trendIcon} label={trendText} value="" tone="ok" />}
          accessibilityLabel={
            efficiency === null
              ? 'Fuel efficiency, no full-tank data yet'
              : `Fuel efficiency ${formatNumber(efficiency, 1)} kilometers per liter. ${trendText}`
          }
        />
      </View>
    </View>
  );
}

function GaugeFooter({
  icon,
  label,
  value,
  tone,
}: {
  icon: IconName;
  label: string;
  value: string;
  tone: 'ok' | 'dueSoon' | 'overdue';
}) {
  const theme = useTheme();
  const color = { ok: theme.accentInk, dueSoon: theme.warningInk, overdue: theme.dangerInk }[tone];

  return (
    <View style={styles.footer}>
      <Ionicons name={icon} size={16} color={color} accessible={false} />
      <Text style={[Typography.label, styles.footerLabel, { color: theme.textMuted }]} numberOfLines={1}>
        {label}
      </Text>
      {value === '' ? null : (
        <Text style={[Typography.label, styles.footerValue, { color }]} numberOfLines={1}>
          {value}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: Spacing.md,
  },
  gridItem: {
    flex: 1,
    minWidth: 0,
  },
  stackItem: {
    minWidth: 0,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  footerLabel: {
    flexShrink: 1,
  },
  footerValue: {
    marginLeft: 'auto',
  },
});
