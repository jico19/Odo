import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { DARK_MAP_STYLE } from '@/constants/map-style';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import type { GeoPoint } from '@/types/trip';
import { filterUsablePoints, simplifyPath, tripRegion } from '@/utils/geo';

type TripMapProps = {
  points: GeoPoint[];
};

export function TripMap({ points }: TripMapProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const route = useMemo(() => simplifyPath(filterUsablePoints(points)), [points]);
  const region = useMemo(() => (route.length > 0 ? tripRegion(route) : null), [route]);

  if (region === null) {
    return (
      <View
        style={[
          styles.empty,
          { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: Radius.card },
        ]}>
        <Text style={[Typography.body, { color: theme.textMuted }]}>
          No usable GPS points were recorded for this trip.
        </Text>
      </View>
    );
  }

  const coordinates = route.map((point) => ({
    latitude: point.latitude,
    longitude: point.longitude,
  }));

  return (
    <View style={[styles.container, { borderColor: theme.border, borderRadius: Radius.card }]}>
      <MapView
        style={styles.map}
        initialRegion={region}
        customMapStyle={scheme === 'dark' ? DARK_MAP_STYLE : undefined}
        userInterfaceStyle={scheme === 'dark' ? 'dark' : 'light'}
        accessibilityLabel="Map of the recorded route">
        <Polyline
          coordinates={coordinates}
          strokeColor={theme.accentInk}
          strokeWidth={4}
          lineCap="round"
          lineJoin="round"
        />
        <Marker coordinate={coordinates[0]} title="Start" pinColor={theme.accent} />
        <Marker
          coordinate={coordinates[coordinates.length - 1]}
          title="End"
          pinColor={theme.danger}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 320,
    borderWidth: 1,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  empty: {
    minHeight: 120,
    borderWidth: 1,
    padding: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
