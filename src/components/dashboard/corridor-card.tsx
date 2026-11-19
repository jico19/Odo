import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { RoutePreview } from '@/components/trips/route-preview';
import { EmptyState } from '@/components/ui';
import { LightCardShadow, Radius, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import type { GeoPoint, Trip } from '@/types/trip';
import { getTripDurationSeconds } from '@/utils/calculations';
import { formatDateShort, formatDuration, formatNumber } from '@/utils/format';

type CorridorCardProps = {
  trip: Trip | null;
  points: GeoPoint[];
  onPress: () => void;
};

export function CorridorCard({ trip, points, onPress }: CorridorCardProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const { width } = useWindowDimensions();
  const previewWidth = Math.max(160, width - 80);

  return (
    <View
      style={[
        styles.card,
        scheme === 'light' && LightCardShadow,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      <View style={styles.header}>
        <Ionicons name="compass-outline" size={18} color={theme.accentInk} accessible={false} />
        <Text style={[Typography.label, styles.headerTitle, { color: theme.textMuted }]}>
          RECENT CORRIDOR
        </Text>
        {trip === null ? null : (
          <Text style={[Typography.label, { color: theme.textMuted }]}>
            {formatDateShort(trip.startedAt.slice(0, 10)).toUpperCase()}
          </Text>
        )}
      </View>

      {trip === null ? (
        <EmptyState icon="map-outline" message="No trips yet. Start one from the Trips tab." />
      ) : (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`Recent trip, ${formatDateShort(trip.startedAt.slice(0, 10))}, ${formatNumber(trip.distanceKm ?? 0, 1)} kilometers`}
          style={({ pressed }) => [styles.frame, { backgroundColor: theme.surfaceAlt }, pressed && styles.pressed]}>
          <RoutePreview points={points} width={previewWidth} height={128} />
          <View style={[styles.overlay, { backgroundColor: `${theme.background}CC` }]}>
            <Text style={[Typography.label, styles.overlayText, { color: theme.text }]}>
              TRIP · {formatDuration(getTripDurationSeconds(trip.startedAt, trip.endedAt)).toUpperCase()}
            </Text>
            <Text style={[Typography.label, { color: theme.accentInk }]}>
              {formatNumber(trip.distanceKm ?? 0, 1)} KM
            </Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerTitle: {
    flex: 1,
    flexShrink: 1,
  },
  frame: {
    height: 144,
    borderRadius: Radius.control,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    padding: Spacing.two,
  },
  overlayText: {
    flexShrink: 1,
  },
});
