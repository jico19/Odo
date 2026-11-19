import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, DateField, Input } from '@/components/ui';
import { ControlHeight, MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { localDateKey } from '@/hooks/use-today';
import { useTheme } from '@/hooks/use-theme';
import type { Document, DocumentDraft, NewDocument } from '@/types/document';
import { DOCUMENT_LABELS, DOCUMENT_TYPES } from '@/types/document';
import { copyIntoAppDocuments } from '@/utils/app-files';
import {
  validateDocumentDraft,
  type DocumentFieldErrors,
} from '@/utils/validation';

type SavedDocument = Omit<NewDocument, 'vehicleId' | 'renewedFromId'>;

type DocumentFormSheetProps = {
  initialDocument: Document | null;
  onClose: () => void;
  onSave: (input: SavedDocument) => void;
  onDelete: () => void;
  onRenew: () => void;
};

function toDraft(document: Document | null): DocumentDraft {
  return {
    type: document?.type ?? 'registration',
    name: document?.name ?? '',
    issueDate: document?.issueDate ?? '',
    expiryDate: document?.expiryDate ?? localDateKey(new Date()),
    cost: document?.cost === null || document === null ? '' : String(document.cost),
    notes: document?.notes ?? '',
    photoUri: document?.photoUri ?? null,
  };
}

export function DocumentFormSheet({
  initialDocument,
  onClose,
  onSave,
  onDelete,
  onRenew,
}: DocumentFormSheetProps) {
  const theme = useTheme();
  const [draft, setDraft] = useState<DocumentDraft>(() => toDraft(initialDocument));
  const [errors, setErrors] = useState<DocumentFieldErrors>({});
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  function update<K extends keyof DocumentDraft>(field: K, value: DocumentDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function pickPhoto(fromCamera: boolean) {
    if (Platform.OS === 'web') {
      setPhotoError('Photos are available in the mobile app.');
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
            ? 'Camera access is needed to take a photo.'
            : 'Photo access is needed to choose an image.'
        );
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (result.canceled) return;

      const asset = result.assets[0];
      if (asset === undefined) return;
      const uri = await copyIntoAppDocuments('documents', asset.uri, 'document', asset.fileName);
      if (uri === null) {
        setPhotoError('Could not store that photo. Try another image.');
        return;
      }
      update('photoUri', uri);
    } catch {
      setPhotoError('Could not open the photo picker. Try again.');
    } finally {
      setPicking(false);
    }
  }

  function handleSave() {
    const result = validateDocumentDraft(draft);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onSave(result.value);
  }

  function handleDelete() {
    Alert.alert('Delete this document?', 'Its reminders will be cancelled too.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
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
          accessibilityLabel="Close document form"
        />
        <View
          style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SafeAreaView edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              <Text style={[Typography.title, { color: theme.text }]}>
                {initialDocument === null ? 'Add document' : 'Edit document'}
              </Text>

              <View style={styles.field}>
                <Text style={[Typography.label, { color: theme.textMuted }]}>Type</Text>
                <View style={styles.chips}>
                  {DOCUMENT_TYPES.map((type) => {
                    const selected = draft.type === type;
                    return (
                      <Pressable
                        key={type}
                        onPress={() => update('type', type)}
                        accessibilityRole="button"
                        accessibilityLabel={DOCUMENT_LABELS[type]}
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
                          {DOCUMENT_LABELS[type]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Input
                label="Name or number"
                value={draft.name}
                onChangeText={(value) => update('name', value)}
                placeholder="Optional"
              />
              <DateField
                label="Issue date"
                value={draft.issueDate}
                onChange={(value) => update('issueDate', value)}
                error={errors.issueDate}
                clearable
              />
              <DateField
                label="Expiry date"
                value={draft.expiryDate}
                onChange={(value) => update('expiryDate', value)}
                error={errors.expiryDate}
              />
              <Input
                label="Renewal cost"
                value={draft.cost}
                onChangeText={(value) => update('cost', value)}
                placeholder="0.00"
                unit="₱"
                numeric
                error={errors.cost}
              />
              <Input
                label="Notes"
                value={draft.notes}
                onChangeText={(value) => update('notes', value)}
                placeholder="Optional"
                multiline
              />

              <View style={[styles.photoGroup, { borderTopColor: theme.border }]}>
                <Text style={[Typography.label, { color: theme.textMuted }]}>Photo</Text>
                {draft.photoUri !== null ? (
                  <Image
                    source={{ uri: draft.photoUri }}
                    style={[styles.preview, { borderColor: theme.border }]}
                    contentFit="cover"
                    accessibilityLabel="Selected document photo"
                  />
                ) : null}
                <View style={styles.photoActions}>
                  <Button
                    label="Choose from gallery"
                    variant="secondary"
                    onPress={() => void pickPhoto(false)}
                    loading={picking}
                  />
                  <Button
                    label="Take photo"
                    variant="secondary"
                    onPress={() => void pickPhoto(true)}
                    loading={picking}
                  />
                </View>
                {draft.photoUri !== null ? (
                  <Button label="Remove photo" variant="ghost" onPress={() => update('photoUri', null)} />
                ) : null}
                {photoError !== null ? (
                  <Text style={[Typography.body, { color: theme.dangerInk }]}>{photoError}</Text>
                ) : null}
              </View>

              <View style={styles.actions}>
                <Button label="Cancel" onPress={onClose} variant="secondary" />
                <Button label={initialDocument === null ? 'Add document' : 'Save changes'} onPress={handleSave} />
              </View>

              {initialDocument !== null && !initialDocument.superseded ? (
                <Button label="Mark as renewed" onPress={onRenew} variant="secondary" />
              ) : null}

              {initialDocument !== null ? (
                <Button label="Delete document" onPress={handleDelete} variant="ghost" />
              ) : null}
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
  photoGroup: {
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
