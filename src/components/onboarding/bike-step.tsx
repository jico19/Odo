import { StyleSheet, Text, View } from 'react-native';

import { Input } from '@/components/ui';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { VehicleDraft } from '@/types/vehicle';
import type { OnboardingErrors } from '@/hooks/use-onboarding';

type BikeStepProps = {
  draft: VehicleDraft;
  errors: OnboardingErrors;
  onUpdate: (field: keyof VehicleDraft, value: string) => void;
};

export function BikeStep({ draft, errors, onUpdate }: BikeStepProps) {
  const theme = useTheme();

  return (
    <View style={styles.content}>
      <Text style={[Typography.title, { color: theme.text }]}>Set up your bike</Text>
      <Text style={[Typography.body, styles.subtitle, { color: theme.textMuted }]}>
        We use the odometer as the starting point for every service interval. You can change it any
        time from the Dashboard.
      </Text>
      <View style={styles.form}>
        <Input
          label="Name"
          value={draft.name}
          onChangeText={(value) => onUpdate('name', value)}
          placeholder="e.g. Ninja 400"
          error={errors.name}
          autoFocus
        />
        <Input
          label="Plate (optional)"
          value={draft.plate}
          onChangeText={(value) => onUpdate('plate', value)}
          placeholder="e.g. AB 1234"
          error={errors.plate}
        />
        <Input
          label="Starting odometer"
          value={draft.odometer}
          onChangeText={(value) => onUpdate('odometer', value)}
          placeholder="0"
          unit="km"
          numeric
          error={errors.odometer}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.two,
  },
  subtitle: {
    marginBottom: Spacing.two,
  },
  form: {
    gap: Spacing.three,
  },
});
