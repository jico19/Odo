import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { GeoPoint, Trip } from '@/types/trip';
import { getTripDurationSeconds } from '@/utils/calculations';
import { formatDateTime, formatDuration, formatNumber } from '@/utils/format';

import { RoutePreview } from './route-preview';

type TripRowProps = {
  trip: Trip;
  points: GeoPoint[];
  onPress: () => void;
  divider?: boolean;
};

export function TripRow({ trip, points, onPress, divider = true }: TripRowProps) {
  const theme = useTheme();
  const duration = formatDuration(getTripDurationSeconds(trip.startedAt, trip.endedAt));
  const distance = formatNumber(trip.distanceKm ?? 0, 1);
  const description = `Trip on ${formatDateTime(trip.startedAt)}, ${distance} kilometers, ${duration}`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={description}
      style={[styles.row, divider && styles.divider, { borderBottomColor: theme.border }]}>
      <RoutePreview points={points} />
      <View style={styles.details}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {formatDateTime(trip.startedAt)}
        </Text>
        <Text style={[Typography.body, { color: theme.textMuted }]} numberOfLines={1}>
          {duration}
        </Text>
      </View>
      <View style={styles.trailing}>
        <Text style={[Typography.mono, styles.value, { color: theme.text }]}>{distance} km</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.textMuted} accessible={false} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  divider: {
    borderBottomWidth: 1,
  },
  details: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  trailing: {
    alignItems: 'flex-end',
    flexShrink: 0,
    gap: Spacing.half,
  },
  value: {
    textAlign: 'right',
  },
});
