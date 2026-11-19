import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  type TabTriggerSlotProps,
  type TabListProps,
} from 'expo-router/ui';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="dashboard" href="/dashboard" asChild>
            <TabButton>Dashboard</TabButton>
          </TabTrigger>
          <TabTrigger name="fuel" href="/fuel" asChild>
            <TabButton>Fuel</TabButton>
          </TabTrigger>
          <TabTrigger name="maintenance" href="/maintenance" asChild>
            <TabButton>Maintenance</TabButton>
          </TabTrigger>
          <TabTrigger name="mechanic" href="/mechanic" asChild>
            <TabButton>Mechanic</TabButton>
          </TabTrigger>
          <TabTrigger name="trips" href="/trips" asChild>
            <TabButton>Trips</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ref, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable
      {...props}
      ref={ref as ComponentProps<typeof Pressable>['ref']}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'accentSoft' : 'surfaceAlt'}
        style={styles.tabButtonView}>
        <ThemedText type="small" themeColor={isFocused ? 'text' : 'textMuted'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="surfaceAlt" style={styles.innerContainer}>
        <ThemedText type="smallBold" style={styles.brandText}>
          Odo
        </ThemedText>
        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
