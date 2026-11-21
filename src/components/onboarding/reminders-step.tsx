import { Ionicons } from '@react-native-vector-icons/ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function RemindersStep() {
  const theme = useTheme();

  return (
    <View style={styles.content}>
      <Text style={[Typography.title, { color: theme.text }]}>Almost there</Text>
      <Text style={[Typography.body, styles.subtitle, { color: theme.textMuted }]}>
        Odo can remind you before a dated service is due. Notifications stay on this device — no
        account, no cloud, no tracking.
      </Text>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name="notifications-outline" size={22} color={theme.accentInk} accessible={false} />
        </View>
        <View style={styles.copy}>
          <Text style={[Typography.heading, { color: theme.text }]}>Service reminders</Text>
          <Text style={[Typography.body, styles.note, { color: theme.textMuted }]}>
            You&apos;ll be asked for permission when you finish. If you decline, every due date still
            shows in the app. You can change this in your phone settings later.
          </Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.icon, { backgroundColor: theme.surfaceAlt }]}>
          <Ionicons name="shield-checkmark-outline" size={22} color={theme.accentInk} accessible={false} />
        </View>
        <View style={styles.copy}>
          <Text style={[Typography.heading, { color: theme.text }]}>Private by default</Text>
          <Text style={[Typography.body, styles.note, { color: theme.textMuted }]}>
            Fuel, trips, service records and photos never leave your phone.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.two,
  },
  subtitle: {
    marginBottom: Spacing.two,
  },
  card: {
    flexDirection: 'row',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.three,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: Radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: Spacing.half,
  },
  note: {
    fontSize: 14,
  },
});
