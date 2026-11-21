import {
  AndroidImportance,
  IosAuthorizationStatus,
  SchedulableTriggerInputTypes,
  cancelScheduledNotificationAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
} from 'expo-notifications';
import { Platform } from 'react-native';

import type { Document } from '@/types/document';
import { DOCUMENT_LABELS } from '@/types/document';
import { MAINTENANCE_LABELS, type MaintenanceLog } from '@/types/maintenance';
import type { PmsItem } from '@/types/pms';
import type { ReminderLeadDays } from '@/types/preferences';
import { daysBetween, getDocumentStatus } from '@/utils/calculations';
import { getPmsDueDate } from '@/utils/pms';

const CHANNEL_ID = 'maintenance-reminders';
const DOCUMENT_CHANNEL_ID = 'document-reminders';
const REMINDER_HOUR = 9;
const DOCUMENT_OFFSETS = [30, 14, 7, 1, 0] as const;
export const PMS_LEAD_OPTIONS = [1, 3, 7] as const;

let configured = false;

function isNative(): boolean {
  return Platform.OS !== 'web';
}

export function setupNotifications(): void {
  if (!isNative() || configured) return;
  configured = true;

  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    // Android 13+ does not show the permission prompt until a channel exists.
    void setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Maintenance reminders',
      importance: AndroidImportance.HIGH,
    }).catch(() => undefined);
    void setNotificationChannelAsync(DOCUMENT_CHANNEL_ID, {
      name: 'Document reminders',
      importance: AndroidImportance.HIGH,
    }).catch(() => undefined);
  }
}

export async function hasNotificationPermission(): Promise<boolean> {
  setupNotifications();
  if (!isNative()) return false;

  try {
    const current = await getPermissionsAsync();
    return current.granted || current.ios?.status === IosAuthorizationStatus.PROVISIONAL;
  } catch {
    return false;
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await hasNotificationPermission();
  if (current) return true;
  if (!isNative()) return false;

  try {
    const next = await requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: false },
    });
    return next.granted || next.ios?.status === IosAuthorizationStatus.PROVISIONAL;
  } catch {
    return false;
  }
}

function identifier(logId: number, kind: 'eve' | 'due'): string {
  return `maintenance-${logId}-${kind}`;
}

function nextReminderTime(dateKey: string, daysOffset: number): Date | null {
  const [year, month, day] = dateKey.split('-').map(Number);
  const trigger = new Date(year, month - 1, day + daysOffset, REMINDER_HOUR, 0, 0, 0);
  return trigger.getTime() > Date.now() ? trigger : null;
}

async function schedule(
  log: MaintenanceLog,
  kind: 'eve' | 'due',
  trigger: Date,
  channelId?: string
): Promise<void> {
  const title =
    kind === 'eve'
      ? `${MAINTENANCE_LABELS[log.type]} tomorrow`
      : `${MAINTENANCE_LABELS[log.type]} due today`;

  try {
    await scheduleNotificationAsync({
      identifier: identifier(log.id, kind),
      content: {
        title,
        body: 'Open Odo to check the service and your odometer.',
        data: { maintenanceLogId: log.id },
      },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: trigger, channelId },
    });
  } catch {
    // A failed reminder must not block saving the maintenance record.
  }
}

export async function cancelMaintenanceReminder(logId: number): Promise<void> {
  if (!isNative()) return;

  try {
    await Promise.all([
      cancelScheduledNotificationAsync(identifier(logId, 'eve')),
      cancelScheduledNotificationAsync(identifier(logId, 'due')),
    ]);
  } catch {
    // Cancelling an already-fired reminder is harmless.
  }
}

export async function syncMaintenanceReminder(log: MaintenanceLog): Promise<void> {
  if (!isNative()) return;
  await cancelMaintenanceReminder(log.id);
  if (log.nextDueDate === null || !(await hasNotificationPermission())) return;

  const eve = nextReminderTime(log.nextDueDate, -1);
  const due = nextReminderTime(log.nextDueDate, 0);
  const channelId = Platform.OS === 'android' ? CHANNEL_ID : undefined;

  if (eve !== null) await schedule(log, 'eve', eve, channelId);
  if (due !== null) await schedule(log, 'due', due, channelId);
}

function documentIdentifier(documentId: number, days: number): string {
  return `document-${documentId}-${days}`;
}

export async function cancelDocumentReminders(documentId: number): Promise<void> {
  if (!isNative()) return;

  try {
    await Promise.all(
      DOCUMENT_OFFSETS.map((days) => cancelScheduledNotificationAsync(documentIdentifier(documentId, days)))
    );
  } catch {
    // Cancelling an already-fired reminder is harmless.
  }
}

export async function syncDocumentReminders(document: Document, today: string): Promise<void> {
  if (!isNative()) return;
  await cancelDocumentReminders(document.id);

  // Superseded and expired documents never get pending reminders.
  if (document.superseded) return;
  if (getDocumentStatus(document.expiryDate, today).status === 'expired') return;
  if (!(await hasNotificationPermission())) return;

  const channelId = Platform.OS === 'android' ? DOCUMENT_CHANNEL_ID : undefined;
  const label = DOCUMENT_LABELS[document.type];

  for (const days of DOCUMENT_OFFSETS) {
    const trigger = nextReminderTime(document.expiryDate, -days);
    if (trigger === null) continue;

    const title = days === 0 ? `${label} expires today` : `${label} expires in ${days} day${days === 1 ? '' : 's'}`;
    try {
      await scheduleNotificationAsync({
        identifier: documentIdentifier(document.id, days),
        content: {
          title,
          body: 'Open Odo to check the document and its renewal date.',
          data: { documentId: document.id },
        },
        trigger: { type: SchedulableTriggerInputTypes.DATE, date: trigger, channelId },
      });
    } catch {
      // A failed reminder must not block saving a document.
    }
  }
}

function pmsIdentifier(itemId: number, offset: number): string {
  return `pms-${itemId}-${offset}`;
}

export async function cancelPmsReminders(itemId: number): Promise<void> {
  if (!isNative()) return;

  try {
    await Promise.all(
      [1, 3, 7, 0].map((offset) =>
        cancelScheduledNotificationAsync(pmsIdentifier(itemId, offset))
      )
    );
  } catch {
    // Cancelling an already-fired reminder is harmless.
  }
}

export async function syncPmsReminder(
  item: PmsItem,
  leadDays: ReminderLeadDays,
  today: string
): Promise<void> {
  if (!isNative()) return;
  await cancelPmsReminders(item.id);

  if (!item.enabled || item.intervalDays === null) return;
  const dueDate = getPmsDueDate(item);
  if (dueDate === null || daysBetween(today, dueDate) < 0) return;
  if (!(await hasNotificationPermission())) return;

  const channelId = Platform.OS === 'android' ? CHANNEL_ID : undefined;

  for (const offset of [leadDays, 0]) {
    const trigger = nextReminderTime(dueDate, -offset);
    if (trigger === null) continue;

    const title =
      offset === 0 ? `${item.label} due today` : `${item.label} due in ${offset} day${offset === 1 ? '' : 's'}`;
    try {
      await scheduleNotificationAsync({
        identifier: pmsIdentifier(item.id, offset),
        content: {
          title,
          body: 'Open Odo to check the service and your odometer.',
          data: { pmsItemId: item.id },
        },
        trigger: { type: SchedulableTriggerInputTypes.DATE, date: trigger, channelId },
      });
    } catch {
      // A failed reminder must not block saving a PMS item.
    }
  }
}
