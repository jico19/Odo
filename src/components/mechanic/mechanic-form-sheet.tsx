import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';

import { BottomSheet, Button, DateField, Input } from '@/components/ui';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { localDateKey } from '@/hooks/use-today';
import { useTheme } from '@/hooks/use-theme';
import type { MechanicVisit, MechanicVisitDraft, NewMechanicVisit } from '@/types/mechanic';
import { copyIntoAppDocuments } from '@/utils/app-files';
import { validateMechanicVisitDraft, type MechanicFieldErrors } from '@/utils/validation';

type MechanicFormSheetProps = {
  initialVisit: MechanicVisit | null;
  onClose: () => void;
  onSave: (input: NewMechanicVisit) => void;
  onDelete: () => void;
};

function toDraft(visit: MechanicVisit | null): MechanicVisitDraft {
  return {
    date: visit?.date ?? localDateKey(new Date()),
    shop: visit?.shop ?? '',
    workDone: visit?.workDone ?? '',
    parts: visit?.parts ?? '',
    cost: visit?.cost === null || visit === null ? '' : String(visit.cost),
    odometer: visit?.odometer === null || visit === null ? '' : String(visit.odometer),
    receiptUri: visit?.receiptUri ?? null,
  };
}

export function MechanicFormSheet({
  initialVisit,
  onClose,
  onSave,
  onDelete,
}: MechanicFormSheetProps) {
  const theme = useTheme();
  const [draft, setDraft] = useState<MechanicVisitDraft>(() => toDraft(initialVisit));
  const [errors, setErrors] = useState<MechanicFieldErrors>({});
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  function update<K extends keyof MechanicVisitDraft>(field: K, value: MechanicVisitDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function pickReceipt(fromCamera: boolean) {
    if (Platform.OS === 'web') {
      setPhotoError('Receipts are available in the mobile app.');
      return;
    }

    setPicking(true);
    setPhotoError(null);
    try {
      const permission = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setPhotoError(
          fromCamera
            ? 'Camera access is needed to take a receipt photo.'
            : 'Photo access is needed to choose a receipt.'
        );
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (result.canceled) return;

      const asset = result.assets[0];
      if (asset === undefined) return;
      const uri = await copyIntoAppDocuments('receipts', asset.uri, 'receipt', asset.fileName);
      if (uri === null) {
        setPhotoError('Could not store that receipt. Try another image.');
        return;
      }
      update('receiptUri', uri);
    } catch {
      setPhotoError('Could not open the photo picker. Try again.');
    } finally {
      setPicking(false);
    }
  }

  function handleSave() {
    const result = validateMechanicVisitDraft(draft);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onSave(result.value);
  }

  function handleDelete() {
    Alert.alert('Delete this visit?', 'Its maintenance links will be removed too.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  }

  return (
    <BottomSheet onClose={onClose} dismissLabel="Close mechanic visit form">
      <Text style={[Typography.title, { color: theme.text }]}>
        {initialVisit === null ? 'Add visit' : 'Edit visit'}
      </Text>
      <DateField
        label="Date"
        value={draft.date}
        onChange={(value) => update('date', value)}
        error={errors.date}
      />
      <Input
        label="Shop"
        value={draft.shop}
        onChangeText={(value) => update('shop', value)}
        placeholder="Where you took it"
      />
      <Input
        label="Work done"
        value={draft.workDone}
        onChangeText={(value) => update('workDone', value)}
        placeholder="What the mechanic did"
        multiline
      />
      <Input
        label="Parts"
        value={draft.parts}
        onChangeText={(value) => update('parts', value)}
        placeholder="Parts replaced or used"
        multiline
      />
      <Input
        label="Cost"
        value={draft.cost}
        onChangeText={(value) => update('cost', value)}
        placeholder="0.00"
        unit="₱"
        numeric
        error={errors.cost}
      />
      <Input
        label="Odometer"
        value={draft.odometer}
        onChangeText={(value) => update('odometer', value)}
        placeholder="Optional"
        unit="km"
        numeric
        error={errors.odometer}
      />

      <View style={[styles.receiptGroup, { borderTopColor: theme.border }]}>
        <Text style={[Typography.label, { color: theme.textMuted }]}>Receipt</Text>
        {draft.receiptUri !== null ? (
          <Image
            source={{ uri: draft.receiptUri }}
            style={[styles.preview, { borderColor: theme.border }]}
            contentFit="cover"
            accessibilityLabel="Selected receipt photo"
          />
        ) : null}
        <View style={styles.photoActions}>
          <Button
            label="Choose from gallery"
            variant="secondary"
            onPress={() => void pickReceipt(false)}
            loading={picking}
          />
          <Button
            label="Take photo"
            variant="secondary"
            onPress={() => void pickReceipt(true)}
            loading={picking}
          />
        </View>
        {draft.receiptUri !== null ? (
          <Button
            label="Remove receipt"
            variant="ghost"
            onPress={() => update('receiptUri', null)}
          />
        ) : null}
        {photoError !== null ? (
          <Text style={[Typography.body, { color: theme.dangerInk }]}>{photoError}</Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button label="Cancel" onPress={onClose} variant="secondary" />
        <Button
          label={initialVisit === null ? 'Add visit' : 'Save changes'}
          onPress={handleSave}
        />
      </View>

      {initialVisit !== null ? (
        <Button label="Delete visit" onPress={handleDelete} variant="ghost" />
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  receiptGroup: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
  },
  preview: {
    width: '100%',
    height: 160,
    borderRadius: Radius.control,
    borderWidth: 1,
  },
  photoActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});
