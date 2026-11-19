import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NextExpiringCard } from '@/components/documents/next-expiring-card';
import { FuelEfficiencyCard } from '@/components/fuel/fuel-efficiency-card';
import { FuelSpendCard } from '@/components/fuel/fuel-spend-card';
import { LastFuelUpCard } from '@/components/fuel/last-fuel-up-card';
import { MaintenanceRow } from '@/components/maintenance/maintenance-row';
import { LastMechanicVisitCard } from '@/components/mechanic/last-mechanic-visit-card';
import { UpdateOdometerSheet } from '@/components/update-odometer-sheet';
import { Button, StatCard } from '@/components/ui';
import { BottomTabInset, MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useDocuments } from '@/hooks/use-documents';
import { useFuelLogs } from '@/hooks/use-fuel-logs';
import { useMaintenanceLogs } from '@/hooks/use-maintenance';
import { useMechanicVisits } from '@/hooks/use-mechanic-visits';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';
import { useVehicle } from '@/hooks/use-vehicle';
import {
  calculateFuelStats,
  getDueInfo,
  getMaintenanceProgress,
  getUpcoming,
} from '@/utils/calculations';
import { formatOdometer } from '@/utils/format';

export default function DashboardScreen() {
  const theme = useTheme();
  const { status, vehicle, updateOdometer } = useVehicle();
  const {
    status: fuelStatus,
    logs,
    error: fuelError,
    retry: retryFuel,
  } = useFuelLogs(vehicle?.id ?? 0);
  const {
    status: maintenanceStatus,
    logs: maintenanceLogs,
    error: maintenanceError,
    retry: retryMaintenance,
  } = useMaintenanceLogs(vehicle?.id ?? 0);
  const { status: documentStatus, documents } = useDocuments();
  const {
    status: mechanicStatus,
    visits: mechanicVisits,
    error: mechanicError,
    retry: retryMechanic,
  } = useMechanicVisits(vehicle?.id ?? 0);
  const today = useToday();
  const [sheetVisible, setSheetVisible] = useState(false);
  const stats = useMemo(() => calculateFuelStats(logs), [logs]);
  const upcoming = useMemo(
    () => getUpcoming(maintenanceLogs, vehicle?.odometer ?? 0, today),
    [maintenanceLogs, vehicle?.odometer, today]
  );
  const nextDocument = useMemo(() => {
    const active = documents.filter((document) => !document.superseded);
    return active.reduce<typeof active[number] | null>(
      (soonest, document) =>
        soonest === null || document.expiryDate < soonest.expiryDate ? document : soonest,
      null
    );
  }, [documents]);

  if (
    status === 'loading' ||
    fuelStatus === 'loading' ||
    maintenanceStatus === 'loading' ||
    documentStatus === 'loading' ||
    mechanicStatus === 'loading'
  ) {
    return <DashboardSkeleton />;
  }
  if (vehicle === null) return <Redirect href="/onboarding" />;

  const nextService = upcoming[0] ?? null;
  const nextDue = nextService === null ? null : getDueInfo(nextService, vehicle.odometer, today);
  const nextProgress =
    nextService === null ? null : getMaintenanceProgress(nextService, vehicle.odometer, today);
  const nextValue =
    nextDue === null ? 'None' : formatOdometer(Math.max(nextDue.kmLeft ?? nextDue.daysLeft ?? 0, 0));
  const nextUnit = nextDue === null ? undefined : nextDue.kmLeft === null ? 'days' : 'km';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[Typography.label, { color: theme.textMuted }]}>Current bike</Text>
          <Text style={[Typography.title, { color: theme.text }]}>{vehicle.name}</Text>
          <Text style={[Typography.body, { color: theme.textMuted }]}>
            {vehicle.plate ?? 'No plate added'}
          </Text>
        </View>

        <StatCard
          hero
          label="Odometer"
          value={formatOdometer(vehicle.odometer)}
          unit="km"
          accessibilityLabel={`Odometer ${formatOdometer(vehicle.odometer)} kilometers`}
          action={{ label: 'Update', onPress: () => setSheetVisible(true) }}
        />

        {fuelError !== null ? (
          <View style={styles.errorRow}>
            <Text style={[Typography.body, { color: theme.dangerInk }]}>{fuelError}</Text>
            <Button label="Retry" variant="ghost" onPress={retryFuel} />
          </View>
        ) : null}
        {maintenanceError !== null ? (
          <View style={styles.errorRow}>
            <Text style={[Typography.body, { color: theme.dangerInk }]}>{maintenanceError}</Text>
            <Button label="Retry" variant="ghost" onPress={retryMaintenance} />
          </View>
        ) : null}
        {mechanicError !== null ? (
          <View style={styles.errorRow}>
            <Text style={[Typography.body, { color: theme.dangerInk }]}>{mechanicError}</Text>
            <Button label="Retry" variant="ghost" onPress={retryMechanic} />
          </View>
        ) : null}

        <Text style={[Typography.label, styles.sectionTitle, { color: theme.textMuted }]}>
          Fuel snapshot
        </Text>
        <View style={styles.grid}>
          <View style={styles.gridItemFull}>
            <FuelEfficiencyCard average={stats.averageKmPerLiter} series={stats.kmPerLiterSeries} />
          </View>
          <View style={styles.gridItemFull}>
            <FuelSpendCard monthlySpend={stats.monthlySpend} series={stats.monthlySpendSeries} />
          </View>
          <View style={styles.gridItemFull}>
            <LastFuelUpCard log={logs[0] ?? null} />
          </View>
          <View style={styles.gridItemFull}>
            <NextExpiringCard document={nextDocument} today={today} />
          </View>
          <View style={styles.gridItemFull}>
            <LastMechanicVisitCard visit={mechanicVisits[0] ?? null} />
          </View>
        </View>

        <Text style={[Typography.label, styles.sectionTitle, { color: theme.textMuted }]}>
          Upcoming maintenance
        </Text>
        <StatCard
          label="Next service"
          value={nextValue}
          unit={nextUnit}
          status={nextDue === null ? undefined : { tone: nextDue.status, label: nextDue.status === 'overdue' ? 'OVERDUE' : nextDue.status === 'dueSoon' ? 'DUE SOON' : 'OK' }}
          progress={
            nextProgress === null
              ? undefined
              : {
                  value: nextProgress.value,
                  max: nextProgress.max,
                  tone: nextProgress.tone,
                  accessibilityLabel: `Next service ${nextProgress.basis === 'km' ? 'kilometer' : 'date'} progress`,
                }
          }
          onPress={() => router.push('/maintenance')}
        />
        {upcoming.length === 0 ? (
          <Text style={[Typography.body, { color: theme.textMuted }]}>
            No service due. Add a due km or date in Maintenance.
          </Text>
        ) : (
          <View style={styles.list}>
            {upcoming.map((log) => (
              <MaintenanceRow
                key={log.id}
                log={log}
                currentOdometer={vehicle.odometer}
                today={today}
                onPress={() => router.push('/maintenance')}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {sheetVisible ? (
        <UpdateOdometerSheet
          current={vehicle.odometer}
          onClose={() => setSheetVisible(false)}
          onSave={(next) => updateOdometer(vehicle.id, next)}
        />
      ) : null}
    </SafeAreaView>
  );
}

function DashboardSkeleton() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.content}>
        <View style={[styles.skeletonLine, { backgroundColor: theme.surfaceAlt }]} />
        <View style={[styles.skeletonHero, { backgroundColor: theme.surfaceAlt }]} />
        <View style={[styles.skeletonLine, styles.skeletonShort, { backgroundColor: theme.surfaceAlt }]} />
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
    paddingBottom: Platform.OS === 'web' ? BottomTabInset + Spacing.four : Spacing.four,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.two,
  },
  sectionTitle: {
    marginTop: Spacing.two,
  },
  errorRow: {
    gap: Spacing.two,
  },
  list: {
    gap: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  gridItemFull: {
    width: '100%',
  },
  skeletonLine: {
    height: 20,
    borderRadius: Radius.control,
  },
  skeletonShort: {
    width: '50%',
  },
  skeletonHero: {
    height: 140,
    borderRadius: Radius.card,
  },
});
