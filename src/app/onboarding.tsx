import { router, Redirect } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BikeStep } from '@/components/onboarding/bike-step';
import { DrivetrainStep } from '@/components/onboarding/drivetrain-step';
import { PmsStep } from '@/components/onboarding/pms-step';
import { RemindersStep } from '@/components/onboarding/reminders-step';
import { StepIndicator } from '@/components/onboarding/step-indicator';
import { EditPmsItemSheet } from '@/components/pms/edit-pms-item-sheet';
import { Button } from '@/components/ui';
import { MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useTheme } from '@/hooks/use-theme';
import type { VehicleDraft } from '@/types/vehicle';

export default function OnboardingScreen() {
  const theme = useTheme();
  const flow = useOnboarding();
  const editingItem = flow.editingItem;

  if (flow.status === 'loading') return null;
  if (flow.vehicle !== null) return <Redirect href="/dashboard" />;

  function updateDraft(field: keyof VehicleDraft, value: string) {
    flow.updateDraft(field, value);
    if (field === 'odometer') flow.syncBaseline(value);
  }

  async function handleFinish() {
    const completed = await flow.finish();
    if (completed) router.replace('/dashboard');
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <StepIndicator step={flow.step} />

        <View style={styles.step}>
          {flow.step === 1 ? (
            <BikeStep draft={flow.draft} errors={flow.errors} onUpdate={updateDraft} />
          ) : null}
          {flow.step === 2 ? (
            <DrivetrainStep
              transmission={flow.transmission}
              isLiquidCooled={flow.isLiquidCooled}
              error={flow.errors.transmission}
              onTransmission={flow.setTransmission}
              onLiquidCooled={flow.setLiquidCooled}
            />
          ) : null}
          {flow.step === 3 ? (
            <PmsStep
              items={flow.items}
              error={flow.errors.pms}
              onEdit={flow.openItemEditor}
              onAdd={flow.addCustomItem}
              onRemove={flow.removeItem}
            />
          ) : null}
          {flow.step === 4 ? <RemindersStep /> : null}
        </View>

        {flow.formError !== null ? (
          <Text style={[Typography.body, styles.formError, { color: theme.dangerInk }]}>
            {flow.formError}
          </Text>
        ) : null}

        <View style={styles.actions}>
          {flow.step > 1 ? (
            <View style={styles.button}>
              <Button label="Back" variant="secondary" onPress={flow.back} fullWidth />
            </View>
          ) : null}
          <View style={styles.button}>
            {flow.step < 4 ? (
              <Button label="Continue" onPress={flow.next} fullWidth />
            ) : (
              <Button
                label="Go to Dashboard"
                onPress={() => void handleFinish()}
                loading={flow.saving}
                fullWidth
              />
            )}
          </View>
        </View>
      </ScrollView>

      {editingItem !== null ? (
        <EditPmsItemSheet
          item={editingItem}
          onClose={flow.closeItemEditor}
          onSave={flow.saveItem}
          onReset={() => flow.resetItem(editingItem.type)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
  },
  step: {
    marginTop: Spacing.four,
  },
  formError: {
    marginTop: Spacing.three,
  },
  actions: {
    marginTop: Spacing.five,
    gap: Spacing.two,
  },
  button: {
    width: '100%',
  },
});
