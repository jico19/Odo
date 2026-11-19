import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { ControlHeight, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  accessibilityLabel,
}: ButtonProps) {
  const theme = useTheme();
  const inert = disabled || loading;
  const foreground =
    variant === 'primary'
      ? theme.onAccent
      : variant === 'ghost'
        ? theme.accentInk
        : variant === 'danger'
          ? theme.dangerInk
          : theme.text;
  const background =
    variant === 'primary'
      ? theme.accentInk
      : variant === 'secondary'
        ? theme.surfaceAlt
        : variant === 'danger'
          ? theme.dangerSoft
          : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={inert}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inert, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        { backgroundColor: background },
        pressed && !inert && styles.pressed,
        inert && styles.inert,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={foreground} />
      ) : (
        <Text style={[Typography.body, styles.label, { color: foreground }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: ControlHeight,
    borderRadius: Radius.control,
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  inert: {
    opacity: 0.5,
  },
});
