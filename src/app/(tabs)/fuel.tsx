import { Redirect } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { FloatingActionButton } from '@/components/floating-action-button';
import { FilterChips, type FuelFilter } from '@/components/fuel/filter-chips';
import { FuelFormSheet } from '@/components/fuel/fuel-form-sheet';
import { FuelHeroCard } from '@/components/fuel/fuel-hero-card';
import { FuelLogCard } from '@/components/fuel/fuel-log-card';
import { QuickEntryDrawer } from '@/components/fuel/quick-entry-drawer';
import { Button, EmptyState, SkeletonCard, SkeletonLine } from '@/components/ui';
import { MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useFuelLogs } from '@/hooks/use-fuel-logs';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';
import { useVehicle } from '@/hooks/use-vehicle';
import type { FuelLog, NewFuelLog } from '@/types/fuel';
import {
  calculateFuelStats,
  getEfficiencyTrendPercent,
  getFuelLogCost,
  getLogEfficiencies,
  roundTo,
} from '@/utils/calculations';

export default function FuelScreen() {
  const theme = useTheme();
  const { status: vehicleStatus, vehicle } = useVehicle();
  const { status, logs, error, retry, create, update, remove } = useFuelLogs(vehicle?.id ?? 0);
  const [editor, setEditor] = useState<FuelLog | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [filter, setFilter] = useState<FuelFilter>('all');
  const today = useToday();
  const insets = useSafeAreaInsets();
  const fabBottom = Platform.OS === 'web' ? Spacing.six + Spacing.two : insets.bottom + Spacing.two;
  const scrollPadding = fabBottom + Spacing.six + Spacing.three;

  const stats = useMemo(() => calculateFuelStats(logs), [logs]);
  const trend = useMemo(() => getEfficiencyTrendPercent(stats, today), [stats, today]);
  const fullTankCount = useMemo(() => logs.filter((log) => log.fullTank).length, [logs]);
  const efficiencies = useMemo(() => getLogEfficiencies(stats, logs), [stats, logs]);
  const monthlyLiters = useMemo(
    () =>
      logs
        .filter((log) => log.date.slice(0, 7) === today.slice(0, 7))
        .reduce((sum, log) => sum + log.liters, 0),
    [logs, today]
  );
  const filteredLogs = useMemo(
    () => (filter === 'all' ? logs : logs.filter((log) => log.fullTank === (filter === 'full'))),
    [logs, filter]
  );
  const trough = useMemo(
    () => ({
      lastFillCost: logs[0] === undefined ? null : getFuelLogCost(logs[0]),
      lastFillLiters: logs[0]?.liters ?? null,
      costPerKm: stats.costPerKm,
      monthlySpend: stats.monthlySpend,
      monthlyLiters: roundTo(monthlyLiters, 1),
    }),
    [logs, stats.costPerKm, stats.monthlySpend, monthlyLiters]
  );

  if (vehicleStatus === 'loading' || status === 'loading') return <FuelSkeleton />;
  if (vehicle === null) return <Redirect href="/onboarding" />;

  function handleSave(input: NewFuelLog) {
    if (editor === null) return;
    update(editor.id, input);
    setEditor(null);
  }

  function handleDelete() {
    if (editor === null) return;
    try {
      remove(editor.id);
      setEditor(null);
    } catch {
      Alert.alert('Could not delete the fuel log. Try again.');
    }
  }

  function handleQuickSave(input: NewFuelLog) {
    create(input);
    setQuickOpen(false);
    setFilter('all');
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
        <AppHeader title="Fuel Log" vehicleName={vehicle.name} odometer={vehicle.odometer} />
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
      <AppHeader title="Fuel Log" vehicleName={vehicle.name} odometer={vehicle.odometer} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <FuelHeroCard
          average={stats.averageKmPerLiter}
          series={stats.kmPerLiterSeries}
          trend={trend}
          fullTankCount={fullTankCount}
          trough={trough}
        />

        <FilterChips value={filter} onChange={setFilter} totalCount={logs.length} />

        <View style={styles.feedHeader}>
          <Text style={[Typography.label, { color: theme.textMuted }]}>Telemetric Log Feed</Text>
          <Text style={[Typography.label, styles.sort, { color: theme.textMuted }]}>SORT: NEWEST</Text>
        </View>

        {logs.length === 0 ? (
          <EmptyState
            icon="car-sport-outline"
            message="Tap + to log your first fuel fill-up."
          />
        ) : filteredLogs.length === 0 ? (
          <Text style={[Typography.body, styles.noMatches, { color: theme.textMuted }]}>
            No {filter === 'full' ? 'full-tank' : 'partial'} fills yet.
          </Text>
        ) : (
          <View style={styles.feed}>
            {filteredLogs.map((log) => (
              <FuelLogCard
                key={log.id}
                log={log}
                efficiency={efficiencies.get(log.id) ?? null}
                onPress={() => setEditor(log)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <FloatingActionButton bottom={fabBottom} label="Add fuel log" onPress={() => setQuickOpen(true)} />

      {quickOpen ? (
        <QuickEntryDrawer
          defaultOdometer={vehicle.odometer}
          onClose={() => setQuickOpen(false)}
          onSave={handleQuickSave}
        />
      ) : null}

      {editor !== null ? (
        <FuelFormSheet
          initialLog={editor}
          onClose={() => setEditor(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      ) : null}
    </SafeAreaView>
  );
}

function FuelSkeleton() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.skeletonHeader}>
        <SkeletonLine />
      </View>
      <View style={styles.content}>
        <SkeletonCard height={260} />
        <View style={[styles.skeletonChip, { backgroundColor: theme.surfaceAlt }]} />
        <View style={[styles.skeletonRow, { backgroundColor: theme.surfaceAlt }]} />
        <View style={[styles.skeletonRow, { backgroundColor: theme.surfaceAlt }]} />
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
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginTop: Spacing.half,
  },
  sort: {
    fontSize: 10,
    letterSpacing: 0.4,
  },
  feed: {
    gap: Spacing.two,
  },
  noMatches: {
    textAlign: 'center',
    paddingVertical: Spacing.four,
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
  skeletonHeader: {
    height: 64,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  skeletonChip: {
    width: '55%',
    height: 44,
    borderRadius: Radius.pill,
  },
  skeletonRow: {
    height: 96,
    borderRadius: Radius.card,
  },
});
