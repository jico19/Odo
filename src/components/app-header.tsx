import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatOdometer } from '@/utils/format';

export type AppHeaderProps = {
  title: string;
  vehicleName: string;
  odometer: number;
  subtitle?: string;
  onBack?: () => void;
  onSettingsPress?: () => void;
};

export function AppHeader({
  title,
  vehicleName,
  odometer,
  subtitle,
  onBack,
  onSettingsPress,
}: AppHeaderProps) {
  const theme = useTheme();
  const detail = subtitle ?? `${vehicleName} · ${formatOdometer(odometer)} km`;

  return (
    <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
      <View style={styles.inner}>
        {onBack !== undefined ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={theme.text} accessible={false} />
          </Pressable>
        ) : null}
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
        {onSettingsPress !== undefined ? (
          <Pressable
            onPress={onSettingsPress}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            hitSlop={8}
            style={styles.action}>
            <Ionicons name="settings-outline" size={22} color={theme.text} accessible={false} />
          </Pressable>
        ) : null}
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
    gap: Spacing.two,
  },
  back: {
    width: 32,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
  action: {
    width: 40,
    height: 44,
    borderRadius: Radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
