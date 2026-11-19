import { ListRow, StatusChip, type IconName } from '@/components/ui';
import { documentChip, daysLeftLabel, getDocumentStatus } from '@/utils/calculations';
import { DOCUMENT_LABELS, type Document, type DocumentType } from '@/types/document';
import { formatDateShort } from '@/utils/format';

const TYPE_ICONS: Record<DocumentType, IconName> = {
  registration: 'card-outline',
  license: 'person-outline',
  insurance: 'shield-outline',
  other: 'document-outline',
};

export function documentIcon(type: DocumentType): IconName {
  return TYPE_ICONS[type];
}

type DocumentRowProps = {
  document: Document;
  today: string;
  onPress: () => void;
  divider?: boolean;
};

export function DocumentRow({ document, today, onPress, divider }: DocumentRowProps) {
  const due = getDocumentStatus(document.expiryDate, today);
  const chip = documentChip(due.status);

  return (
    <ListRow
      icon={documentIcon(document.type)}
      title={DOCUMENT_LABELS[document.type]}
      subtitle={document.name ?? undefined}
      badge={<StatusChip tone={chip.tone} label={chip.label} />}
      value={daysLeftLabel(due.daysLeft)}
      date={formatDateShort(document.expiryDate)}
      onPress={onPress}
      divider={divider}
    />
  );
}
