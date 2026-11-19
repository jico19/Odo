import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet, Button, DateField, Input } from '@/components/ui';
import { ControlHeight, Radius, Spacing, Typography } from '@/constants/theme';
import { localDateKey } from '@/hooks/use-today';
import { useTheme } from '@/hooks/use-theme';
import {
  MAINTENANCE_LABELS,
  MAINTENANCE_TYPES,
  type MaintenanceDraft,
  type MaintenanceLog,
  type NewMaintenanceLog,
} from '@/types/maintenance';
import {
  validateMaintenanceDraft,
  type MaintenanceFieldErrors,
} from '@/utils/validation';

type MaintenanceFormSheetProps = {
  initialLog: MaintenanceLog | null;
  onClose: () => void;
  onSave: (input: NewMaintenanceLog) => void;
  onDelete: () => void;
};

function toDraft(log: MaintenanceLog | null): MaintenanceDraft {
  return {
    type: log?.type ?? 'oil',
    date: log?.date ?? localDateKey(new Date()),
    odometer: log?.odometer == null ? '' : String(log.odometer),
    cost: log?.cost == null ? '' : String(log.cost),
    notes: log?.notes ?? '',
    nextDueKm: log?.nextDueKm == null ? '' : String(log.nextDueKm),
    nextDueDate: log?.nextDueDate ?? '',
    diy: log?.diy ?? false,
  };
}

export function MaintenanceFormSheet({
  initialLog,
  onClose,
  onSave,
  onDelete,
}: MaintenanceFormSheetProps) {
  const theme = useTheme();
  const [draft, setDraft] = useState<MaintenanceDraft>(() => toDraft(initialLog));
  const [errors, setErrors] = useState<MaintenanceFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof MaintenanceDraft>(field: K, value: MaintenanceDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
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

  return (
    <BottomSheet onClose={onClose} dismissLabel="Close maintenance form">
      <Text style={[Typography.title, { color: theme.text }]}>
        {initialLog === null ? 'Add service' : 'Edit service'}
      </Text>

      <View style={styles.field}>
        <Text style={[Typography.label, { color: theme.textMuted }]}>Type</Text>
        <View style={styles.chips}>
          {MAINTENANCE_TYPES.map((type) => {
            const selected = draft.type === type;
            return (
              <Pressable
                key={type}
                onPress={() => update('type', type)}
                accessibilityRole="button"
                accessibilityLabel={MAINTENANCE_LABELS[type]}
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
                  {MAINTENANCE_LABELS[type]}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
        placeholder="1650"
        unit="km"
        numeric
        error={errors.odometer}
      />
      <Input
        label="Cost"
        value={draft.cost}
        onChangeText={(value) => update('cost', value)}
        placeholder="850"
        unit="₱"
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

      <View style={[styles.dueGroup, { borderTopColor: theme.border }]}>
        <Text style={[Typography.label, { color: theme.textMuted }]}>Next due</Text>
        <Input
          label="Odometer (optional)"
          value={draft.nextDueKm}
          onChangeText={(value) => update('nextDueKm', value)}
          placeholder="3650"
          unit="km"
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
          Date dues send reminders. Kilometer dues show here in the app.
        </Text>
      </View>

      {formError !== null ? (
        <Text style={[Typography.body, { color: theme.dangerInk }]}>{formError}</Text>
      ) : null}

      <View style={styles.actions}>
        <Button label="Cancel" onPress={onClose} variant="secondary" />
        <Button
          label={initialLog === null ? 'Add service' : 'Save changes'}
          onPress={handleSave}
          loading={saving}
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
    minHeight: ControlHeight,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontWeight: '600',
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
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});
