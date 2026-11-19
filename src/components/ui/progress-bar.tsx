import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { type StatusTone } from './status-chip';

export type ProgressBarProps = {
  value: number;
  max: number;
  tone?: StatusTone;
  accessibilityLabel?: string;
};

function toneFromRatio(ratio: number): StatusTone {
  if (ratio >= 1) return 'overdue';
  if (ratio > 0.8) return 'dueSoon';
  return 'ok';
}

export function ProgressBar({ value, max, tone, accessibilityLabel }: ProgressBarProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const activeTone = tone ?? toneFromRatio(ratio);
  const fill = useSharedValue(0);
  const animatedFill = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));
  const percent = Math.round(ratio * 100);

  useEffect(() => {
    fill.value = reducedMotion
      ? ratio
      : withTiming(ratio, { duration: 250, easing: Easing.out(Easing.cubic) });
  }, [fill, ratio, reducedMotion]);

  const fillColor =
    activeTone === 'overdue' ? theme.danger : activeTone === 'dueSoon' ? theme.warning : theme.accent;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? 'Progress'}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={[styles.track, { backgroundColor: theme.surfaceAlt }]}>
      <Animated.View style={[styles.fill, animatedFill, { backgroundColor: fillColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: Radius.pill,
  },
});
