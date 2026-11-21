import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusChip, type StatusTone } from '@/components/ui';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DistanceUnit } from '@/types/preferences';
import type { PmsItem, PmsItemWithStatus } from '@/types/pms';
import { formatDistance } from '@/utils/format';
import { pmsRemainingText } from '@/utils/pms';

import { pmsIcon } from './pms-icons';

export function pmsTone(status: PmsItemWithStatus['status']['status']): StatusTone {
  if (status === 'overdue') return 'overdue';
  if (status === 'due_soon') return 'dueSoon';
  return 'ok';
}

type PmsRowProps = {
  entry: PmsItemWithStatus;
  distanceUnit: DistanceUnit;
  onPress?: () => void;
  divider?: boolean;
};

export function PmsRow({
  entry,
  distanceUnit,
  onPress,
  divider = true,
}: PmsRowProps) {
  const theme = useTheme();
  const { item, status } = entry;
  const content = (
    <>
      <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
        <Ionicons name={pmsIcon(item.type)} size={20} color={theme.accentInk} accessible={false} />
      </View>
      <View style={styles.details}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {item.label}
        </Text>
        <Text style={[Typography.body, { color: theme.textMuted }]} numberOfLines={1}>
          {pmsRemainingText(status, distanceUnit)}
          {status.basis === 'setup' ? ' · baseline only' : ''}
        </Text>
      </View>
      <StatusChip tone={pmsTone(status.status)} />
      {onPress ? (
        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} accessible={false} />
      ) : null}
    </>
  );

  const style = [
    styles.row,
    divider && styles.divider,
    { borderBottomColor: theme.border, opacity: item.enabled ? 1 : 0.5 },
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${item.label}, ${status.status.replace('_', ' ')}, ${pmsRemainingText(status, distanceUnit)}`}
        style={({ pressed }) => [style, pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return (
    <View accessible style={style}>
      {content}
    </View>
  );
}

export function pmsDetailText(item: PmsItem, distanceUnit: DistanceUnit): string {
  if (item.lastDoneDate !== null) return `Last done ${item.lastDoneDate}`;
  if (item.lastDoneOdometer !== null) {
    return `Last done at ${formatDistance(item.lastDoneOdometer, distanceUnit, 0)} ${distanceUnit}`;
  }
  return `Baseline ${item.startedDate ?? 'not set'}`;
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  divider: {
    borderBottomWidth: 1,
  },
  pressed: {
    opacity: 0.75,
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
    gap: Spacing.half,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
});
