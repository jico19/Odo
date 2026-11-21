import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { OnboardingStep } from '@/hooks/use-onboarding';

const LABELS = ['Bike', 'Engine', 'Intervals', 'Alerts'];

export function StepIndicator({ step }: { step: OnboardingStep }) {
  const theme = useTheme();

  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ now: step, min: 1, max: 4 }}>
      <View style={styles.track}>
        {LABELS.map((label, index) => {
          const position = (index + 1) as OnboardingStep;
          const active = position === step;
          const done = position < step;
          return (
            <View key={label} style={styles.segment}>
              <View
                style={[
                  styles.bar,
                  {
                    backgroundColor: active || done ? theme.accent : theme.surfaceAlt,
                    borderColor: active ? theme.accent : theme.border,
                  },
                ]}
              />
              <Text
                style={[
                  Typography.label,
                  styles.label,
                  { color: active ? theme.accentInk : theme.textMuted },
                ]}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={[Typography.label, styles.count, { color: theme.textMuted }]}>
        Step {step} of 4
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  segment: {
    flex: 1,
    gap: Spacing.one,
  },
  bar: {
    height: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  label: {
    fontSize: 10,
  },
  count: {
    marginTop: Spacing.two,
  },
});
