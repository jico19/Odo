import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ControlHeight, MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { localDateKey } from '@/hooks/use-today';
import { useTheme } from '@/hooks/use-theme';
import type { NewFuelLog } from '@/types/fuel';
import { roundTo } from '@/utils/calculations';
import { parseOdometer } from '@/utils/validation';

import { Input } from '../ui';

type QuickEntryDrawerProps = {
  defaultOdometer: number;
  onClose: () => void;
  onSave: (input: NewFuelLog) => void;
};

type QuickErrors = {
  odometer?: string;
  liters?: string;
  totalAmount?: string;
};

export function QuickEntryDrawer({ defaultOdometer, onClose, onSave }: QuickEntryDrawerProps) {
  const theme = useTheme();
  const [odometer, setOdometer] = useState(() => String(defaultOdometer));
  const [liters, setLiters] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [fullTank, setFullTank] = useState(true);
  const [errors, setErrors] = useState<QuickErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  function update(field: keyof QuickErrors, value: string) {
    setField(field, value);
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  }

  function setField(field: 'odometer' | 'liters' | 'totalAmount', value: string) {
    if (field === 'odometer') setOdometer(value);
    else if (field === 'liters') setLiters(value);
    else setTotalAmount(value);
  }

  function handleSave() {
    const odometerValue = parseOdometer(odometer);
    const litersValue = parseOdometer(liters);
    const totalValue = parseOdometer(totalAmount);
    const nextErrors: QuickErrors = {};

    if (odometerValue === null || odometerValue < 0) {
      nextErrors.odometer = 'Enter an odometer value of 0 or more.';
    }
    if (litersValue === null || litersValue <= 0) {
      nextErrors.liters = 'Enter liters greater than 0.';
    }
    if (totalValue === null || totalValue < 0) {
      nextErrors.totalAmount = 'Enter an amount of 0 or more.';
    }

    if (
      Object.keys(nextErrors).length > 0 ||
      odometerValue === null ||
      litersValue === null ||
      totalValue === null
    ) {
      setErrors(nextErrors);
      return;
    }

    try {
      onSave({
        date: localDateKey(new Date()),
        liters: litersValue,
        pricePerLiter: litersValue > 0 ? roundTo(totalValue / litersValue, 2) : 0,
        totalCost: roundTo(totalValue, 2),
        odometer: odometerValue,
        fullTank,
      });
    } catch (cause: unknown) {
      setFormError(cause instanceof Error ? cause.message : 'Could not save the fuel log.');
    }
  }

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
      accessibilityViewIsModal>
      <View style={styles.backdrop}>
        <Pressable
          style={styles.dismissArea}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close quick entry"
        />
        <View
          style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SafeAreaView edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              <View style={[styles.handle, { backgroundColor: theme.border }]} />
              <View style={styles.header}>
                <View style={styles.headerCopy}>
                  <Text style={[Typography.label, { color: theme.textMuted }]}>Telemetry Input</Text>
                  <Text style={[Typography.title, { color: theme.text }]}>Log Fuel Top-Up</Text>
                </View>
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close quick entry"
                  style={({ pressed }) => [
                    styles.close,
                    { backgroundColor: theme.surfaceAlt },
                    pressed && styles.pressed,
                  ]}>
                  <Ionicons name="close" size={20} color={theme.textMuted} accessible={false} />
                </Pressable>
              </View>

              <Input
                label="Odometer (KM)"
                value={odometer}
                onChangeText={(value) => update('odometer', value)}
                placeholder="18420"
                unit="km"
                numeric
                error={errors.odometer}
              />
              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <Input
                    label="Litres"
                    value={liters}
                    onChangeText={(value) => update('liters', value)}
                    placeholder="11.5"
                    unit="L"
                    numeric
                    error={errors.liters}
                  />
                </View>
                <View style={styles.rowItem}>
                  <Input
                    label="Total Amount"
                    value={totalAmount}
                    onChangeText={(value) => update('totalAmount', value)}
                    placeholder="700"
                    unit="₱"
                    numeric
                    error={errors.totalAmount}
                  />
                </View>
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleCopy}>
                  <Text style={[Typography.body, { color: theme.text }]}>Full tank</Text>
                  <Text style={[Typography.label, styles.toggleHint, { color: theme.textMuted }]}>
                    Needed to calculate km/L
                  </Text>
                </View>
                <Switch
                  value={fullTank}
                  onValueChange={setFullTank}
                  trackColor={{ false: theme.border, true: theme.accentSoft }}
                  thumbColor={fullTank ? theme.accent : theme.surface}
                  ios_backgroundColor={theme.border}
                  accessibilityLabel="Full tank"
                />
              </View>

              {formError === null ? null : (
                <Text style={[Typography.body, { color: theme.dangerInk }]}>{formError}</Text>
              )}

              <Pressable
                onPress={handleSave}
                accessibilityRole="button"
                accessibilityLabel="Record telemetry"
                style={({ pressed }) => [
                  styles.submit,
                  { backgroundColor: theme.accentInk },
                  pressed && styles.pressed,
                ]}>
                <Ionicons name="checkmark-circle" size={20} color={theme.onAccent} accessible={false} />
                <Text style={[Typography.label, styles.submitLabel, { color: theme.onAccent }]}>
                  Record Telemetry
                </Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: Radius.card,
    borderTopRightRadius: Radius.card,
    borderTopWidth: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: Radius.pill,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  rowItem: {
    flex: 1,
    minWidth: 0,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  toggleCopy: {
    flexShrink: 1,
    gap: 2,
  },
  toggleHint: {
    textTransform: 'none',
    letterSpacing: 0,
  },
  submit: {
    minHeight: ControlHeight,
    borderRadius: Radius.control,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  submitLabel: {
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  pressed: {
    opacity: 0.8,
  },
});
