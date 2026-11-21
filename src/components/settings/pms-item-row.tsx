import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { pmsIcon } from '@/components/pms/pms-icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PmsItem } from '@/types/pms';
import type { DistanceUnit } from '@/types/preferences';
import { formatInterval, isCustomized } from '@/utils/pms';

type PmsItemRowProps = {
  item: PmsItem;
  distanceUnit?: DistanceUnit;
  last: boolean;
  onEdit: () => void;
  onReset: () => void;
  onToggle: (enabled: boolean) => void;
};

export function PmsItemRow({
  item,
  distanceUnit = 'km',
  last,
  onEdit,
  onReset,
  onToggle,
}: PmsItemRowProps) {
  const theme = useTheme();
  const customized = !item.isCustom && isCustomized(item);

  return (
    <View
      style={[
        styles.row,
        !last && styles.divider,
        { borderBottomColor: theme.border, opacity: item.enabled ? 1 : 0.55 },
      ]}>
      <Pressable
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${item.label}`}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}>
        <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name={pmsIcon(item.type)} size={19} color={theme.accentInk} accessible={false} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {item.label}
          </Text>
          <Text style={[styles.interval, { color: theme.textMuted }]} numberOfLines={1}>
            {formatInterval(item.intervalKm, item.intervalDays, distanceUnit)}
            {customized ? ' · customized' : ''}
          </Text>
        </View>
        {customized ? (
          <Pressable
            onPress={onReset}
            accessibilityRole="button"
            accessibilityLabel={`Reset ${item.label} to default`}
            hitSlop={8}
            style={styles.reset}>
            <Ionicons name="refresh-outline" size={18} color={theme.accentInk} accessible={false} />
          </Pressable>
        ) : null}
      </Pressable>
      <Switch
        value={item.enabled}
        onValueChange={onToggle}
        accessibilityLabel={`${item.enabled ? 'Disable' : 'Enable'} ${item.label}`}
        trackColor={{ false: theme.border, true: theme.accent }}
        thumbColor={theme.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  divider: {
    borderBottomWidth: 1,
  },
  main: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.control,
  },
  pressed: {
    opacity: 0.75,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: Radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  interval: {
    fontSize: 13,
  },
  reset: {
    minWidth: 32,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
