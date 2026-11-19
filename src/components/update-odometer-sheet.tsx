import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatOdometer } from '@/utils/format';
import { validateOdometerUpdate } from '@/utils/validation';

import { Button, Input } from './ui';

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
    const result = validateOdometerUpdate(value, current);
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
          accessibilityLabel="Close update odometer"
        />
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}>
          <SafeAreaView edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              <View style={styles.heading}>
                <Text style={[Typography.title, { color: theme.text }]}>Update odometer</Text>
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
                <Button label="Cancel" onPress={onClose} variant="secondary" />
                <Button label="Save reading" onPress={handleSave} loading={saving} />
              </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
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
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  heading: {
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});
