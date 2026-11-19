import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { EmptyState, type IconName } from './ui';

type PlaceholderScreenProps = {
  title: string;
  icon: IconName;
  detail: string;
};

export function PlaceholderScreen({ title, icon, detail }: PlaceholderScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <Text style={[Typography.title, styles.title, { color: theme.text }]}>{title}</Text>
      <EmptyState icon={icon} message={`Coming soon. ${detail}`} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
  },
  title: {
    marginBottom: Spacing.four,
  },
});
