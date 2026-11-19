import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressBar, StatusChip } from '@/components/ui';
import type { IconName } from '@/components/ui';
import { LightCardShadow, Radius, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { MAINTENANCE_LABELS, type MaintenanceLog, type MaintenanceType } from '@/types/maintenance';
import { getDueInfo, getMaintenanceProgress } from '@/utils/calculations';
import { formatDateShort, formatOdometer } from '@/utils/format';

const TYPE_ICONS: Record<MaintenanceType, IconName> = {
  oil: 'water-outline',
  tires: 'disc-outline',
  brakes: 'stop-circle-outline',
  chain: 'link-outline',
  battery: 'battery-charging-outline',
  coolant: 'thermometer-outline',
  inspection: 'clipboard-outline',
  other: 'construct-outline',
};

export function maintenanceIcon(type: MaintenanceType): IconName {
  return TYPE_ICONS[type];
}

function dueText(
  kmLeft: number | null,
  daysLeft: number | null
): string {
  const parts: string[] = [];
  if (kmLeft !== null) {
    parts.push(
      kmLeft < 0
        ? `${formatOdometer(Math.abs(kmLeft))} km past due`
        : `${formatOdometer(kmLeft)} km to go`
    );
  }
  if (daysLeft !== null) {
    parts.push(
      daysLeft < 0
        ? `${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'} overdue`
        : daysLeft === 0
          ? 'due today'
          : `${daysLeft} day${daysLeft === 1 ? '' : 's'} to go`
    );
  }
  return parts.join(' · ');
}

type MaintenanceRowProps = {
  log: MaintenanceLog;
  currentOdometer: number;
  today: string;
  onPress: () => void;
};

export function MaintenanceRow({ log, currentOdometer, today, onPress }: MaintenanceRowProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const shadow = scheme === 'light' ? LightCardShadow : undefined;
  const { status, kmLeft, daysLeft } = getDueInfo(log, currentOdometer, today);
  const progress = getMaintenanceProgress(log, currentOdometer, today);
  const detail = dueText(kmLeft, daysLeft);
  const dueDate = log.nextDueDate === null ? '' : ` due ${formatDateShort(log.nextDueDate)}`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${MAINTENANCE_LABELS[log.type]}, ${status}, ${detail}${dueDate}${log.diy ? ', DIY' : ''}`}
      style={({ pressed }) => [
        styles.card,
        shadow,
        { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={styles.heading}>
        <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
          <Ionicons
            name={maintenanceIcon(log.type)}
            size={20}
            color={theme.accentInk}
            accessible={false}
          />
        </View>
        <View style={styles.details}>
          <View style={styles.titleRow}>
            <Text style={[Typography.heading, { color: theme.text }]}>
              {MAINTENANCE_LABELS[log.type]}
            </Text>
            {log.diy ? (
              <View style={[styles.diyBadge, { backgroundColor: theme.accentSoft }]}>
                <Text style={[styles.diyText, { color: theme.accentInk }]}>DIY</Text>
              </View>
            ) : null}
          </View>
          <Text style={[Typography.body, { color: theme.textMuted }]}>
            {detail}
            {dueDate}
          </Text>
        </View>
        <StatusChip tone={status} />
      </View>
      {progress !== null ? (
        <ProgressBar
          value={progress.value}
          max={progress.max}
          tone={progress.tone}
          accessibilityLabel={`${MAINTENANCE_LABELS[log.type]} ${progress.basis === 'km' ? 'kilometer' : 'date'} progress, ${detail}`}
        />
      ) : null}
      {log.notes !== null ? (
        <Text style={[Typography.body, styles.notes, { color: theme.textMuted }]} numberOfLines={2}>
          {log.notes}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.75,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
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
    gap: Spacing.half,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  diyBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
  },
  diyText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  notes: {
    fontSize: 13,
  },
});
