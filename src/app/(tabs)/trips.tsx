import { Ionicons } from '@react-native-vector-icons/ionicons';
import { router, Redirect } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { PermissionSheet } from '@/components/trips/permission-sheet';
import { TripRow } from '@/components/trips/trip-row';
import { Button, EmptyState, SkeletonCard, SkeletonLine } from '@/components/ui';
import { MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTripRecorder } from '@/hooks/use-trip-recorder';
import { useTrips } from '@/hooks/use-trips';
import { useVehicle } from '@/hooks/use-vehicle';
import { formatClock, formatNumber } from '@/utils/format';

export default function TripsScreen() {
  const theme = useTheme();
  const { status: vehicleStatus, vehicle } = useVehicle();
  const recorder = useTripRecorder();
  const { status, trips, routes, error, refresh } = useTrips(vehicle?.id ?? 0);
  const insets = useSafeAreaInsets();
  const recording = recorder.status === 'recording';
  const busy = recorder.status === 'starting' || recorder.status === 'stopping';

  if (vehicleStatus === 'loading') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.content}>
          <TripsSkeleton />
        </View>
      </SafeAreaView>
    );
  }
  if (vehicle === null) return <Redirect href="/onboarding" />;

  const controlLabel = busy
    ? recorder.status === 'starting'
      ? 'Starting...'
      : 'Stopping...'
    : recording
      ? 'Stop trip'
      : 'Start trip';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <AppHeader title="Trips" vehicleName={vehicle.name} odometer={vehicle.odometer} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.four }]}>
        {recording ? (
          <View style={[styles.live, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.liveStats}>
              <View style={styles.liveStat}>
                <Text style={[Typography.label, { color: theme.textMuted }]}>Elapsed</Text>
                <Text style={[Typography.display, styles.liveValue, { color: theme.text }]}>
                  {formatClock(recorder.elapsedSeconds)}
                </Text>
              </View>
              <View style={styles.liveStat}>
                <Text style={[Typography.label, { color: theme.textMuted }]}>Distance</Text>
                <Text style={[Typography.display, styles.liveValue, { color: theme.text }]}>
                  {formatNumber(recorder.distanceKm, 2)}
                </Text>
                <Text style={[Typography.mono, { color: theme.textMuted }]}>km</Text>
              </View>
            </View>
            <Text style={[Typography.body, { color: theme.textMuted }]}>
              Recording stops when the screen locks. Keep the screen on while you ride.
            </Text>
          </View>
        ) : (
          <Text style={[Typography.body, { color: theme.textMuted }]}>
            Record a ride to see its route and distance here. Your route stays on this device.
          </Text>
        )}

        <Pressable
          onPress={() => {
            if (recording) {
              void recorder.stop().then(refresh);
            } else {
              void recorder.start();
            }
          }}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={controlLabel}
          accessibilityState={{ disabled: busy, busy }}
          style={({ pressed }) => [
            styles.control,
            recording
              ? { backgroundColor: theme.dangerSoft, borderColor: theme.danger }
              : { backgroundColor: theme.accentInk, borderColor: theme.accentInk },
            pressed && !busy && styles.pressed,
            busy && styles.inert,
          ]}>
          <Ionicons
            name={recording ? 'stop-circle' : 'locate'}
            size={22}
            color={recording ? theme.dangerInk : theme.onAccent}
            accessible={false}
          />
          <Text
            style={[
              Typography.heading,
              styles.controlLabel,
              { color: recording ? theme.dangerInk : theme.onAccent },
            ]}>
            {controlLabel}
          </Text>
        </Pressable>

        {recorder.error === null ? null : (
          <Text style={[Typography.body, { color: theme.dangerInk }]}>{recorder.error}</Text>
        )}

        <Text style={[Typography.heading, styles.historyTitle, { color: theme.text }]}>History</Text>

        {status === 'loading' ? (
          <TripsSkeleton />
        ) : status === 'error' ? (
          <View style={styles.centered}>
            <Text style={[Typography.body, { color: theme.textMuted }]}>{error}</Text>
            <Button label="Try again" onPress={refresh} />
          </View>
        ) : trips.length === 0 ? (
          <EmptyState
            icon="navigate-outline"
            message="No trips recorded yet. Use Start trip above before your next ride."
          />
        ) : (
          <View>
            {trips.map((trip, index) => (
              <TripRow
                key={trip.id}
                trip={trip}
                points={routes.get(trip.id) ?? []}
                divider={index < trips.length - 1}
                onPress={() => router.push({ pathname: '/trip/[id]', params: { id: String(trip.id) } })}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {recorder.showPermissionSheet ? (
        <PermissionSheet
          canAskAgain={recorder.canAskAgain}
          onAllow={() => void recorder.allowLocation()}
          onOpenSettings={recorder.openSettings}
          onDismiss={recorder.dismissPermissionSheet}
        />
      ) : null}
    </SafeAreaView>
  );
}

function TripsSkeleton() {
  return (
    <View style={styles.skeletonGroup}>
      <SkeletonLine />
      <SkeletonCard height={64} />
      <SkeletonCard height={64} />
    </View>
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
  live: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  liveStats: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  liveStat: {
    flex: 1,
    gap: Spacing.half,
  },
  liveValue: {
    fontSize: 32,
    lineHeight: 38,
  },
  control: {
    minHeight: 56,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.control,
    ...Platform.select({
      web: { cursor: 'pointer' },
      default: {},
    }),
  },
  pressed: {
    opacity: 0.75,
  },
  inert: {
    opacity: 0.5,
  },
  controlLabel: {
    fontWeight: '600',
  },
  historyTitle: {
    marginTop: Spacing.two,
  },
  centered: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.four,
  },
  skeletonGroup: {
    gap: Spacing.two,
  },
});
