import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Button } from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAppearanceSync } from '@/hooks/use-appearance-sync';
import { TripRecorderProvider } from '@/hooks/use-trip-recorder';
import { DataSyncProvider } from '@/hooks/use-data-sync';
import { VehicleProvider, useVehicle } from '@/hooks/use-vehicle';
import { setupNotifications } from '@/utils/notifications';

SplashScreen.preventAutoHideAsync();

function AppearanceSync() {
  useAppearanceSync();
  return null;
}

function AppNavigator() {
  const { status, error, retry } = useVehicle();

  if (status === 'error') {
    return (
      <View style={styles.centered}>
        <ThemedText type="title">Database unavailable</ThemedText>
        <ThemedText style={styles.message}>
          {error ?? 'Could not open the database.'}
        </ThemedText>
        <Button label="Try again" onPress={retry} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    setupNotifications();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <DataSyncProvider>
        <AppearanceSync />
        <VehicleProvider>
          <TripRecorderProvider>
            <AppNavigator />
          </TripRecorderProvider>
        </VehicleProvider>
      </DataSyncProvider>
      <AnimatedSplashOverlay />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  message: {
    textAlign: 'center',
  },
});
