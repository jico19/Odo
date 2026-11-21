import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet, Button, DateField, Input } from '@/components/ui';
import { ControlHeight, Radius, Spacing, Typography } from '@/constants/theme';
import type {
  PmsItemDraft,
  PmsItemFieldErrors,
  PmsItemLike,
  PmsItemUpdate,
  PmsTimeUnit,
} from '@/types/pms';
import type { DistanceUnit } from '@/types/preferences';
import { distanceToKm, distanceUnitLabel } from '@/utils/format';
import { formatInterval, isCustomized, pmsItemToDraft } from '@/utils/pms';
import { validatePmsItemDraft } from '@/utils/validation';

import { useTheme } from '@/hooks/use-theme';

const UNITS: readonly { value: PmsTimeUnit; label: string }[] = [
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
];

type EditPmsItemSheetProps = {
  item: PmsItemLike;
  distanceUnit?: DistanceUnit;
  hint?: string;
  onClose: () => void;
  onSave: (value: PmsItemUpdate) => void;
  onReset?: () => void;
};

export function EditPmsItemSheet({
  item,
  distanceUnit = 'km',
  hint,
  onClose,
  onSave,
  onReset,
}: EditPmsItemSheetProps) {
  const theme = useTheme();
  const [draft, setDraft] = useState<PmsItemDraft>(() => pmsItemToDraft(item, distanceUnit));
  const [errors, setErrors] = useState<PmsItemFieldErrors>({});

  function update<K extends keyof PmsItemDraft>(field: K, value: PmsItemDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSave() {
    const result = validatePmsItemDraft(draft, undefined, distanceUnit);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onSave({
      ...result.value,
      intervalKm:
        result.value.intervalKm === null
          ? null
          : Math.round(distanceToKm(result.value.intervalKm, distanceUnit)),
      lastDoneOdometer:
        result.value.lastDoneOdometer === null
          ? null
          : Math.round(distanceToKm(result.value.lastDoneOdometer, distanceUnit)),
    });
  }

  const customized = !item.isCustom && isCustomized(item);
  const intervalPlaceholder = distanceUnit === 'mi' ? '2000' : '3000';
  const odometerPlaceholder = distanceUnit === 'mi' ? '9300' : '15000';

  return (
    <BottomSheet onClose={onClose} dismissLabel="Close PMS item editor" title="Edit interval">
      {item.isCustom ? (
        <Input
          label="Item name"
          value={draft.label}
          onChangeText={(value) => update('label', value)}
          placeholder="e.g. Drive belt"
          error={errors.label}
        />
      ) : (
        <View style={styles.itemInfo}>
          <Text style={[Typography.heading, { color: theme.text }]}>{item.label}</Text>
          {hint ? (
            <Text style={[Typography.body, styles.hint, { color: theme.textMuted }]}>{hint}</Text>
          ) : null}
          <Text style={[Typography.body, styles.hint, { color: theme.textMuted }]}>
            Default: {formatInterval(item.defaultIntervalKm, item.defaultIntervalDays, distanceUnit)}
          </Text>
          {customized ? (
            <Text style={[Typography.label, styles.customized, { color: theme.warningInk }]}>
              Customized
            </Text>
          ) : null}
        </View>
      )}

      <Input
        label="Interval by distance"
        value={draft.intervalKm}
        onChangeText={(value) => update('intervalKm', value)}
        placeholder={intervalPlaceholder}
        unit={distanceUnitLabel(distanceUnit)}
        numeric
        error={errors.intervalKm}
      />

      <View style={styles.field}>
        <Text style={[Typography.label, { color: theme.textMuted }]}>Interval by time</Text>
        <View style={styles.unitRow}>
          {UNITS.map((unit) => {
            const selected = draft.intervalUnit === unit.value;
            return (
              <Pressable
                key={unit.value}
                onPress={() => update('intervalUnit', unit.value)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[
                  styles.unitChip,
                  {
                    backgroundColor: selected ? theme.accentSoft : theme.surfaceAlt,
                    borderColor: selected ? theme.accent : theme.border,
                  },
                ]}>
                <Text
                  style={[
                    Typography.body,
                    { color: selected ? theme.accentInk : theme.text, fontWeight: '600' },
                  ]}>
                  {unit.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Input
          label="Amount"
          value={draft.intervalValue}
          onChangeText={(value) => update('intervalValue', value)}
          placeholder="6"
          numeric
          error={errors.intervalValue}
        />
      </View>

      <Text style={[Typography.body, styles.note, { color: theme.textMuted }]}>
        Service is due when either interval is reached, whichever comes first. Set both, or leave one
        blank.
      </Text>

      <View style={[styles.lastDone, { borderTopColor: theme.border }]}>
        <Text style={[Typography.label, { color: theme.textMuted }]}>Last done (optional)</Text>
        <Input
          label="Odometer"
          value={draft.lastDoneOdometer}
          onChangeText={(value) => update('lastDoneOdometer', value)}
          placeholder={odometerPlaceholder}
          unit={distanceUnitLabel(distanceUnit)}
          numeric
          error={errors.lastDoneOdometer}
        />
        <DateField
          label="Date"
          value={draft.lastDoneDate}
          onChange={(value) => update('lastDoneDate', value)}
          error={errors.lastDoneDate}
          clearable
        />
      </View>

      <View style={styles.current}>
        <Text style={[Typography.label, { color: theme.textMuted }]}>Current interval</Text>
        <Text style={[Typography.mono, { color: theme.text }]}>
          {formatInterval(item.intervalKm, item.intervalDays, distanceUnit)}
        </Text>
      </View>

      {onReset && !item.isCustom ? (
        <Button
          label={
            customized ? 'Reset to default interval' : 'Already using the default interval'
          }
          variant="ghost"
          onPress={() => {
            onReset();
            onClose();
          }}
          disabled={!customized}
        />
      ) : null}

      <View style={styles.actions}>
        <Button label="Save interval" onPress={handleSave} fullWidth />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  itemInfo: {
    gap: Spacing.half,
  },
  hint: {
    fontSize: 13,
  },
  customized: {
    marginTop: Spacing.half,
  },
  field: {
    gap: Spacing.two,
  },
  unitRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  unitChip: {
    flex: 1,
    minHeight: ControlHeight,
    borderRadius: Radius.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    fontSize: 13,
  },
  lastDone: {
    gap: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
  },
  current: {
    gap: Spacing.half,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
