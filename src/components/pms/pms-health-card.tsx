import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressBar, StatusChip } from '@/components/ui';
import type { StatusTone } from '@/components/ui';
import { LightCardShadow, Radius, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import type { DueProgress } from '@/utils/calculations';
import type { DistanceUnit } from '@/types/preferences';
import { formatInterval, pmsRemainingText } from '@/utils/pms';
import type { PmsItemWithStatus } from '@/types/pms';

import { pmsIcon } from './pms-icons';
import { pmsDetailText, pmsTone } from './pms-row';

type PmsHealthCardProps = {
  entry: PmsItemWithStatus;
  progress: DueProgress | null;
  distanceUnit: DistanceUnit;
  onEdit: () => void;
  onLog: () => void;
};

export function PmsHealthCard({
  entry,
  progress,
  distanceUnit,
  onEdit,
  onLog,
}: PmsHealthCardProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const { item, status } = entry;
  const tone: StatusTone = pmsTone(status.status);

  return (
    <View
      style={[
        styles.card,
        scheme === 'light' && LightCardShadow,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      <View style={styles.heading}>
        <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name={pmsIcon(item.type)} size={20} color={theme.accentInk} accessible={false} />
        </View>
        <View style={styles.details}>
          <Text style={[Typography.heading, { color: theme.text }]} numberOfLines={1}>
            {item.label}
          </Text>
          <Text style={[Typography.body, styles.remaining, { color: theme.textMuted }]}>
            {pmsRemainingText(status, distanceUnit)}
            {status.basis === 'setup' ? ' · baseline only' : ''}
          </Text>
        </View>
        <StatusChip tone={tone} />
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={`Edit interval for ${item.label}`}
          hitSlop={8}
          style={styles.editButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={theme.textMuted} accessible={false} />
        </Pressable>
      </View>

      {progress !== null ? (
        <ProgressBar
          value={progress.value}
          max={progress.max}
          tone={progress.tone}
          accessibilityLabel={`${item.label} ${progress.basis === 'km' ? 'distance' : 'date'} progress`}
        />
      ) : null}

      <View style={[styles.detail, { backgroundColor: theme.surfaceAlt }]}>
        <Text style={[Typography.label, { color: theme.textMuted }]}>Last done</Text>
        <Text style={[Typography.mono, { color: theme.text }]}>
          {pmsDetailText(item, distanceUnit)}
        </Text>
      </View>
      <Pressable
        onPress={onLog}
        accessibilityRole="button"
        accessibilityLabel={`Log service for ${item.label}`}
        style={({ pressed }) => [
          styles.logButton,
          { borderColor: theme.border, backgroundColor: pressed ? theme.surfaceAlt : 'transparent' },
        ]}>
        <Text style={[Typography.label, { color: theme.accentInk }]}>Log service</Text>
        <Ionicons name="arrow-forward" size={16} color={theme.accentInk} accessible={false} />
      </Pressable>
      <Text style={[Typography.label, styles.interval, { color: theme.textMuted }]}>
        {formatInterval(item.intervalKm, item.intervalDays, distanceUnit)}
      </Text>
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
  heading: {
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
    gap: Spacing.half,
  },
  remaining: {
    fontSize: 13,
  },
  editButton: {
    minWidth: 32,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detail: {
    borderRadius: Radius.control,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  logButton: {
    minHeight: 44,
    borderRadius: Radius.control,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  interval: {
    fontSize: 10,
  },
});
