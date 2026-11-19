import { useEffect, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Circle, Svg } from 'react-native-svg';

import { LightCardShadow, Radius, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

import { StatusChip, type StatusTone } from './status-chip';

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ARC = CIRCUMFERENCE * (240 / 360);

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type GaugeProps = {
  label: string;
  value: string;
  unit: string;
  progress: number;
  tone: StatusTone;
  badge?: { label: string; tone: StatusTone };
  footer?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function Gauge({
  label,
  value,
  unit,
  progress,
  tone,
  badge,
  footer,
  onPress,
  accessibilityLabel,
}: GaugeProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const [fill] = useState(() => new Animated.Value(0));
  const target = Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 1) : 0;
  const color = { ok: theme.accent, dueSoon: theme.warning, overdue: theme.danger }[tone];
  const description = accessibilityLabel ?? `${label}, ${value} ${unit}`;
  const dash = fill.interpolate({
    inputRange: [0, 1],
    outputRange: [`0 ${CIRCUMFERENCE}`, `${ARC * target} ${CIRCUMFERENCE}`],
  });

  useEffect(() => {
    let active = true;

    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!active) return;
      if (reduced) {
        fill.setValue(1);
        return;
      }
      fill.setValue(0);
      Animated.timing(fill, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });

    return () => {
      active = false;
    };
  }, [fill, target]);

  const content = (
    <>
      <View style={styles.header}>
        <Text style={[Typography.label, styles.headerLabel, { color: theme.textMuted }]}>{label}</Text>
        {badge ? <StatusChip tone={badge.tone} label={badge.label} /> : null}
      </View>

      <View style={styles.dial}>
        <Svg width={160} height={160} viewBox="0 0 160 160" accessible={false}>
          <Circle
            cx={80}
            cy={80}
            r={RADIUS}
            fill="transparent"
            stroke={theme.surfaceAlt}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={`${ARC} ${CIRCUMFERENCE}`}
            rotation="150 80 80"
          />
          <AnimatedCircle
            cx={80}
            cy={80}
            r={RADIUS}
            fill="transparent"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={dash as unknown as string}
            rotation="150 80 80"
          />
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <Text style={[Typography.display, styles.value, { color: theme.text }]}>{value}</Text>
          <Text style={[Typography.label, { color: theme.textMuted }]}>{unit}</Text>
        </View>
      </View>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </>
  );

  const style = [
    styles.card,
    scheme === 'light' && LightCardShadow,
    { backgroundColor: theme.surface, borderColor: theme.border },
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={description}
        style={({ pressed }) => [style, pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={description} style={style}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.two,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  headerLabel: {
    flexShrink: 1,
    paddingTop: Spacing.half,
  },
  dial: {
    width: 160,
    height: 160,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 32,
    lineHeight: 36,
  },
  footer: {
    paddingTop: Spacing.two,
  },
});
