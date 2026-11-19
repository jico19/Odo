import { Redirect } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { FloatingActionButton } from '@/components/floating-action-button';
import { FuelEfficiencyCard } from '@/components/fuel/fuel-efficiency-card';
import { FuelFormSheet } from '@/components/fuel/fuel-form-sheet';
import { FuelSpendCard } from '@/components/fuel/fuel-spend-card';
import { Button, EmptyState, ListRow } from '@/components/ui';
import { MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useFuelLogs } from '@/hooks/use-fuel-logs';
import { useTheme } from '@/hooks/use-theme';
import { useVehicle } from '@/hooks/use-vehicle';
import type { FuelLog, NewFuelLog } from '@/types/fuel';
import { calculateFuelStats, getFuelLogCost } from '@/utils/calculations';
import { formatCurrency, formatDateShort, formatNumber, formatOdometer } from '@/utils/format';

type Editor = FuelLog | 'new' | null;

export default function FuelScreen() {
  const theme = useTheme();
  const { status: vehicleStatus, vehicle } = useVehicle();
  const { status, logs, error, retry, create, update } = useFuelLogs(vehicle?.id ?? 0);
  const [editor, setEditor] = useState<Editor>(null);
  const stats = useMemo(() => calculateFuelStats(logs), [logs]);
  const insets = useSafeAreaInsets();
  const fabBottom = Platform.OS === 'web' ? Spacing.six + Spacing.two : insets.bottom + Spacing.two;
  const scrollPadding = fabBottom + Spacing.six + Spacing.three;

  if (vehicleStatus === 'loading' || status === 'loading') return <FuelSkeleton />;
  if (vehicle === null) return <Redirect href="/onboarding" />;

  function handleSave(input: NewFuelLog) {
    if (editor === null) return;
    if (editor === 'new') create(input);
    else update(editor.id, input);
    setEditor(null);
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.centered}>
          <Text style={[Typography.title, { color: theme.text }]}>Could not load fuel logs</Text>
          <Text style={[Typography.body, styles.message, { color: theme.textMuted }]}>{error}</Text>
          <Button label="Try again" onPress={retry} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <Text style={[Typography.title, { color: theme.text }]}>Fuel</Text>

        <FuelEfficiencyCard average={stats.averageKmPerLiter} series={stats.kmPerLiterSeries} />
        <FuelSpendCard monthlySpend={stats.monthlySpend} series={stats.monthlySpendSeries} />

        <Text style={[Typography.label, styles.sectionTitle, { color: theme.textMuted }]}>
          History
        </Text>
        {logs.length === 0 ? (
          <EmptyState
            icon="water-outline"
            message="No fuel logs yet."
            actionLabel="Log your first fill-up"
            onAction={() => setEditor('new')}
          />
        ) : (
          <View>
            {logs.map((log, index) => (
              <ListRow
                key={log.id}
                icon="water-outline"
                title={`${formatNumber(log.liters, 1)} L · ${log.fullTank ? 'Full' : 'Partial'}`}
                subtitle={`${formatOdometer(log.odometer ?? 0)} km · ${formatNumber(log.pricePerLiter ?? 0, 2)} ₱/L`}
                value={formatCurrency(getFuelLogCost(log))}
                date={formatDateShort(log.date)}
                onPress={() => setEditor(log)}
                divider={index < logs.length - 1}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <FloatingActionButton bottom={fabBottom} label="Add fuel log" onPress={() => setEditor('new')} />

      {editor !== null ? (
        <FuelFormSheet
          initialLog={editor === 'new' ? null : editor}
          onClose={() => setEditor(null)}
          onSave={handleSave}
        />
      ) : null}
    </SafeAreaView>
  );
}

function FuelSkeleton() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.content}>
        <View style={[styles.skeletonLine, { backgroundColor: theme.surfaceAlt }]} />
        <View style={[styles.skeletonCard, { backgroundColor: theme.surfaceAlt }]} />
        <View style={[styles.skeletonCard, { backgroundColor: theme.surfaceAlt }]} />
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
    gap: Spacing.three,
  },
  sectionTitle: {
    marginTop: Spacing.two,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  message: {
    textAlign: 'center',
  },
  skeletonLine: {
    width: '40%',
    height: 20,
    borderRadius: Radius.control,
  },
  skeletonCard: {
    height: 200,
    borderRadius: Radius.card,
  },
});
