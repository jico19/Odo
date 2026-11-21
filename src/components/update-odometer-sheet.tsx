import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet, Button, Input } from '@/components/ui';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatOdometer } from '@/utils/format';
import { validateOdometerUpdate } from '@/utils/validation';

type UpdateOdometerSheetProps = {
  current: number;
  onClose: () => void;
  onSave: (next: number) => void;
};

export function UpdateOdometerSheet({ current, onClose, onSave }: UpdateOdometerSheetProps) {
  const theme = useTheme();
  const [value, setValue] = useState(() => String(current));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleSave() {
    const result = validateOdometerUpdate(value);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSaving(true);
    try {
      onSave(result.value);
      onClose();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Could not update the odometer.');
      setSaving(false);
    }
  }

  return (
    <BottomSheet onClose={onClose} dismissLabel="Close update odometer" title="Update odometer">
      <View style={styles.heading}>
        <Text style={[Typography.body, { color: theme.textMuted }]}>
          Current reading: {formatOdometer(current)} km
        </Text>
      </View>

      <Input
        label="New reading"
        value={value}
        onChangeText={(text) => {
          setValue(text);
          setError(null);
        }}
        unit="km"
        numeric
        error={error ?? undefined}
        autoFocus
      />

      <View style={styles.actions}>
        <Button label="Save reading" onPress={handleSave} loading={saving} fullWidth />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});
