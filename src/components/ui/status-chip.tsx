import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type StatusTone = 'ok' | 'dueSoon' | 'overdue';

export type StatusChipProps = {
  tone: StatusTone;
  label?: string;
  style?: ViewStyle;
};

const DEFAULT_LABELS: Record<StatusTone, string> = {
  ok: 'OK',
  dueSoon: 'DUE SOON',
  overdue: 'OVERDUE',
};

export function StatusChip({ tone, label, style }: StatusChipProps) {
  const theme = useTheme();
  const palette = {
    ok: { background: theme.accentSoft, foreground: theme.accentInk },
    dueSoon: { background: theme.warningSoft, foreground: theme.warningInk },
    overdue: { background: theme.dangerSoft, foreground: theme.dangerInk },
  }[tone];

  return (
    <View
      accessible
      accessibilityRole="text"
      style={[styles.chip, { backgroundColor: palette.background }, style]}>
      <Text style={[Typography.label, { color: palette.foreground }]}>
        {label ?? DEFAULT_LABELS[tone]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
});
