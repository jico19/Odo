import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet, Button, DateField, Input } from '@/components/ui';
import { ControlHeight, Radius, Spacing, Typography } from '@/constants/theme';
import { localDateKey } from '@/hooks/use-today';
import { useTheme } from '@/hooks/use-theme';
import type { MaintenanceDraft, MaintenanceLog, NewMaintenanceLog } from '@/types/maintenance';
import type { PmsItem } from '@/types/pms';
import type { DistanceUnit } from '@/types/preferences';
import { distanceUnitLabel } from '@/utils/format';
import { maintenanceTypeForPms } from '@/utils/pms';
import {
  validateMaintenanceDraft,
  type MaintenanceFieldErrors,
} from '@/utils/validation';

type MaintenanceFormSheetProps = {
  initialLog: MaintenanceLog | null;
  pmsItems: PmsItem[];
  initialPmsItemId?: number | null;
  distanceUnit?: DistanceUnit;
  currency?: string;
  onClose: () => void;
  onSave: (input: NewMaintenanceLog) => void;
  onDelete: () => void;
};

function toDraft(
  log: MaintenanceLog | null,
  initialPmsItemId: number | null | undefined
): MaintenanceDraft {
  return {
    type: log?.type ?? 'other',
    date: log?.date ?? localDateKey(new Date()),
    odometer: log?.odometer == null ? '' : String(log.odometer),
    cost: log?.cost == null ? '' : String(log.cost),
    notes: log?.notes ?? '',
    nextDueKm: log?.nextDueKm == null ? '' : String(log.nextDueKm),
    nextDueDate: log?.nextDueDate ?? '',
    diy: log?.diy ?? false,
    pmsItemId: log?.pmsItemId ?? initialPmsItemId ?? null,
  };
}

export function MaintenanceFormSheet({
  initialLog,
  pmsItems,
  initialPmsItemId,
  distanceUnit = 'km',
  currency = 'PHP',
  onClose,
  onSave,
  onDelete,
}: MaintenanceFormSheetProps) {
  const theme = useTheme();
  const [draft, setDraft] = useState<MaintenanceDraft>(() =>
    toDraft(initialLog, initialPmsItemId)
  );
  const [errors, setErrors] = useState<MaintenanceFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedItem = pmsItems.find((item) => item.id === draft.pmsItemId) ?? null;

  function update<K extends keyof MaintenanceDraft>(field: K, value: MaintenanceDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  }

  function selectPmsItem(id: number | null) {
    const item = id === null ? null : (pmsItems.find((candidate) => candidate.id === id) ?? null);
    setDraft((current) => ({
      ...current,
      pmsItemId: id,
      type: item === null ? 'other' : maintenanceTypeForPms(item.type),
      nextDueKm: item === null ? current.nextDueKm : '',
      nextDueDate: item === null ? current.nextDueDate : '',
    }));
    setErrors({});
  }

  function handleSave() {
    const result = validateMaintenanceDraft(draft);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setSaving(true);
    try {
      onSave(result.value);
    } catch (cause: unknown) {
      setFormError(cause instanceof Error ? cause.message : 'Could not save the service record.');
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert(
      'Delete this service record?',
      'Its scheduled reminders will be cancelled too.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  }

  const unit = distanceUnitLabel(distanceUnit);

  return (
    <BottomSheet
      onClose={onClose}
      dismissLabel="Close maintenance form"
      title={initialLog === null ? 'Log service' : 'Edit service'}>
      <View style={styles.field}>
        <Text style={[Typography.label, { color: theme.textMuted }]}>Service item</Text>
        <View style={styles.chips}>
          <Pressable
            onPress={() => selectPmsItem(null)}
            accessibilityRole="button"
            accessibilityLabel="Other service"
            accessibilityState={{ selected: draft.pmsItemId === null }}
            style={[
              styles.chip,
              {
                backgroundColor: draft.pmsItemId === null ? theme.accentSoft : theme.surfaceAlt,
                borderColor: draft.pmsItemId === null ? theme.accent : theme.border,
              },
            ]}>
            <Text
              style={[
                Typography.body,
                styles.chipText,
                { color: draft.pmsItemId === null ? theme.accentInk : theme.text },
              ]}>
              Other
            </Text>
          </Pressable>
          {pmsItems.map((item) => {
            const selected = draft.pmsItemId === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => selectPmsItem(item.id)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{ selected }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? theme.accentSoft : theme.surfaceAlt,
                    borderColor: selected ? theme.accent : theme.border,
                  },
                ]}>
                <Text
                  style={[
                    Typography.body,
                    styles.chipText,
                    { color: selected ? theme.accentInk : theme.text },
                  ]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {selectedItem !== null ? (
          <Text style={[styles.hint, { color: theme.textMuted }]}>
            Last done for {selectedItem.label} will be updated. Its interval controls the next due
            date.
          </Text>
        ) : null}
      </View>

      <DateField
        label="Service date"
        value={draft.date}
        onChange={(value) => update('date', value)}
        error={errors.date}
      />
      <Input
        label="Odometer"
        value={draft.odometer}
        onChangeText={(value) => update('odometer', value)}
        placeholder="18500"
        unit={unit}
        numeric
        error={errors.odometer}
      />
      <Input
        label="Cost"
        value={draft.cost}
        onChangeText={(value) => update('cost', value)}
        placeholder="850"
        unit={currency === 'PHP' ? '₱' : currency}
        numeric
        error={errors.cost}
      />

      <Pressable
        onPress={() => update('diy', !draft.diy)}
        accessibilityRole="checkbox"
        accessibilityLabel="Done DIY"
        accessibilityState={{ checked: draft.diy }}
        style={styles.toggleRow}>
        <Ionicons
          name={draft.diy ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={draft.diy ? theme.accent : theme.textMuted}
          accessible={false}
        />
        <View style={styles.toggleCopy}>
          <Text style={[Typography.body, { color: theme.text }]}>Done DIY</Text>
          <Text style={[styles.hint, { color: theme.textMuted }]}>
            You did this service yourself.
          </Text>
        </View>
      </Pressable>

      <Input
        label="Notes"
        value={draft.notes}
        onChangeText={(value) => update('notes', value)}
        placeholder="What was done"
        multiline
      />

      {selectedItem === null ? (
        <View style={[styles.dueGroup, { borderTopColor: theme.border }]}>
          <Text style={[Typography.label, { color: theme.textMuted }]}>Next due</Text>
          <Input
            label={`Odometer (optional)`}
            value={draft.nextDueKm}
            onChangeText={(value) => update('nextDueKm', value)}
            placeholder="21500"
            unit={unit}
            numeric
            error={errors.nextDueKm}
          />
          <DateField
            label="Date (optional)"
            value={draft.nextDueDate}
            onChange={(value) => update('nextDueDate', value)}
            error={errors.nextDueDate}
            clearable
          />
          <Text style={[styles.hint, { color: theme.textMuted }]}>
            Date dues send reminders. Distance dues show in the app.
          </Text>
        </View>
      ) : null}

      {formError !== null ? (
        <Text style={[Typography.body, { color: theme.dangerInk }]}>{formError}</Text>
      ) : null}

      <View style={styles.actions}>
        <Button
          label={initialLog === null ? 'Log service' : 'Save changes'}
          onPress={handleSave}
          loading={saving}
          fullWidth
        />
      </View>

      {initialLog !== null ? (
        <Button label="Delete record" onPress={handleDelete} variant="ghost" />
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontWeight: '600',
    fontSize: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: ControlHeight,
  },
  toggleCopy: {
    gap: Spacing.half,
  },
  dueGroup: {
    gap: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});
