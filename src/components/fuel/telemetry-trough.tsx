import { StyleSheet, Text, View } from 'react-native';

import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency, formatNumber } from '@/utils/format';

export type TelemetryTroughData = {
  lastFillCost: number | null;
  lastFillLiters: number | null;
  costPerKm: number | null;
  monthlySpend: number;
  monthlyLiters: number;
};

type TelemetryTroughProps = {
  data: TelemetryTroughData;
};

type CellProps = {
  label: string;
  value: string;
  detail: string;
  highlight?: boolean;
};

function TroughCell({ label, value, detail, highlight = false }: CellProps) {
  const theme = useTheme();

  return (
    <View style={styles.cell}>
      <Text style={[Typography.label, styles.label, { color: theme.textMuted }]} numberOfLines={1}>
        {label}
      </Text>
      <Text
        style={[
          Typography.mono,
          styles.value,
          { color: highlight ? theme.accentInk : theme.text },
        ]}
        numberOfLines={1}>
        {value}
      </Text>
      <Text style={[Typography.label, styles.detail, { color: theme.textMuted }]} numberOfLines={1}>
        {detail}
      </Text>
    </View>
  );
}

export function TelemetryTrough({ data }: TelemetryTroughProps) {
  return (
    <View style={styles.trough}>
      <TroughCell
        label="Last fill"
        value={data.lastFillCost === null ? '—' : formatCurrency(data.lastFillCost)}
        detail={data.lastFillLiters === null ? 'No fills yet' : `${formatNumber(data.lastFillLiters, 1)} L`}
      />
      <TroughCell
        label="Avg cost"
        value={data.costPerKm === null ? '—' : formatCurrency(data.costPerKm)}
        detail="per km"
      />
      <TroughCell
        label="Monthly fuel"
        value={formatCurrency(data.monthlySpend)}
        detail={`${formatNumber(data.monthlyLiters, 1)} L total`}
        highlight
      />
    </View>
  );
}

const styles = StyleSheet.create({
  trough: {
    width: '100%',
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: 12,
  },
  cell: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 15,
  },
  detail: {
    fontSize: 10,
    letterSpacing: 0,
    textTransform: 'none',
  },
});
