import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet, Button, DateField } from '@/components/ui';
import { Spacing, Typography } from '@/constants/theme';
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
    <BottomSheet onClose={onClose} dismissLabel="Close renewal form">
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
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});
