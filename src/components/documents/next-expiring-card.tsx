import { StyleSheet, Text, View } from 'react-native';

import { StatusChip } from '@/components/ui';
import { LightCardShadow, Radius, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { DOCUMENT_LABELS, type Document } from '@/types/document';
import { daysLeftLabel, documentChip, getDocumentStatus } from '@/utils/calculations';
import { formatDateShort } from '@/utils/format';

type NextExpiringCardProps = {
  document: Document | null;
  today: string;
};

export function NextExpiringCard({ document, today }: NextExpiringCardProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const cardStyle = [
    styles.card,
    scheme === 'light' && LightCardShadow,
    { backgroundColor: theme.surface, borderColor: theme.border },
  ];

  if (document === null) {
    return (
      <View accessible accessibilityLabel="Next expiring document, none added" style={cardStyle}>
        <Text style={[Typography.label, { color: theme.textMuted }]}>Next expiring document</Text>
        <Text style={[Typography.body, styles.empty, { color: theme.textMuted }]}>
          None yet. Add one in Maintenance.
        </Text>
      </View>
    );
  }

  const due = getDocumentStatus(document.expiryDate, today);
  const chip = documentChip(due.status);
  const count = Math.abs(due.daysLeft);
  const label = DOCUMENT_LABELS[document.type];
  const detail = [label, document.name, formatDateShort(document.expiryDate)]
    .filter((part) => part !== null && part !== '')
    .join(' · ');

  return (
    <View
      accessible
      accessibilityLabel={`Next expiring document, ${label}, expires ${formatDateShort(document.expiryDate)}, ${daysLeftLabel(due.daysLeft)}`}
      style={cardStyle}>
      <View style={styles.header}>
        <Text style={[Typography.label, { color: theme.textMuted }]}>Next expiring document</Text>
        <StatusChip tone={chip.tone} label={chip.label} />
      </View>
      <View style={styles.valueRow}>
        <Text style={[Typography.display, styles.value, { color: theme.text }]}>{count}</Text>
        <Text style={[Typography.mono, { color: theme.textMuted }]}>
          {count === 1 ? 'day' : 'days'}
          {due.daysLeft < 0 ? ' overdue' : ''}
        </Text>
      </View>
      <Text style={[Typography.body, styles.detail, { color: theme.textMuted }]}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  value: {
    flexShrink: 1,
  },
  detail: {
    marginTop: Spacing.two,
  },
  empty: {
    marginTop: Spacing.three,
  },
});
