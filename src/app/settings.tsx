import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo, useState } from 'react';

import { AppHeader } from '@/components/app-header';
import { EditPmsItemSheet } from '@/components/pms/edit-pms-item-sheet';
import { ResetDefaultsSheet } from '@/components/pms/reset-defaults-sheet';
import { TransmissionDiffSheet } from '@/components/pms/transmission-diff-sheet';
import { MotorcycleSheet } from '@/components/settings/motorcycle-sheet';
import { PmsItemRow } from '@/components/settings/pms-item-row';
import { SettingsOptions, SettingsRow, SettingsSection } from '@/components/settings/settings-ui';
import { Button, EmptyState, SkeletonLine } from '@/components/ui';
import { MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { usePmsItems } from '@/hooks/use-pms-items';
import { usePreferences } from '@/hooks/use-preferences';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';
import { useVehicle } from '@/hooks/use-vehicle';
import type { NewPmsItem, PmsItem, PmsItemUpdate, TransmissionType } from '@/types/pms';
import { TRANSMISSION_LABELS } from '@/types/pms';
import type { AppearanceMode, DistanceUnit, ReminderLeadDays } from '@/types/preferences';
import {
  diffTemplate,
  getTemplateItems,
  newCustomPmsType,
  newItemsFromTemplate,
} from '@/utils/pms';
import { PMS_LEAD_OPTIONS } from '@/utils/notifications';

const DISTANCE_OPTIONS: readonly { value: DistanceUnit; label: string }[] = [
  { value: 'km', label: 'Kilometers' },
  { value: 'mi', label: 'Miles' },
];

const CURRENCY_OPTIONS = [
  { value: 'PHP', label: 'PHP ₱' },
  { value: 'USD', label: 'USD $' },
  { value: 'EUR', label: 'EUR €' },
  { value: 'GBP', label: 'GBP £' },
  { value: 'JPY', label: 'JPY ¥' },
] as const;

const APPEARANCE_OPTIONS: readonly { value: AppearanceMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const REMINDER_OPTIONS = PMS_LEAD_OPTIONS.map((value) => ({
  value,
  label: `${value} day${value === 1 ? '' : 's'} before`,
}));

export default function SettingsScreen() {
  const theme = useTheme();
  const today = useToday();
  const {
    status: vehicleStatus,
    vehicle,
    error: vehicleError,
    retry: retryVehicle,
    update,
  } = useVehicle();
  const pms = usePmsItems(vehicle?.id ?? 0);
  const prefs = usePreferences();
  const params = useLocalSearchParams<{ section?: string }>();
  const [motorcycleOpenLocal, setMotorcycleOpenLocal] = useState(false);
  const [dismissedSection, setDismissedSection] = useState<string | null>(null);
  const [diff, setDiff] = useState<ReturnType<typeof diffTemplate> | null>(null);
  const [editingItem, setEditingItem] = useState<PmsItem | null>(null);
  const [customDraft, setCustomDraft] = useState<NewPmsItem | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const motorcycleOpen =
    motorcycleOpenLocal ||
    (params.section === 'motorcycle' && dismissedSection !== params.section);

  const enabledCount = useMemo(() => pms.items.filter((item) => item.enabled).length, [pms.items]);

  if (vehicleStatus === 'loading' || pms.status === 'loading' || prefs.status === 'loading') {
    return <SettingsSkeleton />;
  }
  if (vehicleStatus === 'error' || pms.status === 'error' || prefs.status === 'error') {
    return (
      <SettingsError
        message={vehicleError ?? pms.error ?? prefs.error ?? 'Could not load settings.'}
        onRetry={() => {
          retryVehicle();
          pms.retry();
          prefs.retry();
        }}
      />
    );
  }
  if (vehicle === null) return null;

  function openMotorcycle() {
    setMotorcycleOpenLocal(true);
  }

  function closeMotorcycle() {
    setMotorcycleOpenLocal(false);
    if (params.section === 'motorcycle') setDismissedSection(params.section);
  }

  function reportError(cause: unknown, fallback: string) {
    setError(cause instanceof Error ? cause.message : fallback);
  }

  function runAction(action: () => void, fallback: string) {
    try {
      action();
    } catch (cause: unknown) {
      reportError(cause, fallback);
    }
  }

  function handleSaveMotorcycle(input: {
    name: string;
    plate: string | null;
    transmissionType: TransmissionType;
    isLiquidCooled: boolean;
  }) {
    const drivetrainChanged =
      vehicle!.transmissionType !== input.transmissionType ||
      vehicle!.isLiquidCooled !== input.isLiquidCooled;

    closeMotorcycle();
    runAction(() => {
      update(vehicle!.id, input);
      if (!drivetrainChanged) return;

      const templates = getTemplateItems(input.transmissionType, input.isLiquidCooled);
      const changes = diffTemplate(pms.items, templates);
      if (
        changes.toAdd.length > 0 ||
        changes.toEnable.length > 0 ||
        changes.toDisable.length > 0
      ) {
        setDiff(changes);
      }
    }, 'Could not save the motorcycle.');
  }

  function handleApplyDiff() {
    const current = diff;
    setDiff(null);
    if (current === null) return;

    runAction(() => {
      if (current.toAdd.length > 0) {
        pms.addFromTemplate(newItemsFromTemplate(current.toAdd, vehicle!.odometer, today));
      }
      for (const item of current.toEnable) pms.setEnabled(item.id, true);
      for (const item of current.toDisable) pms.setEnabled(item.id, false);
    }, 'Could not apply checklist changes.');
  }

  function handleSaveItem(value: PmsItemUpdate) {
    runAction(() => {
      if (editingItem !== null) pms.update(editingItem.id, value);
      else if (customDraft !== null) pms.create({ ...customDraft, ...value });
      setEditingItem(null);
      setCustomDraft(null);
    }, 'Could not save this item.');
  }

  function handleToggleItem(item: PmsItem, enabled: boolean) {
    runAction(() => {
      pms.setEnabled(item.id, enabled);
    }, 'Could not update this item.');
  }

  function openCustomDraft() {
    setCustomDraft({
      type: newCustomPmsType(),
      label: '',
      intervalKm: 3000,
      intervalDays: 180,
      defaultIntervalKm: null,
      defaultIntervalDays: null,
      enabled: true,
      isCustom: true,
      lastDoneOdometer: null,
      lastDoneDate: null,
      startedOdometer: vehicle!.odometer,
      startedDate: today,
    });
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <AppHeader
        title="Settings"
        vehicleName={vehicle.name}
        odometer={vehicle.odometer}
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {error !== null ? (
          <View style={[styles.error, { backgroundColor: theme.dangerSoft }]}>
            <Text style={[Typography.body, { color: theme.dangerInk }]}>{error}</Text>
            <Button label="Dismiss" variant="ghost" onPress={() => setError(null)} />
          </View>
        ) : null}

        <SettingsSection title="My motorcycle">
          <SettingsRow
            icon="bicycle-outline"
            title={vehicle.name}
            subtitle={vehicle.plate ?? 'No plate added'}
            value={vehicle.transmissionType === null ? 'Not set' : TRANSMISSION_LABELS[vehicle.transmissionType]}
            onPress={() => openMotorcycle()}
          />
          <SettingsRow
            icon="speedometer-outline"
            title="Current odometer"
            subtitle="Updated when you log fuel, service or a trip"
            value={`${vehicle.odometer.toLocaleString()} km`}
            last
          />
        </SettingsSection>

        <SettingsSection title="PMS schedule">
          {pms.items.length === 0 ? (
            <EmptyState
              icon="clipboard-outline"
              message="No service checklist yet. Edit your motorcycle to build one."
              actionLabel="Edit motorcycle"
              onAction={() => openMotorcycle()}
            />
          ) : (
            pms.items.map((item, index) => (
              <PmsItemRow
                key={item.id}
                item={item}
                distanceUnit={prefs.preferences.distanceUnit}
                last={index === pms.items.length - 1}
                onEdit={() => setEditingItem(item)}
                onReset={() => runAction(() => pms.resetOne(item.id), 'Could not reset this item.')}
                onToggle={(enabled) => handleToggleItem(item, enabled)}
              />
            ))
          )}
          <View style={[styles.pmsActions, { borderTopColor: theme.border }]}>
            <Button label="Add custom item" variant="secondary" onPress={openCustomDraft} />
            <Button label="Reset intervals" variant="ghost" onPress={() => setResetOpen(true)} />
            <Text style={[styles.hint, { color: theme.textMuted }]}>
              {enabledCount} of {pms.items.length} items active. Disabled items have no reminders.
            </Text>
          </View>
        </SettingsSection>

        <SettingsSection title="Reminders">
          <View style={styles.optionBlock}>
            <Text style={[Typography.body, styles.optionTitle, { color: theme.text }]}>
              Service reminder lead time
            </Text>
            <Text style={[Typography.body, styles.hint, { color: theme.textMuted }]}>
              A reminder is also sent on the due date. Dated items only.
            </Text>
            <SettingsOptions
              options={REMINDER_OPTIONS}
              value={prefs.preferences.reminderLeadDays}
              onChange={(value: ReminderLeadDays) =>
                runAction(() => prefs.update('reminderLeadDays', value), 'Could not save this preference.')
              }
            />
          </View>
        </SettingsSection>

        <SettingsSection title="Units and currency">
          <View style={styles.optionBlock}>
            <Text style={[Typography.body, styles.optionTitle, { color: theme.text }]}>Distance</Text>
            <Text style={[Typography.body, styles.hint, { color: theme.textMuted }]}>
              Display only — readings are stored in kilometers.
            </Text>
            <SettingsOptions
              options={DISTANCE_OPTIONS}
              value={prefs.preferences.distanceUnit}
              onChange={(value) =>
                runAction(() => prefs.update('distanceUnit', value), 'Could not save this preference.')
              }
            />
          </View>
          <View style={[styles.optionBlock, { borderTopColor: theme.border }]}>
            <Text style={[Typography.body, styles.optionTitle, { color: theme.text }]}>Currency</Text>
            <SettingsOptions
              options={CURRENCY_OPTIONS}
              value={prefs.preferences.currency}
              onChange={(value) =>
                runAction(() => prefs.update('currency', value), 'Could not save this preference.')
              }
            />
          </View>
        </SettingsSection>

        <SettingsSection title="Appearance">
          <View style={styles.optionBlock}>
            <SettingsOptions
              options={APPEARANCE_OPTIONS}
              value={prefs.preferences.appearance}
              onChange={(value) =>
                runAction(() => prefs.update('appearance', value), 'Could not save this preference.')
              }
            />
          </View>
        </SettingsSection>

        <SettingsSection title="Data">
          <SettingsRow
            icon="download-outline"
            title="Export (coming soon)"
            subtitle="Back up your data to a file"
            right={<Text style={[Typography.label, { color: theme.textMuted }]}>SOON</Text>}
            last
          />
        </SettingsSection>

        <SettingsSection title="About and privacy">
          <SettingsRow
            icon="shield-checkmark-outline"
            title="Offline and private"
            subtitle="No account, no cloud, no analytics. Your data and location stay on this device."
          />
          <SettingsRow
            icon="information-circle-outline"
            title="Odo"
            subtitle="Personal vehicle maintenance tracker"
            last
          />
        </SettingsSection>
      </ScrollView>

      {motorcycleOpen ? (
        <MotorcycleSheet vehicle={vehicle} onClose={() => closeMotorcycle()} onSave={handleSaveMotorcycle} />
      ) : null}

      {diff !== null ? (
        <TransmissionDiffSheet
          toAdd={diff.toAdd}
          toEnable={diff.toEnable}
          toDisable={diff.toDisable}
          onClose={() => setDiff(null)}
          onApply={handleApplyDiff}
        />
      ) : null}

      {editingItem !== null ? (
        <EditPmsItemSheet
          item={editingItem}
          distanceUnit={prefs.preferences.distanceUnit}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveItem}
          onReset={() => {
            runAction(() => pms.resetOne(editingItem.id), 'Could not reset this item.');
            setEditingItem(null);
          }}
        />
      ) : null}

      {customDraft !== null ? (
        <EditPmsItemSheet
          item={customDraft}
          distanceUnit={prefs.preferences.distanceUnit}
          hint="Add a service you want to track for this bike."
          onClose={() => setCustomDraft(null)}
          onSave={handleSaveItem}
        />
      ) : null}

      {resetOpen ? (
        <ResetDefaultsSheet
          onClose={() => setResetOpen(false)}
          onReset={(onlyChanged) => {
            runAction(() => pms.resetAll(onlyChanged), 'Could not reset intervals.');
            setResetOpen(false);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function SettingsError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <AppHeader title="Settings" vehicleName="" odometer={0} subtitle="Personal settings" />
      <View style={styles.centered}>
        <Text style={[Typography.title, { color: theme.text }]}>Could not load settings</Text>
        <Text style={[Typography.body, styles.message, { color: theme.textMuted }]}>{message}</Text>
        <Button label="Try again" onPress={onRetry} />
      </View>
    </SafeAreaView>
  );
}

function SettingsSkeleton() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.content}>
        <SkeletonLine width="40%" />
        <SkeletonLine />
        <SkeletonLine />
        <SkeletonLine />
      </View>
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
    gap: Spacing.three,
  },
  error: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  message: {
    textAlign: 'center',
  },
  pmsActions: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderTopWidth: 1,
  },
  optionBlock: {
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.half,
  },
  optionTitle: {
    fontWeight: '600',
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
  },
});
