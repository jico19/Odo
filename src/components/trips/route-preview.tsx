import { StyleSheet, View } from 'react-native';
import { Circle, Polyline, Svg } from 'react-native-svg';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { GeoPoint } from '@/types/trip';
import { buildPreviewPath, filterUsablePoints, simplifyPath } from '@/utils/geo';

type RoutePreviewProps = {
  points: GeoPoint[];
  width?: number;
  height?: number;
};

export function RoutePreview({ points, width = 56, height = 40 }: RoutePreviewProps) {
  const theme = useTheme();
  const usable = filterUsablePoints(points);
  const path = buildPreviewPath(simplifyPath(usable), width, height).map(
    (point) => `${point.x},${point.y}`
  );

  return (
    <View
      accessible={false}
      style={[
        styles.frame,
        {
          backgroundColor: theme.accentSoft,
          borderRadius: Radius.control,
          padding: Spacing.two,
        },
      ]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {path.length > 1 ? (
          <Polyline
            points={path.join(' ')}
            fill="none"
            stroke={theme.accentInk}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : path.length === 1 ? (
          <Circle cx={width / 2} cy={height / 2} r={2.5} fill={theme.accentInk} />
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    flexShrink: 0,
    overflow: 'hidden',
  },
});
