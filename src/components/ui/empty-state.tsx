import { Ionicons } from '@react-native-vector-icons/ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Button } from './button';
import { type IconName } from './list-row';

export type EmptyStateProps = {
  icon: IconName;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, message, actionLabel, onAction }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
        <Ionicons name={icon} size={24} color={theme.accentInk} accessible={false} />
      </View>
      <Text style={[Typography.body, styles.message, { color: theme.textMuted }]}>{message}</Text>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    marginTop: Spacing.three,
  },
  action: {
    marginTop: Spacing.four,
  },
});
