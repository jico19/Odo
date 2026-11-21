import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { DocumentFormSheet } from '@/components/documents/document-form-sheet';
import { DocumentsPanel } from '@/components/documents/documents-panel';
import { RenewSheet } from '@/components/documents/renew-sheet';
import { FloatingActionButton } from '@/components/floating-action-button';
import { MaintenanceFormSheet } from '@/components/maintenance/maintenance-form-sheet';
import { MaintenanceRow, maintenanceIcon } from '@/components/maintenance/maintenance-row';
import { SegmentedTabs } from '@/components/maintenance/segmented-tabs';
import { EditPmsItemSheet } from '@/components/pms/edit-pms-item-sheet';
import { PmsHealthCard } from '@/components/pms/pms-health-card';
import { pmsTone } from '@/components/pms/pms-row';
import { PmsRowMenu } from '@/components/pms/pms-row-menu';
import { Button, EmptyState, Gauge, ListRow, SkeletonCard, SkeletonLine, type StatusTone } from '@/components/ui';
import { MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useDocuments } from '@/hooks/use-documents';
import { useMaintenanceLogs } from '@/hooks/use-maintenance';
import { usePmsItems } from '@/hooks/use-pms-items';
import { usePreferences } from '@/hooks/use-preferences';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';
import { useVehicle } from '@/hooks/use-vehicle';
import type { Document, NewDocument } from '@/types/document';
import type { MaintenanceLog, NewMaintenanceLog } from '@/types/maintenance';
import type { PmsItem, PmsItemWithStatus } from '@/types/pms';
import { formatCurrency, formatDateShort, formatDistance } from '@/utils/format';
import { getPmsProgress, maintenanceLabel, sortPmsItems } from '@/utils/pms';

type Tab = 'upcoming' | 'history' | 'documents';
type Editor = MaintenanceLog | 'new' | null;
type DocumentEditor = Document | 'new' | null;

const TABS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'history', label: 'History' },
  { value: 'documents', label: 'Documents' },
] as const;

function toneForItems(entries: PmsItemWithStatus[]): StatusTone {
  if (entries.some((entry) => entry.status.status === 'overdue')) return 'overdue';
  if (entries.some((entry) => entry.status.status === 'due_soon')) return 'dueSoon';
  return 'ok';
}

export default function MaintenanceScreen() {
  const theme = useTheme();
  const { status: vehicleStatus, vehicle } = useVehicle();
  const maintenance = useMaintenanceLogs(vehicle?.id ?? 0);
  const pms = usePmsItems(vehicle?.id ?? 0);
  const documents = useDocuments();
  const preferences = usePreferences();
  const today = useToday();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<Tab>('upcoming');
  const [editor, setEditor] = useState<Editor>(null);
  const [initialPmsItemId, setInitialPmsItemId] = useState<number | null>(null);
  const [menuItem, setMenuItem] = useState<PmsItem | null>(null);
  const [editingPmsItem, setEditingPmsItem] = useState<PmsItem | null>(null);
  const [documentEditor, setDocumentEditor] = useState<DocumentEditor>(null);
  const [renewing, setRenewing] = useState<Document | null>(null);

  const fabBottom = Platform.OS === 'web' ? Spacing.six + Spacing.two : insets.bottom + Spacing.two;
  const scrollPadding = fabBottom + Spacing.six + Spacing.three;
  const odometer = vehicle?.odometer ?? 0;
  const distanceUnit = preferences.preferences.distanceUnit;
  const enabledItems = useMemo(() => pms.items.filter((item) => item.enabled), [pms.items]);
  const entries = useMemo(
    () => sortPmsItems(enabledItems, odometer, today),
    [enabledItems, odometer, today]
  );
  const nextEntry = entries[0] ?? null;
  const tone = toneForItems(entries);

  if (
    vehicleStatus === 'loading' ||
    maintenance.status === 'loading' ||
    pms.status === 'loading' ||
    documents.status === 'loading' ||
    preferences.status === 'loading'
  ) {
    return <MaintenanceSkeleton />;
  }
  if (vehicle === null) return <Redirect href="/onboarding" />;

  function openNewLog(pmsItemId: number | null = null) {
    setInitialPmsItemId(pmsItemId);
    setEditor('new');
  }

  function handleSave(input: NewMaintenanceLog) {
    if (editor === null) return;
    if (editor === 'new') maintenance.create(input);
    else maintenance.update(editor.id, input);
    setEditor(null);
    setInitialPmsItemId(null);
  }

  function handleDelete() {
    if (editor === 'new' || editor === null) return;
    try {
      maintenance.remove(editor.id);
      setEditor(null);
    } catch {
      Alert.alert('Could not delete the record. Try again.');
    }
  }

  function handleSaveDocument(input: Omit<NewDocument, 'vehicleId' | 'renewedFromId'>) {
    if (documentEditor === null) return;
    const shared = { ...input, renewedFromId: null };
    if (documentEditor === 'new') {
      documents.create({
        ...shared,
        vehicleId: input.type === 'license' ? null : vehicle!.id,
      });
    } else {
      documents.update(documentEditor.id, { ...shared, vehicleId: documentEditor.vehicleId });
    }
    setDocumentEditor(null);
  }

  function handleDeleteDocument() {
    if (documentEditor === 'new' || documentEditor === null) return;
    try {
      documents.remove(documentEditor.id);
      setDocumentEditor(null);
    } catch {
      Alert.alert('Could not delete the document. Try again.');
    }
  }

  function handlePmsError(cause: unknown) {
    Alert.alert('Could not update the checklist', cause instanceof Error ? cause.message : 'Try again.');
  }

  if (maintenance.status === 'error') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
        <AppHeader title="Maintenance" vehicleName={vehicle.name} odometer={vehicle.odometer} />
        <View style={styles.centered}>
          <Text style={[Typography.title, { color: theme.text }]}>Could not load service records</Text>
          <Text style={[Typography.body, styles.message, { color: theme.textMuted }]}>{maintenance.error}</Text>
          <Button label="Try again" onPress={maintenance.retry} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <AppHeader
        title="Maintenance"
        vehicleName={vehicle.name}
        odometer={vehicle.odometer}
        onSettingsPress={() => router.push('/settings')}
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <View>
          <SegmentedTabs options={TABS} value={tab} onChange={setTab} />
        </View>

        {pms.status === 'error' ? (
          <Text style={[Typography.body, { color: theme.dangerInk }]}>{pms.error}</Text>
        ) : null}

        {tab === 'documents' ? (
          <DocumentsPanel
            documents={documents.documents}
            status={documents.status}
            error={documents.error}
            retry={documents.retry}
            today={today}
            onEdit={setDocumentEditor}
          />
        ) : tab === 'history' ? (
          maintenance.logs.length === 0 ? (
            <EmptyState
              icon="construct-outline"
              message="Tap + to log the last service you did."
            />
          ) : (
            <View>
              {maintenance.logs.map((log, index) => (
                <ListRow
                  key={log.id}
                  icon={maintenanceIcon(log.type)}
                  title={maintenanceLabel(log, pms.items)}
                  subtitle={historySubtitle(log, distanceUnit)}
                  value={log.cost === null ? undefined : formatCurrency(log.cost, preferences.preferences.currency)}
                  date={formatDateShort(log.date)}
                  onPress={() => {
                    setInitialPmsItemId(log.pmsItemId ?? null);
                    setEditor(log);
                  }}
                  divider={index < maintenance.logs.length - 1}
                />
              ))}
            </View>
          )
        ) : entries.length === 0 ? (
          <EmptyState
            icon="clipboard-outline"
            message="No service checklist yet. Set your transmission type in Settings to build one."
            actionLabel="Open settings"
            onAction={() => router.push({ pathname: '/settings', params: { section: 'motorcycle' } })}
          />
        ) : (
          <View style={styles.upcoming}>
            <Gauge
              label="NEXT PMS INTERVAL"
              value={primaryRemaining(nextEntry, distanceUnit).value}
              unit={primaryRemaining(nextEntry, distanceUnit).unit}
              progress={progressRatio(nextEntry, odometer, today)}
              tone={pmsTone(nextEntry.status.status)}
              badge={{ label: nextEntry.status.status === 'due_soon' ? 'DUE SOON' : nextEntry.status.status === 'overdue' ? 'OVERDUE' : 'ON TRACK', tone: tone }}
              footer={
                <View style={styles.gaugeFooter}>
                  <View style={styles.footerBlock}>
                    <Text style={[Typography.label, { color: theme.textMuted }]}>Service</Text>
                    <Text style={[Typography.heading, { color: theme.text }]} numberOfLines={1}>
                      {nextEntry.item.label}
                    </Text>
                  </View>
                  <View style={[styles.footerBlock, styles.footerRight]}>
                    <Text style={[Typography.label, { color: theme.textMuted }]}>Current odo</Text>
                    <Text style={[Typography.heading, { color: theme.accentInk }]}>
                      {formatDistance(odometer, distanceUnit, 0)} {distanceUnit}
                    </Text>
                  </View>
                </View>
              }
            />

            <View style={styles.sectionHeader}>
              <Text style={[Typography.heading, { color: theme.text }]}>Component health</Text>
              <Text style={[Typography.label, { color: theme.textMuted }]}>
                {entries.length} monitored
              </Text>
            </View>

            <View style={styles.checklist}>
              {entries.map((entry) => (
                <PmsHealthCard
                  key={entry.item.id}
                  entry={entry}
                  progress={getPmsProgress(entry.item, odometer, today)}
                  distanceUnit={distanceUnit}
                  onEdit={() => setMenuItem(entry.item)}
                  onLog={() => openNewLog(entry.item.id)}
                />
              ))}
            </View>

            {maintenance.logs.length > 0 ? (
              <View style={styles.recent}>
                <Text style={[Typography.label, { color: theme.textMuted }]}>Recent logs</Text>
                {maintenance.logs.slice(0, 3).map((log, index) => (
                  <MaintenanceRow
                    key={log.id}
                    log={log}
                    label={maintenanceLabel(log, pms.items)}
                    currentOdometer={odometer}
                    today={today}
                    onPress={() => {
                      setInitialPmsItemId(log.pmsItemId ?? null);
                      setEditor(log);
                    }}
                  />
                ))}
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      <FloatingActionButton
        bottom={fabBottom}
        label={tab === 'documents' ? 'Add document' : 'Log service'}
        onPress={() =>
          tab === 'documents' ? setDocumentEditor('new') : openNewLog()
        }
      />

      {editor !== null ? (
        <MaintenanceFormSheet
          initialLog={editor === 'new' ? null : editor}
          pmsItems={pms.items}
          initialPmsItemId={initialPmsItemId}
          distanceUnit={distanceUnit}
          currency={preferences.preferences.currency}
          onClose={() => {
            setEditor(null);
            setInitialPmsItemId(null);
          }}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      ) : null}

      {documentEditor !== null ? (
        <DocumentFormSheet
          initialDocument={documentEditor === 'new' ? null : documentEditor}
          onClose={() => setDocumentEditor(null)}
          onSave={handleSaveDocument}
          onDelete={handleDeleteDocument}
          onRenew={() => {
            if (documentEditor === 'new') return;
            setRenewing(documentEditor);
            setDocumentEditor(null);
          }}
        />
      ) : null}

      {renewing !== null ? (
        <RenewSheet
          document={renewing}
          onClose={() => setRenewing(null)}
          onRenew={(expiryDate) => {
            documents.renew(renewing.id, expiryDate);
            setRenewing(null);
          }}
        />
      ) : null}

      {menuItem !== null ? (
        <PmsRowMenu
          item={menuItem}
          distanceUnit={distanceUnit}
          onClose={() => setMenuItem(null)}
          onEdit={() => {
            setEditingPmsItem(menuItem);
            setMenuItem(null);
          }}
          onReset={() => {
            try {
              pms.resetOne(menuItem.id);
            } catch (cause: unknown) {
              handlePmsError(cause);
            }
            setMenuItem(null);
          }}
          onToggle={(enabled) => {
            try {
              pms.setEnabled(menuItem.id, enabled);
            } catch (cause: unknown) {
              handlePmsError(cause);
            }
            setMenuItem(null);
          }}
          onDelete={() => {
            Alert.alert(
              `Delete ${menuItem.label}?`,
              'This custom item will be removed. Past service records stay in history.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    try {
                      pms.remove(menuItem.id);
                    } catch (cause: unknown) {
                      handlePmsError(cause);
                    }
                    setMenuItem(null);
                  },
                },
              ]
            );
          }}
        />
      ) : null}

      {editingPmsItem !== null ? (
        <EditPmsItemSheet
          item={editingPmsItem}
          distanceUnit={distanceUnit}
          onClose={() => setEditingPmsItem(null)}
          onSave={(value) => {
            try {
              pms.update(editingPmsItem.id, value);
              setEditingPmsItem(null);
            } catch (cause: unknown) {
              handlePmsError(cause);
            }
          }}
          onReset={() => {
            try {
              pms.resetOne(editingPmsItem.id);
            } catch (cause: unknown) {
              handlePmsError(cause);
            }
            setEditingPmsItem(null);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function primaryRemaining(entry: PmsItemWithStatus, unit: 'km' | 'mi'): { value: string; unit: string } {
  const { kmLeft, daysLeft } = entry.status;
  if (kmLeft !== null) {
    return {
      value: formatDistance(Math.abs(kmLeft), unit, 0),
      unit: kmLeft < 0 ? `${unit.toUpperCase()} OVERDUE` : `${unit.toUpperCase()} TO GO`,
    };
  }
  if (daysLeft !== null) {
    return {
      value: String(Math.abs(daysLeft)),
      unit: daysLeft < 0 ? 'DAYS OVERDUE' : 'DAYS TO GO',
    };
  }
  return { value: '—', unit: 'NO INTERVAL' };
}

function progressRatio(entry: PmsItemWithStatus, odometer: number, today: string): number {
  const progress = getPmsProgress(entry.item, odometer, today);
  if (progress === null || progress.max <= 0) return 0;
  return Math.min(Math.max(progress.value / progress.max, 0), 1);
}

function historySubtitle(log: MaintenanceLog, unit: 'km' | 'mi'): string {
  const parts: string[] = [];
  if (log.diy) parts.push('DIY');
  if (log.odometer !== null) parts.push(`${formatDistance(log.odometer, unit, 0)} ${unit}`);
  if (log.nextDueKm !== null) parts.push(`Due at ${formatDistance(log.nextDueKm, unit, 0)} ${unit}`);
  else if (log.nextDueDate !== null) parts.push(`Due ${formatDateShort(log.nextDueDate)}`);
  return parts.join(' · ');
}

function MaintenanceSkeleton() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.content}>
        <SkeletonLine />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  healthBanner: {
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.two,
  },
  healthStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: Spacing.four,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
  },
  healthLabel: {
    flexShrink: 0,
  },
  healthValue: {
    flex: 1,
    minWidth: 0,
    fontWeight: '600',
  },
  upcoming: {
    gap: Spacing.three,
  },
  gaugeFooter: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  footerBlock: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  checklist: {
    gap: Spacing.two,
  },
  recent: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  message: {
    textAlign: 'center',
  },
});
