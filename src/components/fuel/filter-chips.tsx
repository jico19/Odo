import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type FuelFilter = 'all' | 'full' | 'partial';

type FilterChipsProps = {
  value: FuelFilter;
  onChange: (value: FuelFilter) => void;
  totalCount: number;
};

const FILTERS: { value: FuelFilter; label: string }[] = [
  { value: 'all', label: 'All Fill-ups' },
  { value: 'full', label: 'Full Tank' },
  { value: 'partial', label: 'Partial' },
];

export function FilterChips({ value, onChange, totalCount }: FilterChipsProps) {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}>
      {FILTERS.map((filter) => {
        const active = filter.value === value;
        const label =
          filter.value === 'all' ? `${filter.label} (${totalCount})` : filter.label;

        return (
          <Pressable
            key={filter.value}
            onPress={() => onChange(filter.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
            style={({ pressed }) => [
              styles.chip,
              active
                ? { backgroundColor: theme.accentInk, borderColor: theme.accentInk }
                : { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
              pressed && !active && styles.pressed,
            ]}>
            <Text
              style={[
                Typography.label,
                styles.chipLabel,
                { color: active ? theme.onAccent : theme.textMuted },
              ]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.two,
    paddingRight: Spacing.three,
  },
  chip: {
    minHeight: 44,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: 'none',
  },
  pressed: {
    opacity: 0.75,
  },
});
