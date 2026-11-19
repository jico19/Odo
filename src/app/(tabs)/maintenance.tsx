import { Redirect } from 'expo-router';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMemo, useState } from 'react';

import { AppHeader } from '@/components/app-header';
import { DocumentFormSheet } from '@/components/documents/document-form-sheet';
import { DocumentsPanel } from '@/components/documents/documents-panel';
import { RenewSheet } from '@/components/documents/renew-sheet';
import { FloatingActionButton } from '@/components/floating-action-button';
import { MaintenanceFormSheet } from '@/components/maintenance/maintenance-form-sheet';
import { MaintenanceRow, maintenanceIcon } from '@/components/maintenance/maintenance-row';
import { SegmentedTabs } from '@/components/maintenance/segmented-tabs';
import { Button, EmptyState, ListRow, SkeletonCard, SkeletonLine } from '@/components/ui';
import { MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { useDocuments } from '@/hooks/use-documents';
import { useMaintenanceLogs } from '@/hooks/use-maintenance';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';
import { useVehicle } from '@/hooks/use-vehicle';
import type { Document, NewDocument } from '@/types/document';
import { MAINTENANCE_LABELS, type MaintenanceLog, type NewMaintenanceLog } from '@/types/maintenance';
import { getUpcoming } from '@/utils/calculations';
import { formatCurrency, formatDateShort, formatOdometer } from '@/utils/format';

type Tab = 'upcoming' | 'history' | 'documents';
type Editor = MaintenanceLog | 'new' | null;
type DocumentEditor = Document | 'new' | null;

const TABS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'history', label: 'History' },
  { value: 'documents', label: 'Documents' },
] as const;

export default function MaintenanceScreen() {
  const theme = useTheme();
  const { status: vehicleStatus, vehicle } = useVehicle();
  const { status, logs, error, retry, create, update, remove } = useMaintenanceLogs(vehicle?.id ?? 0);
  const {
    status: documentStatus,
    documents,
    error: documentError,
    retry: retryDocuments,
    create: createDocument,
    update: updateDocument,
    remove: removeDocument,
    renew: renewDocument,
  } = useDocuments();
  const today = useToday();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [editor, setEditor] = useState<Editor>(null);
  const [documentEditor, setDocumentEditor] = useState<DocumentEditor>(null);
  const [renewing, setRenewing] = useState<Document | null>(null);
  const insets = useSafeAreaInsets();
  const fabBottom = Platform.OS === 'web' ? Spacing.six + Spacing.two : insets.bottom + Spacing.two;
  const scrollPadding = fabBottom + Spacing.six + Spacing.three;
  const upcoming = useMemo(
    () => getUpcoming(logs, vehicle?.odometer ?? 0, today),
    [logs, vehicle?.odometer, today]
  );

  if (vehicleStatus === 'loading' || status === 'loading' || documentStatus === 'loading') {
    return <MaintenanceSkeleton />;
  }
  if (vehicle === null) return <Redirect href="/onboarding" />;

  function handleSave(input: NewMaintenanceLog) {
    if (editor === null) return;
    if (editor === 'new') create(input);
    else update(editor.id, input);
    setEditor(null);
  }

  function handleDelete() {
    if (editor === 'new' || editor === null) return;
    try {
      remove(editor.id);
      setEditor(null);
    } catch {
      Alert.alert('Could not delete the record. Try again.');
    }
  }

  function handleSaveDocument(input: Omit<NewDocument, 'vehicleId' | 'renewedFromId'>) {
    if (documentEditor === null) return;
    const shared = { ...input, renewedFromId: null };
    if (documentEditor === 'new') {
      createDocument({
        ...shared,
        vehicleId: input.type === 'license' ? null : vehicle?.id ?? null,
      });
    } else {
      updateDocument(documentEditor.id, { ...shared, vehicleId: documentEditor.vehicleId });
    }
    setDocumentEditor(null);
  }

  function handleDeleteDocument() {
    if (documentEditor === 'new' || documentEditor === null) return;
    try {
      removeDocument(documentEditor.id);
      setDocumentEditor(null);
    } catch {
      Alert.alert('Could not delete the document. Try again.');
    }
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
        <AppHeader title="Maintenance" vehicleName={vehicle.name} odometer={vehicle.odometer} />
        <View style={styles.centered}>
          <Text style={[Typography.title, { color: theme.text }]}>Could not load service records</Text>
          <Text style={[Typography.body, styles.message, { color: theme.textMuted }]}>{error}</Text>
          <Button label="Try again" onPress={retry} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <AppHeader title="Maintenance" vehicleName={vehicle.name} odometer={vehicle.odometer} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <SegmentedTabs options={TABS} value={tab} onChange={setTab} />

        {tab === 'documents' ? (
          <DocumentsPanel
            documents={documents}
            status={documentStatus}
            error={documentError}
            retry={retryDocuments}
            today={today}
            onAdd={() => setDocumentEditor('new')}
            onEdit={setDocumentEditor}
          />
        ) : tab === 'upcoming' ? (
          upcoming.length === 0 ? (
            <EmptyState
              icon="construct-outline"
              message="No service due yet. Add a record with a due km or date."
              actionLabel="Add service"
              onAction={() => setEditor('new')}
            />
          ) : (
            <View style={styles.list}>
              {upcoming.map((log) => (
                <MaintenanceRow
                  key={log.id}
                  log={log}
                  currentOdometer={vehicle.odometer}
                  today={today}
                  onPress={() => setEditor(log)}
                />
              ))}
            </View>
          )
        ) : logs.length === 0 ? (
          <EmptyState
            icon="construct-outline"
            message="No service records yet. Log the last service you did."
            actionLabel="Add service"
            onAction={() => setEditor('new')}
          />
        ) : (
          <View>
            {logs.map((log, index) => (
              <ListRow
                key={log.id}
                icon={maintenanceIcon(log.type)}
                title={MAINTENANCE_LABELS[log.type]}
                subtitle={historySubtitle(log)}
                value={log.cost === null ? undefined : formatCurrency(log.cost)}
                date={formatDateShort(log.date)}
                onPress={() => setEditor(log)}
                divider={index < logs.length - 1}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <FloatingActionButton
        bottom={fabBottom}
        label={tab === 'documents' ? 'Add document' : 'Add service'}
        onPress={() => (tab === 'documents' ? setDocumentEditor('new') : setEditor('new'))}
      />

      {editor !== null ? (
        <MaintenanceFormSheet
          initialLog={editor === 'new' ? null : editor}
          onClose={() => setEditor(null)}
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
            renewDocument(renewing.id, expiryDate);
            setRenewing(null);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function historySubtitle(log: MaintenanceLog): string {
  const parts: string[] = [];
  if (log.diy) parts.push('DIY');
  if (log.odometer !== null) parts.push(`${formatOdometer(log.odometer)} km`);
  if (log.nextDueKm !== null) parts.push(`Due at ${formatOdometer(log.nextDueKm)} km`);
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
  list: {
    gap: Spacing.two,
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
