import { Ionicons } from '@react-native-vector-icons/ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatOdometer } from '@/utils/format';

export type AppHeaderProps = {
  title: string;
  vehicleName: string;
  odometer: number;
  subtitle?: string;
};

export function AppHeader({ title, vehicleName, odometer, subtitle }: AppHeaderProps) {
  const theme = useTheme();
  const detail = subtitle ?? `${vehicleName} · ${formatOdometer(odometer)} km`;

  return (
    <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
      <View style={styles.inner}>
        <View style={styles.brand}>
          <View style={[styles.mark, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name="speedometer" size={18} color={theme.accentInk} accessible={false} />
          </View>
          <View style={styles.copy}>
            <Text style={[Typography.heading, styles.title, { color: theme.text }]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={[Typography.label, styles.subtitle, { color: theme.textMuted }]} numberOfLines={1}>
              {detail}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    height: 64,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  brand: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  mark: {
    width: 34,
    height: 34,
    borderRadius: Radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    flexShrink: 1,
  },
  subtitle: {
    flexShrink: 1,
    letterSpacing: 0.2,
    textTransform: 'none',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
