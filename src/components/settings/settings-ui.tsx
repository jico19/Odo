import { Ionicons } from '@react-native-vector-icons/ionicons';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { IconName } from '@/components/ui';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[Typography.label, styles.sectionTitle, { color: theme.textMuted }]}>{title}</Text>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {children}
      </View>
    </View>
  );
}

type SettingsRowProps = {
  icon: IconName;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  right?: ReactNode;
  last?: boolean;
};

export function SettingsRow({
  icon,
  title,
  subtitle,
  value,
  onPress,
  right,
  last = false,
}: SettingsRowProps) {
  const theme = useTheme();
  const content = (
    <>
      <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
        <Ionicons name={icon} size={20} color={theme.accentInk} accessible={false} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle !== undefined ? (
          <Text style={[styles.subtitle, { color: theme.textMuted }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value !== undefined ? (
        <Text style={[styles.value, { color: theme.textMuted }]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {right ?? (onPress !== undefined ? <Ionicons name="chevron-forward" size={18} color={theme.textMuted} accessible={false} /> : null)}
    </>
  );

  const style = [styles.row, !last && styles.divider, { borderBottomColor: theme.border }];

  if (onPress !== undefined) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={[title, value, subtitle].filter(Boolean).join(', ')}
        style={({ pressed }) => [style, pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return <View style={style}>{content}</View>;
}

export function SettingsOptions<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.options}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            style={[
              styles.option,
              {
                backgroundColor: selected ? theme.accentSoft : theme.surfaceAlt,
                borderColor: selected ? theme.accent : theme.border,
              },
            ]}>
            <Text
              style={[
                Typography.body,
                styles.optionText,
                { color: selected ? theme.accentInk : theme.text },
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
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.half,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.card,
    overflow: 'hidden',
  },
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
  pressed: {
    opacity: 0.7,
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
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  value: {
    fontSize: 14,
    maxWidth: 140,
    textAlign: 'right',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  option: {
    minHeight: 40,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontWeight: '600',
    fontSize: 14,
  },
});
