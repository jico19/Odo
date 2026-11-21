import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ControlHeight, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { TRANSMISSION_KEYS, TRANSMISSION_LABELS, type TransmissionType } from '@/types/pms';

type DrivetrainStepProps = {
  transmission: TransmissionType | '';
  isLiquidCooled: boolean;
  error?: string;
  onTransmission: (value: TransmissionType) => void;
  onLiquidCooled: (value: boolean) => void;
};

export function DrivetrainStep({
  transmission,
  isLiquidCooled,
  error,
  onTransmission,
  onLiquidCooled,
}: DrivetrainStepProps) {
  const theme = useTheme();

  return (
    <View style={styles.content}>
      <Text style={[Typography.title, { color: theme.text }]}>How is it driven?</Text>
      <Text style={[Typography.body, styles.subtitle, { color: theme.textMuted }]}>
        This builds a starting checklist. Every interval stays editable, and changing this later
        never touches your service history.
      </Text>

      <View style={styles.field}>
        <Text style={[Typography.label, { color: theme.textMuted }]}>Transmission</Text>
        <View style={styles.options}>
          {TRANSMISSION_KEYS.map((value) => {
            const selected = transmission === value;
            return (
              <Pressable
                key={value}
                onPress={() => onTransmission(value)}
                accessibilityRole="button"
                accessibilityLabel={TRANSMISSION_LABELS[value]}
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
                  {TRANSMISSION_LABELS[value]}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {error !== undefined ? (
          <Text style={[Typography.body, styles.error, { color: theme.dangerInk }]}>{error}</Text>
        ) : null}
      </View>

      <Pressable
        onPress={() => onLiquidCooled(!isLiquidCooled)}
        accessibilityRole="checkbox"
        accessibilityLabel="Liquid-cooled engine"
        accessibilityState={{ checked: isLiquidCooled }}
        style={styles.toggleRow}>
        <Ionicons
          name={isLiquidCooled ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={isLiquidCooled ? theme.accent : theme.textMuted}
          accessible={false}
        />
        <View style={styles.toggleCopy}>
          <Text style={[Typography.body, { color: theme.text }]}>Liquid-cooled engine</Text>
          <Text style={[styles.hint, { color: theme.textMuted }]}>
            Adds a coolant check to the checklist. Air-cooled bikes can skip it.
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.two,
  },
  subtitle: {
    marginBottom: Spacing.two,
  },
  field: {
    gap: Spacing.two,
  },
  options: {
    gap: Spacing.two,
  },
  option: {
    minHeight: ControlHeight,
    borderRadius: Radius.control,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  optionText: {
    fontWeight: '600',
  },
  error: {
    marginTop: Spacing.half,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: ControlHeight,
    marginTop: Spacing.two,
  },
  toggleCopy: {
    flex: 1,
    gap: Spacing.half,
  },
  hint: {
    fontSize: 13,
  },
});
