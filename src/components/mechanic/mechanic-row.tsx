import { StyleSheet } from 'react-native';

import { ListRow, PhotoPreview } from '@/components/ui';
import { Radius } from '@/constants/theme';
import type { MechanicVisit } from '@/types/mechanic';
import { formatCurrency, formatDateShort } from '@/utils/format';

type MechanicRowProps = {
  visit: MechanicVisit;
  onPress: () => void;
  divider?: boolean;
};

export function MechanicRow({ visit, onPress, divider }: MechanicRowProps) {
  const details = [visit.workDone].filter((part) => part !== null && part !== '');

  return (
    <ListRow
      icon="construct-outline"
      title={visit.shop?.trim() || 'Unspecified shop'}
      subtitle={details.join(' · ')}
      value={visit.cost === null ? undefined : formatCurrency(visit.cost)}
      date={formatDateShort(visit.date)}
      accessory={
        visit.receiptUri === null ? undefined : (
          <PhotoPreview uri={visit.receiptUri} label="receipt" style={styles.receipt} />
        )
      }
      onPress={onPress}
      divider={divider}
    />
  );
}

const styles = StyleSheet.create({
  receipt: {
    width: 36,
    height: 36,
    borderRadius: Radius.control,
  },
});
