import '@/global.css';

import { Platform, type TextStyle } from 'react-native';

export const Colors = {
  light: {
    background: '#F4F7F5',
    surface: '#FFFFFF',
    surfaceAlt: '#EAF0EC',
    border: '#D5DFD9',
    text: '#0F1A14',
    textMuted: '#5B6E63',
    accent: '#16A34A',
    accentSoft: '#16A34A1F',
    onAccent: '#FFFFFF',
    warning: '#D97706',
    danger: '#DC2626',
    warningSoft: '#D977061F',
    dangerSoft: '#DC26261F',
    accentInk: '#166534',
    warningInk: '#92400E',
    dangerInk: '#B91C1C',
  },
  dark: {
    background: '#0B0F0D',
    surface: '#131A16',
    surfaceAlt: '#1B2420',
    border: '#26322C',
    text: '#E8F1EC',
    textMuted: '#8FA398',
    accent: '#22C55E',
    accentSoft: '#22C55E26',
    onAccent: '#04130A',
    warning: '#F59E0B',
    danger: '#EF4444',
    warningSoft: '#F59E0B26',
    dangerSoft: '#EF444426',
    accentInk: '#22C55E',
    warningInk: '#F59E0B',
    dangerInk: '#F87171',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type AppTheme = (typeof Colors)[keyof typeof Colors];

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  md: 12,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Typography = {
  display: { fontSize: 40, fontWeight: '700', lineHeight: 48, fontVariant: ['tabular-nums'] },
  title: { fontSize: 22, fontWeight: '600', lineHeight: 28 },
  heading: { fontSize: 17, fontWeight: '600', lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 21 },
  label: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  mono: { fontSize: 15, fontWeight: '500', lineHeight: 20, fontVariant: ['tabular-nums'] },
} satisfies Record<string, TextStyle>;

export const Radius = {
  card: 16,
  control: 12,
  pill: 999,
} as const;

export const ControlHeight = 48;

export const LightCardShadow = Platform.select({
  ios: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  android: { elevation: 2 },
  default: {},
});

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
