import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet, type IconName } from '@/components/ui';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PmsItem } from '@/types/pms';
import type { DistanceUnit } from '@/types/preferences';
import { formatInterval, isCustomized } from '@/utils/pms';

type PmsRowMenuProps = {
  item: PmsItem;
  distanceUnit?: DistanceUnit;
  onClose: () => void;
  onEdit: () => void;
  onReset: () => void;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
};

export function PmsRowMenu({
  item,
  distanceUnit = 'km',
  onClose,
  onEdit,
  onReset,
  onToggle,
  onDelete,
}: PmsRowMenuProps) {
  const theme = useTheme();
  const customized = !item.isCustom && isCustomized(item);

  return (
    <BottomSheet onClose={onClose} dismissLabel="Close service item menu" variant="compact">
      <Text style={[Typography.title, { color: theme.text }]}>{item.label}</Text>
      <Text style={[Typography.body, styles.interval, { color: theme.textMuted }]}>
        {formatInterval(item.intervalKm, item.intervalDays, distanceUnit)}
      </Text>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <MenuRow icon="create-outline" label="Edit interval" onPress={onEdit} />
        {customized ? (
          <MenuRow icon="refresh-outline" label="Reset to default interval" onPress={onReset} />
        ) : null}
        <MenuRow
          icon={item.enabled ? 'eye-off-outline' : 'eye-outline'}
          label={item.enabled ? 'Disable this item' : 'Enable this item'}
          onPress={() => onToggle(!item.enabled)}
        />
        {item.isCustom ? (
          <MenuRow icon="trash-outline" label="Delete custom item" destructive onPress={onDelete} />
        ) : null}
      </View>

      <Text style={[Typography.body, styles.note, { color: theme.textMuted }]}>
        Changes affect future due dates only. Past service records are never edited.
      </Text>
    </BottomSheet>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  destructive = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const theme = useTheme();
  const color = destructive ? theme.dangerInk : theme.text;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.pressed,
        { borderBottomColor: theme.border },
      ]}>
      <Ionicons name={icon} size={20} color={color} accessible={false} />
      <Text style={[Typography.body, styles.rowLabel, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={theme.textMuted} accessible={false} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  interval: {
    marginTop: Spacing.half,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.card,
    overflow: 'hidden',
    marginTop: Spacing.three,
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderBottomWidth: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  rowLabel: {
    flex: 1,
  },
  note: {
    fontSize: 13,
    marginTop: Spacing.three,
  },
});
