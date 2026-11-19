import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { GeoPoint } from '@/types/trip';

import { RoutePreview } from './route-preview';

type TripMapProps = {
  points: GeoPoint[];
};

export function TripMap({ points }: TripMapProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: Radius.card },
      ]}>
      <Text style={[Typography.body, { color: theme.textMuted }]}>
        Route preview. The interactive map is available in the mobile app.
      </Text>
      <RoutePreview points={points} width={240} height={120} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 200,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
