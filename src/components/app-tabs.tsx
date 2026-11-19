import { NativeTabs } from 'expo-router/native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.accent}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="dashboard">
        <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="speedometer" md="speed" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="fuel">
        <NativeTabs.Trigger.Label>Fuel</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="fuelpump.fill" md="local_gas_station" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="maintenance">
        <NativeTabs.Trigger.Label>Maintenance</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="wrench.fill" md="build" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="mechanic">
        <NativeTabs.Trigger.Label>Mechanic</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="hammer.fill" md="handyman" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="trips">
        <NativeTabs.Trigger.Label>Trips</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="map.fill" md="map" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
