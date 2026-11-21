import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type PhotoPreviewProps = {
  uri: string | null;
  label: string;
  style?: StyleProp<ViewStyle>;
  contentFit?: 'cover' | 'contain';
};

const DOUBLE_TAP_MS = 300;
const ZOOM_SCALE = 2;
const ANIMATION_MS = 180;
const MOVE_THRESHOLD = 8;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function PhotoPreview({ uri, label, style, contentFit = 'cover' }: PhotoPreviewProps) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [panResponder, setPanResponder] = useState<ReturnType<typeof PanResponder.create> | null>(
    null
  );
  const [scale] = useState(() => new Animated.Value(1));
  const [offset] = useState(() => new Animated.ValueXY({ x: 0, y: 0 }));
  const offsetValue = useRef({ x: 0, y: 0 });
  const startOffset = useRef({ x: 0, y: 0 });
  const isZoomed = useRef(false);
  const moved = useRef(false);
  const lastTap = useRef(0);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((result) => {
      if (active) setReducedMotion(result);
    });
    return () => {
      active = false;
    };
  }, []);

  const resetZoom = useCallback(() => {
    isZoomed.current = false;
    setZoomed(false);
    offsetValue.current = { x: 0, y: 0 };
    scale.setValue(1);
    offset.setValue({ x: 0, y: 0 });
  }, [offset, scale]);

  const open = useCallback(() => {
    resetZoom();
    setFailed(false);
    setLoading(true);
    setVisible(true);
  }, [resetZoom]);

  const close = useCallback(() => {
    resetZoom();
    setVisible(false);
  }, [resetZoom]);

  const animateZoom = useCallback(
    (next: boolean) => {
      isZoomed.current = next;
      setZoomed(next);

      const target = next ? offsetValue.current : { x: 0, y: 0 };
      if (!next) offsetValue.current = { x: 0, y: 0 };

      if (reducedMotion) {
        scale.setValue(next ? ZOOM_SCALE : 1);
        offset.setValue(target);
        return;
      }

      Animated.parallel([
        Animated.timing(scale, {
          toValue: next ? ZOOM_SCALE : 1,
          duration: ANIMATION_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(offset, {
          toValue: target,
          duration: ANIMATION_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    },
    [offset, reducedMotion, scale]
  );

  useEffect(() => {
    const responder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => isZoomed.current,
      onPanResponderGrant: () => {
        moved.current = false;
        startOffset.current = { ...offsetValue.current };
      },
      onPanResponderMove: (_event, gesture) => {
        if (Math.abs(gesture.dx) + Math.abs(gesture.dy) > MOVE_THRESHOLD) {
          moved.current = true;
        }
        if (!isZoomed.current) return;

        const maxX = Math.max(0, (width * (ZOOM_SCALE - 1)) / 2);
        const maxY = Math.max(0, (height * (ZOOM_SCALE - 1)) / 2);
        const next = {
          x: clamp(startOffset.current.x + gesture.dx, -maxX, maxX),
          y: clamp(startOffset.current.y + gesture.dy, -maxY, maxY),
        };
        offsetValue.current = next;
        offset.setValue(next);
      },
      onPanResponderRelease: () => {
        if (moved.current) return;
        const now = Date.now();
        if (now - lastTap.current < DOUBLE_TAP_MS) {
          lastTap.current = 0;
          animateZoom(!isZoomed.current);
        } else {
          lastTap.current = now;
        }
      },
      onPanResponderTerminate: () => {
        moved.current = true;
        startOffset.current = { ...offsetValue.current };
      },
    });
    setPanResponder(responder);
  }, [animateZoom, height, offset, width]);

  const handleLoadStart = useCallback(() => setLoading(true), []);
  const handleLoadEnd = useCallback(() => setLoading(false), []);
  const handleError = useCallback(() => {
    setFailed(true);
    setLoading(false);
  }, []);

  if (uri === null) return null;

  return (
    <>
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={`View ${label}`}
        hitSlop={8}
        style={[styles.trigger, { borderColor: theme.border }, style]}>
        {failed ? (
          <View style={styles.fallback}>
            <Ionicons name="image-outline" size={22} color={theme.textMuted} accessible={false} />
          </View>
        ) : (
          <Image
            source={{ uri }}
            style={styles.triggerImage}
            contentFit={contentFit}
            accessible={false}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
          />
        )}
        {loading && !failed ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="small" color={theme.textMuted} />
          </View>
        ) : null}
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType={reducedMotion ? 'none' : 'fade'}
        presentationStyle="overFullScreen"
        onRequestClose={close}
        accessibilityViewIsModal>
        <View style={styles.backdrop}>
          <Pressable style={styles.backdropDismiss} onPress={close} accessible={false} />
          <SafeAreaView style={styles.viewer} edges={['top', 'bottom']}>
            <View style={styles.header}>
              <Text style={[Typography.body, styles.viewerLabel]} numberOfLines={1}>
                {label}
              </Text>
              <Pressable
                onPress={close}
                accessibilityRole="button"
                accessibilityLabel={`Close ${label} viewer`}
                hitSlop={8}
                style={styles.closeButton}>
                <Ionicons
                  name="close-outline"
                  size={24}
                  color={Colors.dark.text}
                  accessible={false}
                />
              </Pressable>
            </View>

            <View style={styles.stage}>
              {failed ? (
                <View style={styles.error}>
                  <Ionicons
                    name="image-outline"
                    size={28}
                    color={Colors.dark.textMuted}
                    accessible={false}
                  />
                  <Text style={[Typography.body, styles.errorText]}>
                    This photo could not be loaded.
                  </Text>
                </View>
              ) : (
                <>
                  {loading ? (
                    <View style={styles.stageLoading} pointerEvents="none">
                      <ActivityIndicator size="large" color={Colors.dark.text} />
                    </View>
                  ) : null}
                  <Animated.View
                    {...(panResponder?.panHandlers ?? {})}
                    accessible
                    accessibilityRole="image"
                    accessibilityLabel={label}
                    style={[
                      styles.imageStage,
                      {
                        transform: [
                          { scale },
                          { translateX: offset.x },
                          { translateY: offset.y },
                        ],
                      },
                    ]}>
                    <Image
                      source={{ uri }}
                      style={styles.viewerImage}
                      contentFit="contain"
                      onLoadStart={handleLoadStart}
                      onLoadEnd={handleLoadEnd}
                      onError={handleError}
                    />
                  </Animated.View>
                </>
              )}
            </View>

            <Text style={[Typography.label, styles.hint]}>
              {zoomed ? 'Double-tap to reset' : 'Double-tap to zoom, drag to pan'}
            </Text>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 44,
    height: 44,
    borderRadius: Radius.control,
    borderWidth: 1,
    overflow: 'hidden',
  },
  triggerImage: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.96)',
  },
  backdropDismiss: {
    ...StyleSheet.absoluteFill,
  },
  viewer: {
    flex: 1,
  },
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  viewerLabel: {
    flex: 1,
    color: Colors.dark.text,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stageLoading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageStage: {
    width: '100%',
    height: '100%',
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
  error: {
    gap: Spacing.two,
    alignItems: 'center',
  },
  errorText: {
    color: Colors.dark.textMuted,
    textAlign: 'center',
  },
  hint: {
    color: Colors.dark.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.three,
  },
});
