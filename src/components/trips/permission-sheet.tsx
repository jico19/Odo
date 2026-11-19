import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PermissionSheetProps = {
  canAskAgain: boolean;
  onAllow: () => void;
  onOpenSettings: () => void;
  onDismiss: () => void;
};

export function PermissionSheet({
  canAskAgain,
  onAllow,
  onOpenSettings,
  onDismiss,
}: PermissionSheetProps) {
  const theme = useTheme();

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onDismiss}
      accessibilityViewIsModal>
      <View style={styles.backdrop}>
        <Pressable
          style={styles.dismissArea}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Close location explanation"
        />
        <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SafeAreaView edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content}>
              <Text style={[Typography.title, { color: theme.text }]}>Location for trips</Text>
              <Text style={[Typography.body, { color: theme.textMuted }]}>
                Odo uses your location only while a trip is recording. It draws the route and
                measures the distance. Your route stays on this device.
              </Text>
              {!canAskAgain ? (
                <Text style={[Typography.body, { color: theme.text }]}>
                  Location access is turned off for Odo. Open Settings to turn it on.
                </Text>
              ) : null}
              <View style={styles.actions}>
                <Button label="Not now" variant="secondary" onPress={onDismiss} />
                {canAskAgain ? (
                  <Button label="Allow location" onPress={onAllow} />
                ) : (
                  <Button label="Open settings" onPress={onOpenSettings} />
                )}
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
