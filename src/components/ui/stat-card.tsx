import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LightCardShadow, Radius, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

import { Button } from './button';
import { ProgressBar } from './progress-bar';
import { StatusChip, type StatusTone } from './status-chip';

type StatCardBase = {
  label: string;
  value: string | number;
  unit?: string;
  status?: { tone: StatusTone; label: string };
  progress?: { value: number; max: number; tone?: StatusTone; accessibilityLabel?: string };
  hero?: boolean;
  accessibilityLabel?: string;
};

type Tappable = { onPress: () => void; action?: never };
type WithAction = { action: { label: string; onPress: () => void }; onPress?: never };
type Static = { onPress?: never; action?: never };

export type StatCardProps = StatCardBase & (Tappable | WithAction | Static);

export function StatCard({
  label,
  value,
  unit,
  status,
  progress,
  hero = false,
  accessibilityLabel,
  onPress,
  action,
}: StatCardProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const shadow = scheme === 'light' ? LightCardShadow : undefined;
  const description = accessibilityLabel ?? `${label}, ${value}${unit ? ` ${unit}` : ''}`;

  const content = (
    <>
      <Text style={[Typography.label, { color: theme.textMuted }]}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[Typography.display, styles.value, { color: theme.text }]}>{value}</Text>
        {unit ? <Text style={[Typography.mono, styles.unit, { color: theme.textMuted }]}>{unit}</Text> : null}
      </View>
      {status || progress ? (
        <View style={styles.footer}>
          {status ? <StatusChip tone={status.tone} label={status.label} /> : null}
          {progress ? (
            <ProgressBar
              value={progress.value}
              max={progress.max}
              tone={progress.tone}
              accessibilityLabel={progress.accessibilityLabel ?? `${label} progress`}
            />
          ) : null}
        </View>
      ) : null}
      {action ? (
        <View style={styles.action}>
          <Button label={action.label} onPress={action.onPress} variant="ghost" />
        </View>
      ) : null}
    </>
  );

  return (
    <View style={[styles.card, hero && styles.hero, shadow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={description}
          style={styles.pressable}>
          {content}
        </Pressable>
      ) : (
        <View accessible accessibilityLabel={description} style={styles.content}>
          {content}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.three,
    overflow: 'hidden',
  },
  hero: {
    width: '100%',
  },
  pressable: {
    minHeight: 44,
  },
  content: {
    minHeight: 44,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  value: {
    flexShrink: 1,
  },
  unit: {
    paddingBottom: Spacing.half,
  },
  footer: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  action: {
    alignItems: 'flex-end',
    marginTop: Spacing.two,
    marginHorizontal: -Spacing.two,
  },
});
