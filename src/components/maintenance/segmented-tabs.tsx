import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SegmentedTabsProps<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedTabs<T extends string>({ options, value, onChange }: SegmentedTabsProps<T>) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.container, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            style={[
              styles.segment,
              selected && [styles.selected, { backgroundColor: theme.surface, borderColor: theme.border }],
            ]}>
            <Text
              style={[
                Typography.body,
                styles.label,
                { color: selected ? theme.text : theme.textMuted, fontWeight: selected ? '600' : '400' },
              ]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.half,
    padding: Spacing.half,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selected: {
    borderWidth: 1,
  },
  label: {
    textAlign: 'center',
  },
});
