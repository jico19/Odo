import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { pmsIcon } from '@/components/pms/pms-icons';
import { Button } from '@/components/ui';
import { ControlHeight, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { NewPmsItem } from '@/types/pms';
import { formatInterval, isCustomized } from '@/utils/pms';

type PmsStepProps = {
  items: NewPmsItem[];
  error?: string;
  onEdit: (type: string) => void;
  onAdd: () => void;
  onRemove: (type: string) => void;
};

export function PmsStep({ items, error, onEdit, onAdd, onRemove }: PmsStepProps) {
  const theme = useTheme();

  return (
    <View style={styles.content}>
      <Text style={[Typography.title, { color: theme.text }]}>Tune your intervals</Text>
      <Text style={[Typography.body, styles.subtitle, { color: theme.textMuted }]}>
        These are suggested starting points. Set what matches your bike and riding — service is due
        when either the distance or the time is reached.
      </Text>

      {items.length === 0 ? (
        <Text style={[Typography.body, styles.empty, { color: theme.textMuted }]}>
          Choose a transmission in the previous step to get a checklist.
        </Text>
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <View
              key={item.type}
              style={[styles.row, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
              <Pressable
                onPress={() => onEdit(item.type)}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${item.label}`}
                style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}>
                <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name={pmsIcon(item.type)} size={20} color={theme.accentInk} accessible={false} />
                </View>
                <View style={styles.details}>
                  <Text style={[styles.label, { color: theme.text }]} numberOfLines={1}>
                    {item.label}
                  </Text>
                  <Text style={[styles.interval, { color: theme.textMuted }]}>
                    {formatInterval(item.intervalKm, item.intervalDays)}
                    {isCustomized(item) ? ' · customized' : ''}
                  </Text>
                </View>
                <Ionicons name="create-outline" size={18} color={theme.textMuted} accessible={false} />
              </Pressable>
              {item.isCustom ? (
                <Pressable
                  onPress={() => onRemove(item.type)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.label}`}
                  hitSlop={8}
                  style={styles.remove}>
                  <Ionicons name="close-circle-outline" size={20} color={theme.dangerInk} accessible={false} />
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {error !== undefined ? (
        <Text style={[Typography.body, styles.error, { color: theme.dangerInk }]}>{error}</Text>
      ) : null}

      <Button label="Add custom item" variant="secondary" onPress={onAdd} fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.two,
  },
  subtitle: {
    marginBottom: Spacing.two,
  },
  empty: {
    paddingVertical: Spacing.four,
    textAlign: 'center',
  },
  list: {
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.control,
    borderWidth: 1,
    paddingRight: Spacing.two,
  },
  rowMain: {
    flex: 1,
    minHeight: ControlHeight + Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.control,
  },
  pressed: {
    opacity: 0.75,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  interval: {
    fontSize: 13,
  },
  remove: {
    minWidth: 36,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    marginTop: Spacing.half,
  },
});
