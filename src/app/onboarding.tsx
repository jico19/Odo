import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Input } from '@/components/ui';
import { MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useVehicle } from '@/hooks/use-vehicle';
import type { VehicleDraft } from '@/types/vehicle';
import { validateVehicleDraft, type VehicleFieldErrors } from '@/utils/validation';

const EMPTY_DRAFT: VehicleDraft = { name: '', plate: '', odometer: '' };

export default function OnboardingScreen() {
  const theme = useTheme();
  const { status, vehicle, create } = useVehicle();
  const [draft, setDraft] = useState<VehicleDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<VehicleFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (status === 'loading') return null;
  if (vehicle !== null) return <Redirect href="/dashboard" />;

  function update(field: keyof VehicleDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  }

  function handleSubmit() {
    const result = validateVehicleDraft(draft);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setSaving(true);
    try {
      create(result.value);
      router.replace('/dashboard');
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : 'Could not save your bike.');
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name="bicycle-outline" size={32} color={theme.accentInk} accessible={false} />
        </View>

        <Text style={[Typography.title, styles.title, { color: theme.text }]}>Set up your bike</Text>
        <Text style={[Typography.body, styles.subtitle, { color: theme.textMuted }]}>
          Add a name and your current odometer reading. You can log fuel and service after this.
        </Text>

        <View style={styles.form}>
          <Input
            label="Name"
            value={draft.name}
            onChangeText={(value) => update('name', value)}
            placeholder="e.g. Ninja 400"
            error={errors.name}
            autoFocus
          />
          <Input
            label="Plate (optional)"
            value={draft.plate}
            onChangeText={(value) => update('plate', value)}
            placeholder="e.g. AB 1234"
            error={errors.plate}
          />
          <Input
            label="Starting odometer"
            value={draft.odometer}
            onChangeText={(value) => update('odometer', value)}
            placeholder="0"
            unit="km"
            numeric
            error={errors.odometer}
          />
        </View>

        {formError !== null ? (
          <Text style={[Typography.body, styles.formError, { color: theme.dangerInk }]}>
            {formError}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Button label="Save bike" onPress={handleSubmit} loading={saving} fullWidth />
        </View>
      </ScrollView>
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
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  title: {
    marginBottom: Spacing.two,
  },
  subtitle: {
    marginBottom: Spacing.four,
  },
  form: {
    gap: Spacing.three,
  },
  formError: {
    marginTop: Spacing.three,
  },
  actions: {
    marginTop: Spacing.four,
  },
});
