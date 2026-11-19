import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SkeletonLineProps = {
  width?: string | number;
  height?: number;
};

export function SkeletonLine({ width = '40%', height = 20 }: SkeletonLineProps) {
  const theme = useTheme();

  return <View style={[styles.line, { width, height, backgroundColor: theme.surfaceAlt }]} />;
}

export type SkeletonCardProps = {
  height?: number;
};

export function SkeletonCard({ height = 100 }: SkeletonCardProps) {
  const theme = useTheme();

  return <View style={[styles.card, { height, backgroundColor: theme.surfaceAlt }]} />;
}

const styles = StyleSheet.create({
  line: {
    borderRadius: Radius.control,
  },
  card: {
    borderRadius: Radius.card,
  },
});
