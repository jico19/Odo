import { Ionicons } from '@react-native-vector-icons/ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { type IconName } from '@/components/ui';
import { LightCardShadow, Radius, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import type { MaintenanceLog } from '@/types/maintenance';
import type { PmsItem } from '@/types/pms';
import type { TodayRideStats } from '@/utils/calculations';
import { formatDateShort, formatDuration, formatNumber, formatOdometer } from '@/utils/format';
import { maintenanceLabel } from '@/utils/pms';

type TelemetryTilesProps = {
  efficiency: number | null;
  trend: number | null;
  lastService: MaintenanceLog | null;
  pmsItems: readonly PmsItem[];
  ride: TodayRideStats;
  columns: number;
};

type TileProps = {
  label: string;
  icon: IconName;
  value: string;
  unit: string;
  detail: string;
  detailIcon: IconName;
  positive?: boolean;
};

export function TelemetryTiles({
  efficiency,
  trend,
  lastService,
  pmsItems,
  ride,
  columns,
}: TelemetryTilesProps) {
  const trendText =
    trend === null
      ? 'NOT ENOUGH DATA'
      : `${trend >= 0 ? '+' : ''}${formatNumber(trend, 1)} KM/L VS 30D`;

  const tiles: TileProps[] = [
    {
      label: 'AVG CONSUMPTION',
      icon: 'leaf-outline',
      value: efficiency === null ? '—' : formatNumber(efficiency, 1),
      unit: 'KM/L',
      detail: trendText,
      detailIcon: trend === null ? 'remove-outline' : trend >= 0 ? 'trending-up-outline' : 'trending-down-outline',
      positive: trend !== null && trend >= 0,
    },
    {
      label: 'LAST SERVICE',
      icon: 'build-outline',
      value: lastService?.odometer == null ? '—' : formatOdometer(lastService.odometer),
      unit: 'KM',
      detail:
        lastService === null
          ? 'NO SERVICE LOGGED'
          : `${formatDateShort(lastService.date)} · ${maintenanceLabel(lastService, pmsItems).toUpperCase()}`,
      detailIcon: 'calendar-outline',
    },
    {
      label: 'ACTIVE RIDE LOG',
      icon: 'navigate-outline',
      value: formatNumber(ride.distanceKm, 1),
      unit: 'KM',
      detail: ride.count === 0 ? 'NO TRIPS TODAY' : `TODAY · ${formatDuration(ride.durationSeconds).toUpperCase()} RUNNING`,
      detailIcon: 'timer-outline',
      positive: ride.count > 0,
    },
  ];

  return (
    <View style={styles.grid}>
      {tiles.map((tile) => (
        <View key={tile.label} style={columns === 1 ? styles.stackItem : styles.gridItem}>
          <Tile {...tile} />
        </View>
      ))}
    </View>
  );
}

function Tile({ label, icon, value, unit, detail, detailIcon, positive = false }: TileProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const detailColor = positive ? theme.accentInk : theme.textMuted;

  return (
    <View
      accessible
      accessibilityLabel={`${label}, ${value} ${unit}. ${detail}`}
      style={[
        styles.card,
        scheme === 'light' && LightCardShadow,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      <View style={styles.header}>
        <Text style={[Typography.label, styles.headerLabel, { color: theme.textMuted }]}>{label}</Text>
        <Ionicons name={icon} size={16} color={theme.textMuted} accessible={false} />
      </View>
      <View style={styles.valueRow}>
        <Text style={[Typography.display, styles.value, { color: theme.text }]}>{value}</Text>
        <Text style={[Typography.label, { color: theme.textMuted }]}>{unit}</Text>
      </View>
      <View style={styles.detail}>
        <Ionicons name={detailIcon} size={14} color={detailColor} accessible={false} />
        <Text style={[Typography.label, styles.detailText, { color: detailColor }]} numberOfLines={2}>
          {detail}
        </Text>
      </View>
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
  card: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.md,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  headerLabel: {
    flexShrink: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  value: {
    fontSize: 28,
    lineHeight: 32,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  detailText: {
    flexShrink: 1,
  },
});
