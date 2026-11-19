import { Image } from 'expo-image';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, EmptyState, ListRow, StatusChip } from '@/components/ui';
import { MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';
import { MAINTENANCE_LABELS, type MaintenanceLog } from '@/types/maintenance';
import type { MechanicVisit } from '@/types/mechanic';
import { getDueInfo } from '@/utils/calculations';
import { formatCurrency, formatDateShort, formatOdometer } from '@/utils/format';

type MechanicDetailSheetProps = {
  visit: MechanicVisit;
  linked: MaintenanceLog[];
  unlinked: MaintenanceLog[];
  onClose: () => void;
  onEdit: () => void;
  onLink: (logId: number) => void;
  onUnlink: (logId: number) => void;
};

function serviceSubtitle(log: MaintenanceLog): string {
  const parts: string[] = [];
  if (log.odometer !== null) parts.push(`${formatOdometer(log.odometer)} km`);
  if (log.cost !== null) parts.push(formatCurrency(log.cost));
  return parts.join(' · ');
}

export function MechanicDetailSheet({
  visit,
  linked,
  unlinked,
  onClose,
  onEdit,
  onLink,
  onUnlink,
}: MechanicDetailSheetProps) {
  const theme = useTheme();
  const today = useToday();

  return (
    <Modal visible animationType="slide" presentationStyle="overFullScreen" accessibilityViewIsModal>
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View style={styles.heading}>
              <Text style={[Typography.label, { color: theme.textMuted }]}>Mechanic visit</Text>
              <Text style={[Typography.title, { color: theme.text }]}>
                {visit.shop?.trim() || 'Unspecified shop'}
              </Text>
              <Text style={[Typography.body, { color: theme.textMuted }]}>
                {formatDateShort(visit.date)}
                {visit.odometer === null ? '' : ` · ${formatOdometer(visit.odometer)} km`}
              </Text>
            </View>
            <Button label="Close" variant="ghost" onPress={onClose} />
          </View>

          {visit.receiptUri !== null ? (
            <Image
              source={{ uri: visit.receiptUri }}
              style={[styles.receipt, { borderColor: theme.border }]}
              contentFit="contain"
              accessibilityLabel="Visit receipt"
            />
          ) : null}

          <View style={[styles.details, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <DetailLine label="Work done" value={visit.workDone} />
            <DetailLine label="Parts" value={visit.parts} />
            <DetailLine
              label="Cost"
              value={visit.cost === null ? null : formatCurrency(visit.cost)}
            />
          </View>

          <Button label="Edit visit" variant="secondary" onPress={onEdit} />

          <Text style={[Typography.label, styles.sectionTitle, { color: theme.textMuted }]}>
            Linked services
          </Text>
          {linked.length === 0 ? (
            <Text style={[Typography.body, { color: theme.textMuted }]}>
              No services linked to this visit yet.
            </Text>
          ) : (
            <View>
              {linked.map((log) => {
                const due = getDueInfo(log, log.odometer ?? 0, today);
                return (
                  <View key={log.id} style={styles.actionRow}>
                    <View style={styles.actionRowDetails}>
                      <ListRow
                        icon="construct-outline"
                        title={MAINTENANCE_LABELS[log.type]}
                        subtitle={serviceSubtitle(log)}
                        date={formatDateShort(log.date)}
                        badge={<StatusChip tone={due.status} label={due.status === 'ok' ? 'OK' : due.status === 'dueSoon' ? 'DUE SOON' : 'OVERDUE'} />}
                        divider={false}
                      />
                    </View>
                    <Button label="Unlink" variant="ghost" onPress={() => onUnlink(log.id)} />
                  </View>
                );
              })}
            </View>
          )}

          <Text style={[Typography.label, styles.sectionTitle, { color: theme.textMuted }]}>
            Add a service
          </Text>
          {unlinked.length === 0 ? (
            <EmptyState
              icon="clipboard-outline"
              message="All services are already linked or none have been logged."
            />
          ) : (
            <View>
              {unlinked.map((log) => (
                <View key={log.id} style={styles.actionRow}>
                  <View style={styles.actionRowDetails}>
                    <ListRow
                      icon="construct-outline"
                      title={MAINTENANCE_LABELS[log.type]}
                      subtitle={serviceSubtitle(log)}
                      date={formatDateShort(log.date)}
                      divider={false}
                    />
                  </View>
                  <Button label="Link" variant="secondary" onPress={() => onLink(log.id)} />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function DetailLine({ label, value }: { label: string; value: string | null }) {
  const theme = useTheme();
  return (
    <View style={styles.detailLine}>
      <Text style={[Typography.label, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[Typography.body, styles.detailValue, { color: theme.text }]}>
        {value ?? '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  heading: {
    flex: 1,
    gap: Spacing.half,
  },
  receipt: {
    width: '100%',
    height: 240,
    borderRadius: Radius.card,
    borderWidth: 1,
  },
  details: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  detailLine: {
    gap: Spacing.half,
  },
  detailValue: {
    lineHeight: 22,
  },
  sectionTitle: {
    marginTop: Spacing.two,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  actionRowDetails: {
    flex: 1,
  },
});
