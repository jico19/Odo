import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { ControlHeight, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type InputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  unit?: string;
  numeric?: boolean;
  error?: string;
  multiline?: boolean;
  autoFocus?: boolean;
  secureTextEntry?: boolean;
};

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  unit,
  numeric = false,
  error,
  multiline = false,
  autoFocus = false,
  secureTextEntry = false,
}: InputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? theme.dangerInk : focused ? theme.accent : theme.border;

  return (
    <View style={styles.field}>
      <Text style={[Typography.label, { color: theme.textMuted }]}>{label}</Text>
      <View
        style={[
          styles.control,
          multiline && styles.multiline,
          { backgroundColor: theme.surfaceAlt, borderColor },
        ]}>
        <TextInput
          style={[Typography.body, styles.input, { color: theme.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          keyboardType={numeric ? 'decimal-pad' : 'default'}
          autoFocus={autoFocus}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          accessibilityLabel={label}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {unit ? (
          <Text style={[Typography.mono, styles.unit, { color: theme.textMuted }]}>{unit}</Text>
        ) : null}
      </View>
      {error ? (
        <Text style={[Typography.body, { color: theme.dangerInk }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  control: {
    minHeight: ControlHeight,
    borderRadius: Radius.control,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
  },
  multiline: {
    minHeight: 64,
    alignItems: 'flex-start',
    paddingVertical: Spacing.two,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
  },
  unit: {
    marginLeft: Spacing.two,
  },
});
