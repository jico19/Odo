import { Text, View } from 'react-native';

import { BottomSheet, Button } from '@/components/ui';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PmsItem, PmsTemplateItem } from '@/types/pms';

type TransmissionDiffSheetProps = {
  toAdd: PmsTemplateItem[];
  toEnable: PmsItem[];
  toDisable: PmsItem[];
  onClose: () => void;
  onApply: () => void;
};

export function TransmissionDiffSheet({
  toAdd,
  toEnable,
  toDisable,
  onClose,
  onApply,
}: TransmissionDiffSheetProps) {
  const theme = useTheme();

  return (
    <BottomSheet onClose={onClose} dismissLabel="Close checklist update" variant="compact">
      <Text style={[Typography.title, { color: theme.text }]}>Update PMS checklist?</Text>
      <View style={{ gap: Spacing.two }}>
        <Text style={[Typography.body, { color: theme.textMuted }]}>
          Your saved intervals and service history stay as they are.
        </Text>
        {toAdd.length > 0 ? (
          <Text style={[Typography.body, { color: theme.text }]}>
            Add: {toAdd.map((item) => item.label).join(', ')}
          </Text>
        ) : null}
        {toEnable.length > 0 ? (
          <Text style={[Typography.body, { color: theme.text }]}>
            Re-enable: {toEnable.map((item) => item.label).join(', ')}
          </Text>
        ) : null}
        {toDisable.length > 0 ? (
          <Text style={[Typography.body, { color: theme.text }]}>
            Disable: {toDisable.map((item) => item.label).join(', ')}
          </Text>
        ) : null}
      </View>
      <Button label="Keep my checklist" variant="secondary" onPress={onClose} />
      <Button label="Update checklist" onPress={onApply} />
    </BottomSheet>
  );
}
