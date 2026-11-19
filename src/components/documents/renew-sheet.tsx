import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, DateField } from '@/components/ui';
import { MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Document } from '@/types/document';
import { DOCUMENT_LABELS } from '@/types/document';
import { isValidDate } from '@/utils/validation';

type RenewSheetProps = {
  document: Document;
  onClose: () => void;
  onRenew: (expiryDate: string) => void;
};

export function RenewSheet({ document, onClose, onRenew }: RenewSheetProps) {
  const theme = useTheme();
  const [expiryDate, setExpiryDate] = useState(document.expiryDate);
  const [error, setError] = useState<string | null>(null);

  function handleRenew() {
    if (!isValidDate(expiryDate)) {
      setError('Enter the new expiry date shown on the document.');
      return;
    }
    onRenew(expiryDate);
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
          accessibilityLabel="Close renewal form"
        />
        <View
          style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SafeAreaView edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content}>
              <Text style={[Typography.title, { color: theme.text }]}>Mark as renewed</Text>
              <Text style={[Typography.body, { color: theme.textMuted }]}>
                {DOCUMENT_LABELS[document.type]}
                {document.name === null ? '' : ` · ${document.name}`}
              </Text>
              <DateField
                label="New expiry date"
                value={expiryDate}
                onChange={(value) => {
                  setExpiryDate(value);
                  setError(null);
                }}
                error={error ?? undefined}
              />
              <Text style={[Typography.body, { color: theme.textMuted }]}>
                The old record stays in History. Reminders move to the new expiry date.
              </Text>
              <View style={styles.actions}>
                <Button label="Cancel" variant="secondary" onPress={onClose} />
                <Button label="Save renewal" onPress={handleRenew} />
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
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});
