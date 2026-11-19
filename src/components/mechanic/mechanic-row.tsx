import { ListRow } from '@/components/ui';
import type { MechanicVisit } from '@/types/mechanic';
import { formatCurrency, formatDateShort } from '@/utils/format';

type MechanicRowProps = {
  visit: MechanicVisit;
  onPress: () => void;
  divider?: boolean;
};

export function MechanicRow({ visit, onPress, divider }: MechanicRowProps) {
  const details = [visit.workDone, visit.receiptUri === null ? null : 'Receipt'].filter(
    (part) => part !== null && part !== ''
  );

  return (
    <ListRow
      icon="construct-outline"
      title={visit.shop?.trim() || 'Unspecified shop'}
      subtitle={details.join(' · ')}
      value={visit.cost === null ? undefined : formatCurrency(visit.cost)}
      date={formatDateShort(visit.date)}
      onPress={onPress}
      divider={divider}
    />
  );
}
