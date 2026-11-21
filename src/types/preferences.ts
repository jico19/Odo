export type DistanceUnit = 'km' | 'mi';
export type AppearanceMode = 'system' | 'light' | 'dark';
export type ReminderLeadDays = 1 | 3 | 7;

export type Preferences = {
  distanceUnit: DistanceUnit;
  currency: string;
  appearance: AppearanceMode;
  reminderLeadDays: ReminderLeadDays;
  setupBannerDismissed: boolean;
};

export const PREFERENCE_KEYS: Record<keyof Preferences, string> = {
  distanceUnit: 'distance_unit',
  currency: 'currency',
  appearance: 'appearance',
  reminderLeadDays: 'reminder_lead_days',
  setupBannerDismissed: 'setup_banner_dismissed',
};

export const PREFERENCE_DEFAULTS: Preferences = {
  distanceUnit: 'km',
  currency: 'PHP',
  appearance: 'system',
  reminderLeadDays: 1,
  setupBannerDismissed: false,
};
