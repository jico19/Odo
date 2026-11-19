import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type IconName } from '@/components/ui';
import { ControlHeight, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type QuickAddRowProps = {
  onLogFuel: () => void;
  onAddService: () => void;
  onStartTrip: () => void;
};

type QuickAction = {
  icon: IconName;
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  primary?: boolean;
};

export function QuickAddRow({ onLogFuel, onAddService, onStartTrip }: QuickAddRowProps) {
  const theme = useTheme();
  const actions: QuickAction[] = [
    {
      icon: 'water-outline',
      label: 'LOG FUEL',
      accessibilityLabel: 'Log fuel',
      onPress: onLogFuel,
      primary: true,
    },
    {
      icon: 'construct-outline',
      label: 'ADD SERVICE',
      accessibilityLabel: 'Add maintenance service',
      onPress: onAddService,
    },
    {
      icon: 'play-circle-outline',
      label: 'START GPS TRIP',
      accessibilityLabel: 'Start a GPS trip',
      onPress: onStartTrip,
    },
  ];

  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <Pressable
          key={action.label}
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.accessibilityLabel}
          style={({ pressed }) => [
            styles.action,
            action.primary
              ? { backgroundColor: theme.accent }
              : { backgroundColor: theme.surfaceAlt },
            pressed && styles.pressed,
          ]}>
          <Ionicons
            name={action.icon}
            size={20}
            color={action.primary ? theme.onAccent : theme.accentInk}
            accessible={false}
          />
          <Text
            style={[
              Typography.label,
              styles.label,
              { color: action.primary ? theme.onAccent : theme.text },
            ]}>
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  action: {
    flex: 1,
    minWidth: 140,
    minHeight: ControlHeight,
    borderRadius: Radius.control,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  label: {
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.8,
  },
});
