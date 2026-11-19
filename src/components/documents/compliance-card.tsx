import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { EmptyState, StatusChip, type IconName } from '@/components/ui';
import { LightCardShadow, Radius, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { DOCUMENT_LABELS, type Document, type DocumentType } from '@/types/document';
import { documentChip, getDocumentStatus } from '@/utils/calculations';
import { formatDateShort } from '@/utils/format';

const ICONS: Record<DocumentType, IconName> = {
  registration: 'document-text-outline',
  license: 'card-outline',
  insurance: 'shield-outline',
  other: 'folder-outline',
};

type ComplianceCardProps = {
  documents: Document[];
  today: string;
  onPress: () => void;
};

export function ComplianceCard({ documents, today, onPress }: ComplianceCardProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const { width } = useWindowDimensions();
  const showDays = width >= 360;
  const active = documents
    .filter((document) => !document.superseded)
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
    .slice(0, 3);

  return (
    <View
      style={[
        styles.card,
        scheme === 'light' && LightCardShadow,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark-outline" size={18} color={theme.text} accessible={false} />
        <Text style={[Typography.heading, styles.headerTitle, { color: theme.text }]}>
          Compliance & Registration
        </Text>
        <Text style={[Typography.label, { color: theme.textMuted }]}>DOCS</Text>
      </View>

      {active.length === 0 ? (
        <EmptyState
          icon="folder-outline"
          message="No documents yet. Add one in Maintenance."
        />
      ) : (
        <View style={styles.rows}>
          {active.map((document) => {
            const due = getDocumentStatus(document.expiryDate, today);
            const chip = documentChip(due.status);
            const daysText =
              due.daysLeft < 0 ? `${Math.abs(due.daysLeft)}D OVERDUE` : `${due.daysLeft}D LEFT`;
            const title = [DOCUMENT_LABELS[document.type], document.name]
              .filter((part): part is string => typeof part === 'string' && part.length > 0)
              .join(' · ');

            return (
              <Pressable
                key={document.id}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel={`${title}, expires ${formatDateShort(document.expiryDate)}, ${chip.label}`}
                style={({ pressed }) => [
                  styles.row,
                  { backgroundColor: theme.surfaceAlt },
                  pressed && styles.pressed,
                ]}>
                <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name={ICONS[document.type]} size={18} color={theme.accentInk} accessible={false} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[Typography.heading, styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
                    {title}
                  </Text>
                  <Text style={[Typography.body, { color: theme.textMuted }]} numberOfLines={1}>
                    Expires {formatDateShort(document.expiryDate)}
                  </Text>
                </View>
                {showDays ? (
                  <Text style={[Typography.label, styles.days, { color: theme.textMuted }]}>
                    {daysText}
                  </Text>
                ) : null}
                <StatusChip tone={chip.tone} label={chip.label} />
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerTitle: {
    flex: 1,
    flexShrink: 1,
  },
  rows: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.control,
    padding: Spacing.two,
    minHeight: 48,
  },
  pressed: {
    opacity: 0.8,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
  },
  rowTitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  days: {
    flexShrink: 0,
  },
});
