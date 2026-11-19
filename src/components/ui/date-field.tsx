import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ControlHeight, Radius, Spacing, Typography } from '@/constants/theme';
import { localDateKey } from '@/hooks/use-today';
import { useTheme } from '@/hooks/use-theme';
import { isValidDate } from '@/utils/validation';

import { Button } from './button';
import { Input } from './input';

export type DateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  clearable?: boolean;
};

function toDate(raw: string): Date {
  if (isValidDate(raw)) {
    const [year, month, day] = raw.split('-').map(Number);
    return new Date(year, month - 1, day, 12);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
}

function toDisplayDate(raw: string): string {
  if (!isValidDate(raw)) return raw;
  return toDate(raw).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Select a date',
  error,
  clearable = false,
}: DateFieldProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Date>(() => toDate(value));

  if (Platform.OS === 'web') {
    return (
      <Input
        label={label}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        error={error}
      />
    );
  }

  function openPicker() {
    setPending(toDate(value));
    setOpen(true);
  }

  function closePicker() {
    setOpen(false);
  }

  function commit(date: Date) {
    onChange(localDateKey(date));
    setOpen(false);
  }

  function clear() {
    onChange('');
    setOpen(false);
  }

  const field = (
    <View style={styles.field}>
      <Text style={[Typography.label, { color: theme.textMuted }]}>{label}</Text>
      <Pressable
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value === '' ? placeholder : toDisplayDate(value)}`}
        style={[
          styles.control,
          { backgroundColor: theme.surfaceAlt, borderColor: error ? theme.dangerInk : theme.border },
        ]}>
        <Text style={[Typography.body, styles.value, { color: value === '' ? theme.textMuted : theme.text }]}>
          {value === '' ? placeholder : toDisplayDate(value)}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={theme.accentInk} accessible={false} />
      </Pressable>
      {error ? (
        <Text style={[Typography.body, { color: theme.dangerInk }]}>{error}</Text>
      ) : null}
    </View>
  );

  if (Platform.OS === 'android') {
    return (
      <>
        {field}
        {open ? (
          <DateTimePicker
            value={pending}
            mode="date"
            display="default"
            positiveButton={{ label: 'OK', textColor: theme.accentInk }}
            negativeButton={{ label: 'Cancel', textColor: theme.textMuted }}
            neutralButton={
              clearable ? { label: 'Clear', textColor: theme.textMuted } : undefined
            }
            onValueChange={(_event, date) => {
              if (!date) {
                closePicker();
                return;
              }
              commit(date);
            }}
            onDismiss={closePicker}
            onNeutralButtonPress={clearable ? clear : undefined}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      {field}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={closePicker}
        accessibilityViewIsModal>
        <View style={styles.overlay}>
          <Pressable
            style={styles.dismissArea}
            onPress={closePicker}
            accessibilityRole="button"
            accessibilityLabel="Close date picker"
          />
          <View
            style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[Typography.heading, { color: theme.text }]}>{label}</Text>
            <DateTimePicker
              value={pending}
              mode="date"
              display="spinner"
              textColor={theme.text}
              onValueChange={(_event, date) => {
                if (date) setPending(date);
              }}
            />
            <View style={styles.actions}>
              {clearable ? (
                <Button label="Clear" variant="ghost" onPress={clear} />
              ) : null}
              <Button label="Cancel" variant="secondary" onPress={closePicker} />
              <Button label="Done" onPress={() => commit(pending)} />
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  value: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  dismissArea: {
    flex: 1,
  },
  panel: {
    borderTopLeftRadius: Radius.card,
    borderTopRightRadius: Radius.card,
    borderTopWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
