import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FloatingActionButtonProps = {
  onPress: () => void;
  bottom: number;
  label?: string;
};

export function FloatingActionButton({
  onPress,
  bottom,
  label = 'Add entry',
}: FloatingActionButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.accent, bottom, opacity: pressed ? 0.8 : 1 },
      ]}>
      <Ionicons name="add" size={24} color={theme.onAccent} accessible={false} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    right: Spacing.three,
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
