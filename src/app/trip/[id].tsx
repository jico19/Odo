import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TripMap } from '@/components/trips/trip-map';
import { Button, StatCard } from '@/components/ui';
import { MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { ensureDatabase } from '@/db/database';
import { addTripDistanceToOdometer, deleteTrip, getTrip, listTripPoints } from '@/db/queries';
import { useTheme } from '@/hooks/use-theme';
import { useVehicle } from '@/hooks/use-vehicle';
import type { GeoPoint, Trip } from '@/types/trip';
import { getTripDurationSeconds, roundTo } from '@/utils/calculations';
import { formatDateTime, formatDuration, formatNumber, formatTime } from '@/utils/format';
import { filterUsablePoints, tripDistanceKm } from '@/utils/geo';

type DetailStatus = 'loading' | 'ready' | 'error';

function firstParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export default function TripDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { applyVehicle } = useVehicle();
  const [status, setStatus] = useState<DetailStatus>('loading');
  const [trip, setTrip] = useState<Trip | null>(null);
  const [points, setPoints] = useState<GeoPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const tripId = Number(firstParam(id));

  useEffect(() => {
    let active = true;

    ensureDatabase()
      .then(() => {
        if (!active) return;
        const found = getTrip(tripId);
        if (found === null) {
          setError('This trip could not be found.');
          setStatus('error');
          return;
        }
        setTrip(found);
        setPoints(listTripPoints(tripId));
        setStatus('ready');
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : 'Could not load this trip.');
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [tripId]);

  const stats = useMemo(() => {
    const usable = filterUsablePoints(points);
    const distanceKm = trip?.distanceKm ?? tripDistanceKm(usable);
    const durationSeconds = trip === null ? 0 : getTripDurationSeconds(trip.startedAt, trip.endedAt);
    const averageKmh = durationSeconds > 0 ? roundTo((distanceKm / durationSeconds) * 3600, 1) : null;
    return { usable, distanceKm, durationSeconds, averageKmh };
  }, [points, trip]);

  function handleOdometer() {
    if (trip === null || trip.vehicleId === null || stats.distanceKm <= 0) return;
    const vehicleId = trip.vehicleId;
    Alert.alert(
      'Add distance to odometer?',
      `This will add ${formatNumber(stats.distanceKm, 2)} km to the vehicle's current reading.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add distance',
          onPress: () => {
            try {
              applyVehicle(addTripDistanceToOdometer(vehicleId, stats.distanceKm));
              Alert.alert('Odometer updated');
            } catch (cause) {
              Alert.alert('Could not update the odometer', cause instanceof Error ? cause.message : undefined);
            }
          },
        },
      ]
    );
  }

  function handleDelete() {
    Alert.alert('Delete this trip?', 'The route points will be deleted too.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          try {
            deleteTrip(tripId);
            router.back();
          } catch (cause) {
            Alert.alert('Could not delete the trip', cause instanceof Error ? cause.message : undefined);
          }
        },
      },
    ]);
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Trip', headerBackTitle: 'Trips' }} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={[]}>
        {status === 'loading' ? (
          <View style={styles.centered}>
            <Text style={[Typography.body, { color: theme.textMuted }]}>Loading trip...</Text>
          </View>
        ) : status === 'error' || trip === null ? (
          <View style={styles.centered}>
            <Text style={[Typography.body, { color: theme.textMuted }]}>{error}</Text>
            <Button label="Back to trips" onPress={() => router.back()} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={[Typography.title, { color: theme.text }]}>{formatDateTime(trip.startedAt)}</Text>
            <Text style={[Typography.body, { color: theme.textMuted }]}>
              {formatTime(trip.startedAt)} to {trip.endedAt === null ? 'recording' : formatTime(trip.endedAt)}
            </Text>

            <View style={styles.stats}>
              <View style={styles.statCell}>
                <StatCard label="Distance" value={formatNumber(stats.distanceKm, 2)} unit="km" />
              </View>
              <View style={styles.statCell}>
                <StatCard label="Duration" value={formatDuration(stats.durationSeconds)} />
              </View>
              <View style={styles.statCell}>
                <StatCard
                  label="Average speed"
                  value={stats.averageKmh === null ? '--' : formatNumber(stats.averageKmh, 1)}
                  unit={stats.averageKmh === null ? undefined : 'km/h'}
                />
              </View>
              <View style={styles.statCell}>
                <StatCard label="GPS points" value={stats.usable.length} />
              </View>
            </View>

            <TripMap points={stats.usable} />

            <View style={styles.actions}>
              <Button
                label="Add distance to odometer"
                variant="secondary"
                disabled={stats.distanceKm <= 0 || trip.vehicleId === null}
                onPress={handleOdometer}
              />
              <Button label="Delete trip" variant="danger" onPress={handleDelete} />
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </>
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
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  statCell: {
    width: '48%',
  },
  actions: {
    gap: Spacing.two,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
});
