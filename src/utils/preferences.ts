import {
  PREFERENCE_DEFAULTS,
  type AppearanceMode,
  type DistanceUnit,
  type Preferences,
  type ReminderLeadDays,
} from '@/types/preferences';

function oneOf<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value !== null && allowed.includes(value as T) ? (value as T) : fallback;
}

export function parseDistanceUnit(value: string | null): DistanceUnit {
  return oneOf(value, ['km', 'mi'], PREFERENCE_DEFAULTS.distanceUnit);
}

export function parseAppearance(value: string | null): AppearanceMode {
  return oneOf(value, ['system', 'light', 'dark'], PREFERENCE_DEFAULTS.appearance);
}

export function parseReminderLeadDays(value: string | null): ReminderLeadDays {
  if (value === '3' || value === '7') return Number(value) as ReminderLeadDays;
  return PREFERENCE_DEFAULTS.reminderLeadDays;
}

export function parseCurrency(value: string | null): string {
  const currency = value?.trim() ?? '';
  return currency.length > 0 ? currency.slice(0, 8) : PREFERENCE_DEFAULTS.currency;
}

export function readPreferences(raw: (key: string) => string | null): Preferences {
  return {
    distanceUnit: parseDistanceUnit(raw('distance_unit')),
    currency: parseCurrency(raw('currency')),
    appearance: parseAppearance(raw('appearance')),
    reminderLeadDays: parseReminderLeadDays(raw('reminder_lead_days')),
    setupBannerDismissed: raw('setup_banner_dismissed') === '1',
  };
}
