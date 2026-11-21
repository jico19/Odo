import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Redirect, router } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { CorridorCard } from '@/components/dashboard/corridor-card';
import { GaugeHero } from '@/components/dashboard/gauge-hero';
import { TelemetryTiles } from '@/components/dashboard/telemetry-tiles';
import { ComplianceCard } from '@/components/documents/compliance-card';
import { QuickEntryDrawer } from '@/components/fuel/quick-entry-drawer';
import { MaintenanceFormSheet } from '@/components/maintenance/maintenance-form-sheet';
import { MaintenanceRow } from '@/components/maintenance/maintenance-row';
import { PmsRow, pmsTone } from '@/components/pms/pms-row';
import { QuickAddRow } from '@/components/quick-add-row';
import { UpdateOdometerSheet } from '@/components/update-odometer-sheet';
import { Button, EmptyState, ListRow, SkeletonLine } from '@/components/ui';
import { BottomTabInset, MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useDocuments } from '@/hooks/use-documents';
import { useFuelLogs } from '@/hooks/use-fuel-logs';
import { useMaintenanceLogs } from '@/hooks/use-maintenance';
import { useMechanicVisits } from '@/hooks/use-mechanic-visits';
import { usePmsItems } from '@/hooks/use-pms-items';
import { usePreferences } from '@/hooks/use-preferences';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';
import { useTrips } from '@/hooks/use-trips';
import { useVehicle } from '@/hooks/use-vehicle';
import type { DueInfo } from '@/utils/calculations';
import type { NewMaintenanceLog } from '@/types/maintenance';
import type { Trip } from '@/types/trip';
import {
  calculateFuelStats,
  getBestEfficiency,
  getDueInfo,
  getEfficiencyTrend,
  getFuelLogCost,
  getMaintenanceProgress,
  getTodayRideStats,
  getUpcoming,
} from '@/utils/calculations';
import { getPmsProgress, maintenanceLabel, sortPmsItems } from '@/utils/pms';
import {
  formatCurrency,
  formatDateShort,
  formatDuration,
  formatNumber,
  formatOdometer,
} from '@/utils/format';

type Editor = 'maintenance' | null;

export default function DashboardScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const narrow = width < 360;
  const wide = width >= 700;
  const paired = width >= 640;

  const { status, vehicle, updateOdometer } = useVehicle();
  const {
    status: fuelStatus,
    logs,
    error: fuelError,
    retry: retryFuel,
    create: createFuel,
  } = useFuelLogs(vehicle?.id ?? 0);
  const {
    status: maintenanceStatus,
    logs: maintenanceLogs,
    error: maintenanceError,
    retry: retryMaintenance,
    create: createService,
  } = useMaintenanceLogs(vehicle?.id ?? 0);
  const { status: documentStatus, documents } = useDocuments();
  const {
    status: mechanicStatus,
    visits: mechanicVisits,
    error: mechanicError,
    retry: retryMechanic,
  } = useMechanicVisits(vehicle?.id ?? 0);
  const {
    status: tripStatus,
    trips,
    routes,
    error: tripError,
    refresh: refreshTrips,
  } = useTrips(vehicle?.id ?? 0);
  const pms = usePmsItems(vehicle?.id ?? 0);
  const preferences = usePreferences();
  const today = useToday();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [quickFuelOpen, setQuickFuelOpen] = useState(false);
  const [editor, setEditor] = useState<Editor>(null);
  const stats = useMemo(() => calculateFuelStats(logs), [logs]);
  const upcoming = useMemo(
    () => getUpcoming(maintenanceLogs, vehicle?.odometer ?? 0, today),
    [maintenanceLogs, vehicle?.odometer, today]
  );
  const efficiencyTrend = useMemo(() => getEfficiencyTrend(stats, today), [stats, today]);
  const bestEfficiency = useMemo(() => getBestEfficiency(stats), [stats]);
  const todayRide = useMemo(() => getTodayRideStats(trips, today), [trips, today]);
  const pmsEntries = useMemo(
    () => sortPmsItems(pms.items.filter((item) => item.enabled), vehicle?.odometer ?? 0, today),
    [pms.items, vehicle?.odometer, today]
  );

  const loading =
    status === 'loading' ||
    fuelStatus === 'loading' ||
    maintenanceStatus === 'loading' ||
    documentStatus === 'loading' ||
    mechanicStatus === 'loading' ||
    pms.status === 'loading' ||
    preferences.status === 'loading' ||
    (vehicle !== null && tripStatus === 'loading');

  if (loading) return <DashboardSkeleton />;
  if (vehicle === null) return <Redirect href="/onboarding" />;

  const nextPms = pmsEntries[0] ?? null;
  const fallbackService = upcoming[0] ?? null;
  const nextDue: DueInfo | null =
    nextPms !== null
      ? {
          status: pmsTone(nextPms.status.status),
          kmLeft: nextPms.status.kmLeft,
          daysLeft: nextPms.status.daysLeft,
        }
      : fallbackService === null
        ? null
        : getDueInfo(fallbackService, vehicle.odometer, today);
  const nextProgress =
    nextPms !== null
      ? getPmsProgress(nextPms.item, vehicle.odometer, today)
      : fallbackService === null
        ? null
        : getMaintenanceProgress(fallbackService, vehicle.odometer, today);
  const remainingServices = upcoming.slice(1);
  const lastFuel = logs[0] ?? null;
  const lastVisit = mechanicVisits[0] ?? null;
  const lastTrip = trips[0] ?? null;
  const tripPoints = lastTrip === null ? [] : routes.get(lastTrip.id) ?? [];
  const hasErrors =
    fuelError !== null ||
    maintenanceError !== null ||
    mechanicError !== null ||
    tripError !== null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <AppHeader
        title="Dashboard"
        vehicleName={vehicle.name}
        odometer={vehicle.odometer}
        subtitle={`${vehicle.plate ?? 'No plate added'} · ${formatOdometer(vehicle.odometer)} km`}
        onSettingsPress={() => router.push('/settings')}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          narrow && styles.contentNarrow,
          {
            paddingBottom:
              Platform.OS === 'web' ? BottomTabInset + Spacing.four : insets.bottom + Spacing.four,
          },
        ]}>
        {hasErrors ? (
          <View style={styles.errors}>
            {fuelError !== null ? <ErrorRow message={fuelError} onRetry={retryFuel} /> : null}
            {maintenanceError !== null ? (
              <ErrorRow message={maintenanceError} onRetry={retryMaintenance} />
            ) : null}
            {mechanicError !== null ? (
              <ErrorRow message={mechanicError} onRetry={retryMechanic} />
            ) : null}
            {tripError !== null ? <ErrorRow message={tripError} onRetry={refreshTrips} /> : null}
          </View>
        ) : null}

        {vehicle.transmissionType === null && !preferences.preferences.setupBannerDismissed ? (
          <View style={[styles.banner, { backgroundColor: theme.warningSoft, borderColor: theme.warning }]}>
            <Ionicons name="information-circle-outline" size={20} color={theme.warningInk} accessible={false} />
            <Pressable
              onPress={() => router.push({ pathname: '/settings', params: { section: 'motorcycle' } })}
              accessibilityRole="button"
              accessibilityLabel="Set your transmission type to get a PMS checklist"
              style={styles.bannerCopy}>
              <Text style={[Typography.body, styles.bannerText, { color: theme.warningInk }]}>
                Set your transmission type to get a PMS checklist
              </Text>
            </Pressable>
            <Pressable
              onPress={() => preferences.update('setupBannerDismissed', true)}
              accessibilityRole="button"
              accessibilityLabel="Dismiss setup reminder"
              hitSlop={8}
              style={styles.bannerDismiss}>
              <Ionicons name="close" size={18} color={theme.warningInk} accessible={false} />
            </Pressable>
          </View>
        ) : null}

        <SectionTitle>Telemetry gauges</SectionTitle>
        <GaugeHero
          odometer={vehicle.odometer}
          serviceDue={nextDue}
          serviceProgress={nextProgress}
          efficiency={stats.averageKmPerLiter}
          bestEfficiency={bestEfficiency}
          trend={efficiencyTrend}
          columns={paired ? 2 : 1}
          onUpdateOdometer={() => setSheetVisible(true)}
        />

        <SectionTitle>Quick telemetry</SectionTitle>
        <TelemetryTiles
          efficiency={stats.averageKmPerLiter}
          trend={efficiencyTrend}
          lastService={maintenanceLogs[0] ?? null}
          pmsItems={pms.items}
          ride={todayRide}
          columns={paired ? 3 : 1}
        />

        <ComplianceCard
          documents={documents}
          today={today}
          onPress={() => router.push('/maintenance')}
        />

        <QuickAddRow
          onLogFuel={() => setQuickFuelOpen(true)}
          onAddService={() => setEditor('maintenance')}
          onStartTrip={() => router.push('/trips')}
        />

        <CorridorCard
          trip={lastTrip}
          points={tripPoints}
          onPress={() => router.push('/trips')}
        />

        <SectionTitle>Recent</SectionTitle>
        <TileGrid
          columns={wide ? 3 : 1}
          tiles={[
            <ListRow
              key="last-fuel"
              icon="water-outline"
              title="Last fuel-up"
              subtitle={
                lastFuel === null
                  ? 'No fuel logged yet'
                  : `${formatNumber(lastFuel.liters, 1)} L · ${formatOdometer(lastFuel.odometer ?? 0)} km · ${lastFuel.fullTank ? 'Full tank' : 'Partial'}`
              }
              value={lastFuel === null ? undefined : formatCurrency(getFuelLogCost(lastFuel))}
              date={lastFuel === null ? undefined : formatDateShort(lastFuel.date)}
              onPress={() => router.push('/fuel')}
              divider={!wide}
            />,
            <ListRow
              key="last-visit"
              icon="construct-outline"
              title="Mechanic visit"
              subtitle={
                lastVisit === null
                  ? 'No visits logged yet'
                  : [lastVisit.shop?.trim() || 'Unspecified shop', lastVisit.workDone]
                      .filter((part): part is string => typeof part === 'string' && part.length > 0)
                      .join(' · ')
              }
              value={
                lastVisit?.cost === null || lastVisit === null
                  ? undefined
                  : formatCurrency(lastVisit.cost)
              }
              date={lastVisit === null ? undefined : formatDateShort(lastVisit.date)}
              onPress={() => router.push('/mechanic')}
              divider={!wide}
            />,
            <ListRow
              key="last-trip"
              icon="map-outline"
              title="Last trip"
              subtitle={tripSubtitle(lastTrip)}
              value={
                lastTrip?.distanceKm === null || lastTrip === null
                  ? undefined
                  : `${formatNumber(lastTrip.distanceKm, 1)} km`
              }
              date={lastTrip === null ? undefined : formatDateShort(lastTrip.startedAt.slice(0, 10))}
              onPress={() => router.push('/trips')}
              divider={false}
            />,
          ]}
        />

        <SectionTitle>Next service</SectionTitle>
        {pmsEntries.length > 0 ? (
          <View style={styles.list}>
            {pmsEntries.slice(0, 4).map((entry) => (
              <PmsRow
                key={entry.item.id}
                entry={entry}
                distanceUnit={preferences.preferences.distanceUnit}
                onPress={() => router.push('/maintenance')}
              />
            ))}
          </View>
        ) : remainingServices.length === 0 ? (
          <EmptyState
            icon="clipboard-outline"
            message="No service checklist yet. Set your transmission type in Settings."
          />
        ) : (
          <View style={styles.list}>
            {remainingServices.map((log) => (
              <MaintenanceRow
                key={log.id}
                log={log}
                label={maintenanceLabel(log, pms.items)}
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

      {quickFuelOpen ? (
        <QuickEntryDrawer
          defaultOdometer={vehicle.odometer}
          onClose={() => setQuickFuelOpen(false)}
          onSave={(input) => {
            createFuel(input);
            setQuickFuelOpen(false);
          }}
        />
      ) : null}
      {editor === 'maintenance' ? (
        <MaintenanceFormSheet
          initialLog={null}
          pmsItems={pms.items}
          distanceUnit={preferences.preferences.distanceUnit}
          currency={preferences.preferences.currency}
          onClose={() => setEditor(null)}
          onDelete={() => setEditor(null)}
          onSave={(input: NewMaintenanceLog) => {
            createService(input);
            setEditor(null);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function tripSubtitle(trip: Trip | null): string {
  if (trip === null) return 'No trips yet';
  if (trip.endedAt === null) return 'In progress';
  return formatDuration((Date.parse(trip.endedAt) - Date.parse(trip.startedAt)) / 1000);
}

function SectionTitle({ children }: { children: string }) {
  const theme = useTheme();

  return (
    <Text style={[Typography.label, styles.sectionTitle, { color: theme.textMuted }]}>{children}</Text>
  );
}

function ErrorRow({ message, onRetry }: { message: string; onRetry: () => void }) {
  const theme = useTheme();

  return (
    <View style={styles.errorRow}>
      <Text style={[Typography.body, { color: theme.dangerInk }]}>{message}</Text>
      <Button label="Retry" variant="ghost" onPress={onRetry} />
    </View>
  );
}

function TileGrid({ columns, tiles }: { columns: number; tiles: ReactNode[] }) {
  const rows: ReactNode[][] = [];
  for (let index = 0; index < tiles.length; index += columns) {
    rows.push(tiles.slice(index, index + columns));
  }

  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={columns === 1 ? styles.gridStack : styles.gridRow}>
          {row.map((tile, tileIndex) => (
            <View key={tileIndex} style={styles.gridItem}>
              {tile}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function DashboardSkeleton() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const paired = width >= 640;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.content}>
        <SkeletonLine width="40%" />
        <SkeletonLine width="100%" />
        <View style={[styles.skeletonGauge, { backgroundColor: theme.surfaceAlt }]} />
        {paired ? (
          <View style={[styles.skeletonGauge, { backgroundColor: theme.surfaceAlt }]} />
        ) : null}
        <View style={[styles.skeletonTile, { backgroundColor: theme.surfaceAlt }]} />
        <View style={[styles.skeletonQuick, { backgroundColor: theme.surfaceAlt }]} />
        <View style={[styles.skeletonCorridor, { backgroundColor: theme.surfaceAlt }]} />
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
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  contentNarrow: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.three,
    gap: Spacing.md,
  },
  sectionTitle: {
    marginTop: Spacing.two,
  },
  errors: {
    gap: Spacing.two,
  },
  errorRow: {
    gap: Spacing.two,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.control,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  bannerCopy: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  bannerText: {
    fontSize: 14,
  },
  bannerDismiss: {
    width: 32,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: Spacing.two,
  },
  grid: {
    gap: Spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  gridStack: {
    gap: Spacing.two,
  },
  gridItem: {
    flex: 1,
    minWidth: 0,
  },
  skeletonGauge: {
    height: 240,
    borderRadius: Radius.card,
  },
  skeletonTile: {
    height: 120,
    borderRadius: Radius.card,
  },
  skeletonQuick: {
    height: 56,
    borderRadius: Radius.control,
  },
  skeletonCorridor: {
    height: 200,
    borderRadius: Radius.card,
  },
});
