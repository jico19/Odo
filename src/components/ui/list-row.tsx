import { Ionicons } from '@react-native-vector-icons/ionicons';
import { type ComponentProps, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export type ListRowProps = {
  icon: IconName;
  title: string;
  subtitle?: string;
  value?: string;
  date?: string;
  badge?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  divider?: boolean;
};

export function ListRow({
  icon,
  title,
  subtitle,
  value,
  date,
  badge,
  onPress,
  accessibilityLabel,
  divider = true,
}: ListRowProps) {
  const theme = useTheme();
  const description = accessibilityLabel ?? [title, subtitle, value, date].filter(Boolean).join(', ');

  const content = (
    <>
      <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
        <Ionicons name={icon} size={20} color={theme.accentInk} accessible={false} />
      </View>
      <View style={styles.details}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[Typography.body, { color: theme.textMuted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {badge || value || date ? (
        <View style={styles.trailing}>
          {badge}
          {value ? (
            <Text style={[Typography.mono, styles.trailingText, { color: theme.text }]}>{value}</Text>
          ) : null}
          {date ? (
            <Text style={[Typography.label, styles.trailingText, { color: theme.textMuted }]}>
              {date}
            </Text>
          ) : null}
        </View>
      ) : null}
    </>
  );

  const rowStyle = [styles.row, divider && styles.divider, { borderBottomColor: theme.border }];

  return onPress ? (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={description}
      style={rowStyle}>
      {content}
    </Pressable>
  ) : (
    <View accessible accessibilityLabel={description} style={rowStyle}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  divider: {
    borderBottomWidth: 1,
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
  title: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  trailing: {
    alignItems: 'flex-end',
    flexShrink: 1,
    gap: Spacing.half,
  },
  trailingText: {
    textAlign: 'right',
  },
});
