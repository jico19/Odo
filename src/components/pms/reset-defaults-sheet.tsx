import { Text } from 'react-native';

import { BottomSheet, Button } from '@/components/ui';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ResetDefaultsSheetProps = {
  onClose: () => void;
  onReset: (onlyChanged: boolean) => void;
};

export function ResetDefaultsSheet({ onClose, onReset }: ResetDefaultsSheetProps) {
  const theme = useTheme();

  return (
    <BottomSheet onClose={onClose} dismissLabel="Close reset defaults" variant="compact">
      <Text style={[Typography.title, { color: theme.text }]}>Reset intervals</Text>
      <Text style={[Typography.body, { color: theme.textMuted }]}>
        Choose which default items return to the suggested intervals. Custom items and history are
        never changed.
      </Text>
      <Button
        label="Reset changed items only"
        variant="secondary"
        onPress={() => onReset(true)}
      />
      <Button label="Reset all default items" onPress={() => onReset(false)} />
    </BottomSheet>
  );
}
