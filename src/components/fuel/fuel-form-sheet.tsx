import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { ControlHeight, Radius, Spacing, Typography } from '@/constants/theme';
import { localDateKey } from '@/hooks/use-today';
import { useTheme } from '@/hooks/use-theme';
import type { FuelDraft, FuelLog, NewFuelLog } from '@/types/fuel';
import { formatCurrency } from '@/utils/format';
import {
  parseOdometer,
  validateFuelDraft,
  type FuelFieldErrors,
} from '@/utils/validation';

import { BottomSheet, Button, DateField, Input } from '@/components/ui';

type FuelFormSheetProps = {
  initialLog: FuelLog | null;
  onClose: () => void;
  onSave: (input: NewFuelLog) => void;
};

function toDraft(log: FuelLog | null): FuelDraft {
  return {
    date: log?.date ?? localDateKey(new Date()),
    liters: log === null ? '' : String(log.liters),
    pricePerLiter: log?.pricePerLiter == null ? '' : String(log.pricePerLiter),
    odometer: log?.odometer == null ? '' : String(log.odometer),
    fullTank: log?.fullTank ?? true,
  };
}

export function FuelFormSheet({ initialLog, onClose, onSave }: FuelFormSheetProps) {
  const theme = useTheme();
  const [draft, setDraft] = useState<FuelDraft>(() => toDraft(initialLog));
  const [errors, setErrors] = useState<FuelFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const liters = parseOdometer(draft.liters);
  const price = parseOdometer(draft.pricePerLiter);
  const total =
    liters !== null && price !== null && liters > 0 && price >= 0
      ? Math.round((liters * price + Number.EPSILON) * 100) / 100
      : null;

  function update(field: keyof Omit<FuelDraft, 'fullTank'>, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  }

  function handleSave() {
    const result = validateFuelDraft(draft);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setSaving(true);
    try {
      onSave(result.value);
    } catch (cause: unknown) {
      setFormError(cause instanceof Error ? cause.message : 'Could not save the fuel log.');
      setSaving(false);
    }
  }

  return (
    <BottomSheet onClose={onClose} dismissLabel="Close fuel form">
      <Text style={[Typography.title, { color: theme.text }]}>
        {initialLog === null ? 'Add fuel' : 'Edit fuel'}
      </Text>

      <DateField
        label="Date"
        value={draft.date}
        onChange={(value) => update('date', value)}
        error={errors.date}
      />
      <Input
        label="Liters"
        value={draft.liters}
        onChangeText={(value) => update('liters', value)}
        placeholder="20"
        unit="L"
        numeric
        error={errors.liters}
      />
      <Input
        label="Price per liter"
        value={draft.pricePerLiter}
        onChangeText={(value) => update('pricePerLiter', value)}
        placeholder="60"
        unit="₱/L"
        numeric
        error={errors.pricePerLiter}
      />

      <View style={styles.field}>
        <Text style={[Typography.label, { color: theme.textMuted }]}>Total</Text>
        <View
          style={[
            styles.readOnlyControl,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
          ]}>
          <Text style={[Typography.body, { color: theme.text }]}>
            {total === null ? '—' : formatCurrency(total)}
          </Text>
        </View>
      </View>

      <Input
        label="Odometer"
        value={draft.odometer}
        onChangeText={(value) => update('odometer', value)}
        placeholder="1650"
        unit="km"
        numeric
        error={errors.odometer}
      />

      <View style={styles.toggleRow}>
        <View style={styles.toggleCopy}>
          <Text style={[Typography.body, { color: theme.text }]}>Full tank</Text>
          <Text style={[Typography.body, { color: theme.textMuted }]}>
            Tank filled to the top
          </Text>
        </View>
        <Switch
          value={draft.fullTank}
          onValueChange={(value) => setDraft((current) => ({ ...current, fullTank: value }))}
          trackColor={{ false: theme.border, true: theme.accentSoft }}
          thumbColor={draft.fullTank ? theme.accent : theme.surface}
          ios_backgroundColor={theme.border}
          accessibilityLabel="Full tank"
        />
      </View>

      {formError !== null ? (
        <Text style={[Typography.body, { color: theme.dangerInk }]}>{formError}</Text>
      ) : null}

      <View style={styles.actions}>
        <Button label="Cancel" onPress={onClose} variant="secondary" />
        <Button
          label={initialLog === null ? 'Add fuel' : 'Save changes'}
          onPress={handleSave}
          loading={saving}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  readOnlyControl: {
    minHeight: ControlHeight,
    borderRadius: Radius.control,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  toggleCopy: {
    flexShrink: 1,
    gap: Spacing.half,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});
