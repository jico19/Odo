import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DocumentRow } from '@/components/documents/document-row';
import { Button, EmptyState } from '@/components/ui';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Document } from '@/types/document';
import { getDocumentStatus } from '@/utils/calculations';

type DocumentsPanelProps = {
  documents: Document[];
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  retry: () => void;
  today: string;
  onAdd: () => void;
  onEdit: (document: Document) => void;
};

function sectionLabel(text: string, theme: { textMuted: string }): ReactNode {
  return (
    <Text style={[Typography.label, styles.sectionTitle, { color: theme.textMuted }]}>{text}</Text>
  );
}

export function DocumentsPanel({
  documents,
  status,
  error,
  retry,
  today,
  onAdd,
  onEdit,
}: DocumentsPanelProps) {
  const theme = useTheme();

  if (status === 'loading') return <DocumentsSkeleton />;

  if (status === 'error') {
    return (
      <View style={styles.centered}>
        <Text style={[Typography.title, { color: theme.text }]}>Could not load documents</Text>
        <Text style={[Typography.body, styles.message, { color: theme.textMuted }]}>{error}</Text>
        <Button label="Try again" onPress={retry} />
      </View>
    );
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        icon="card-outline"
        message="Add your registration to get renewal reminders"
        actionLabel="Add document"
        onAction={onAdd}
      />
    );
  }

  const active = documents
    .filter((document) => !document.superseded && getDocumentStatus(document.expiryDate, today).status !== 'expired')
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
  const history = documents.filter(
    (document) => document.superseded || getDocumentStatus(document.expiryDate, today).status === 'expired'
  );

  return (
    <View style={styles.container}>
      {active.length > 0 ? (
        <>
          {sectionLabel('Active', theme)}
          <View>
            {active.map((document, index) => (
              <DocumentRow
                key={document.id}
                document={document}
                today={today}
                onPress={() => onEdit(document)}
                divider={index < active.length - 1}
              />
            ))}
          </View>
        </>
      ) : null}

      {history.length > 0 ? (
        <>
          {sectionLabel('History', theme)}
          <View>
            {history.map((document, index) => (
              <DocumentRow
                key={document.id}
                document={document}
                today={today}
                onPress={() => onEdit(document)}
                divider={index < history.length - 1}
              />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

function DocumentsSkeleton() {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.skeletonLine, { backgroundColor: theme.surfaceAlt }]} />
      <View style={[styles.skeletonCard, { backgroundColor: theme.surfaceAlt }]} />
      <View style={[styles.skeletonCard, { backgroundColor: theme.surfaceAlt }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  sectionTitle: {
    marginTop: Spacing.two,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.five,
  },
  message: {
    textAlign: 'center',
  },
  skeletonLine: {
    width: '40%',
    height: 20,
    borderRadius: Radius.control,
  },
  skeletonCard: {
    height: 64,
    borderRadius: Radius.control,
  },
});
