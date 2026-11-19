import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Circle, Line, Polygon, Polyline, Svg } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';
import type { ChartPoint } from '@/utils/calculations';

type EfficiencySparklineProps = {
  points: ChartPoint[];
  target: number;
  height?: number;
  accessibilityLabel: string;
};

const PAD_X = 8;
const PAD_Y = 10;
const SPARKLINE_HEIGHT = 80;

export function EfficiencySparkline({
  points,
  target,
  height = SPARKLINE_HEIGHT,
  accessibilityLabel,
}: EfficiencySparklineProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);

  const values = points.map((point) => point.value);
  const min = Math.min(...values, target) - 2;
  const max = Math.max(...values, target) + 2;
  const span = Math.max(1, max - min);
  const stepX = points.length <= 1 ? 0 : (Math.max(width, PAD_X * 2) - PAD_X * 2) / (points.length - 1);
  const x = (index: number) => PAD_X + index * stepX;
  const y = (value: number) => PAD_Y + (1 - (value - min) / span) * (height - PAD_Y * 2);
  const linePoints = points.map((point, index) => `${x(index)},${y(point.value)}`).join(' ');
  const areaPoints = `${PAD_X},${height - PAD_Y} ${linePoints} ${x(points.length - 1)},${height - PAD_Y}`;

  function handleLayout(event: LayoutChangeEvent) {
    setWidth(Math.floor(event.nativeEvent.layout.width));
  }

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      onLayout={handleLayout}
      style={[styles.container, { height }]}>
      {width > 0 && points.length > 0 ? (
        <Svg width={width} height={height}>
          <Line
            x1={PAD_X}
            x2={width - PAD_X}
            y1={y(target)}
            y2={y(target)}
            stroke={theme.border}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <Polygon points={areaPoints} fill={theme.accentSoft} />
          <Polyline
            points={linePoints}
            fill="none"
            stroke={theme.accent}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((point, index) => {
            const latest = index === points.length - 1;
            return (
              <Circle
                key={`${point.label}-${index}`}
                cx={x(index)}
                cy={y(point.value)}
                r={latest ? 4.5 : 3}
                fill={latest ? theme.accent : theme.background}
                stroke={theme.accent}
                strokeWidth={2}
              />
            );
          })}
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
