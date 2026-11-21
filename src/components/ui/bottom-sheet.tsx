import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useEffect, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type BottomSheetProps = {
  onClose: () => void;
  children: ReactNode;
  dismissLabel?: string;
  title?: string;
  variant?: 'form' | 'compact';
};

const ANIMATION_DURATION = 220;

export function BottomSheet({
  onClose,
  children,
  dismissLabel = 'Close sheet',
  title,
  variant = 'form',
}: BottomSheetProps) {
  const theme = useTheme();
  const [backdrop] = useState(() => new Animated.Value(0));
  const [sheet] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let active = true;

    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!active) return;
      if (reduced) {
        backdrop.setValue(1);
        sheet.setValue(1);
        return;
      }

      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sheet, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });

    return () => {
      active = false;
    };
  }, [backdrop, sheet]);

  const sheetOpacity = sheet.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const sheetTranslateY = sheet.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  return (
    <Modal
      visible
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
      accessibilityViewIsModal>
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
          <Pressable style={styles.dismissArea} onPress={onClose} accessible={false} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: sheetOpacity,
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}>
          <View style={styles.header}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
            <View style={styles.headerRow}>
              {variant === 'form' && title !== undefined ? (
                <Text style={[Typography.title, styles.title, { color: theme.text }]}>{title}</Text>
              ) : null}
              <View style={styles.closeSlot}>
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel={dismissLabel}
                  hitSlop={8}
                  style={styles.closeButton}>
                  <Ionicons name="close-outline" size={22} color={theme.textMuted} accessible={false} />
                </Pressable>
              </View>
            </View>
          </View>

          <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: Radius.card,
    borderTopRightRadius: Radius.card,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  header: {
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: Radius.pill,
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    gap: Spacing.two,
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  closeSlot: {
    marginLeft: 'auto',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    flexShrink: 1,
    minHeight: 0,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
});
