import { Redirect } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { FloatingActionButton } from '@/components/floating-action-button';
import { MechanicDetailSheet } from '@/components/mechanic/mechanic-detail-sheet';
import { MechanicFormSheet } from '@/components/mechanic/mechanic-form-sheet';
import { MechanicRow } from '@/components/mechanic/mechanic-row';
import { Button, EmptyState, StatCard } from '@/components/ui';
import { MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useMechanicVisits } from '@/hooks/use-mechanic-visits';
import { useTheme } from '@/hooks/use-theme';
import { useVehicle } from '@/hooks/use-vehicle';
import type { MechanicVisit, NewMechanicVisit } from '@/types/mechanic';
import { getMechanicSpend } from '@/utils/calculations';
import { formatCurrency } from '@/utils/format';

type Editor = MechanicVisit | 'new' | null;

export default function MechanicScreen() {
  const theme = useTheme();
  const { status: vehicleStatus, vehicle } = useVehicle();
  const {
    status,
    visits,
    error,
    retry,
    create,
    update,
    remove,
    links,
    refreshLinks,
    link,
    unlink,
  } = useMechanicVisits(vehicle?.id ?? 0);
  const [editor, setEditor] = useState<Editor>(null);
  const [detail, setDetail] = useState<MechanicVisit | null>(null);
  const insets = useSafeAreaInsets();
  const fabBottom = Platform.OS === 'web' ? Spacing.six + Spacing.two : insets.bottom + Spacing.two;
  const scrollPadding = fabBottom + Spacing.six + Spacing.three;
  const spend = useMemo(() => getMechanicSpend(visits), [visits]);

  if (vehicleStatus === 'loading' || status === 'loading') return <MechanicSkeleton />;
  if (vehicle === null) return <Redirect href="/onboarding" />;

  function handleSave(input: NewMechanicVisit) {
    if (editor === null) return;
    if (editor === 'new') {
      create(input);
    } else {
      const saved = update(editor.id, input);
      setDetail((current) => (current?.id === saved.id ? saved : current));
    }
    setEditor(null);
  }

  function handleDelete() {
    if (editor === 'new' || editor === null) return;
    try {
      remove(editor.id);
      setEditor(null);
      setDetail(null);
    } catch {
      Alert.alert('Could not delete the visit. Try again.');
    }
  }

  function openDetail(visit: MechanicVisit) {
    refreshLinks(visit.id);
    setDetail(visit);
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.centered}>
          <Text style={[Typography.title, { color: theme.text }]}>Could not load visits</Text>
          <Text style={[Typography.body, styles.message, { color: theme.textMuted }]}>{error}</Text>
          <Button label="Try again" onPress={retry} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <Text style={[Typography.title, { color: theme.text }]}>Mechanic</Text>

        <StatCard
          label="Spent on visits"
          value={formatCurrency(spend.total)}
          accessibilityLabel={`Spent on mechanic visits ${formatCurrency(spend.total)}`}
        />
        <Text style={[Typography.body, { color: theme.textMuted }]}>
          {visits.length} visit{visits.length === 1 ? '' : 's'} across {spend.byShop.length} shop
          {spend.byShop.length === 1 ? '' : 's'}
        </Text>

        {visits.length === 0 ? (
          <EmptyState
            icon="construct-outline"
            message="Log a shop visit to keep its receipt and work history here."
            actionLabel="Add visit"
            onAction={() => setEditor('new')}
          />
        ) : (
          <View>
            {visits.map((visit, index) => (
              <MechanicRow
                key={visit.id}
                visit={visit}
                onPress={() => openDetail(visit)}
                divider={index < visits.length - 1}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <FloatingActionButton bottom={fabBottom} label="Add visit" onPress={() => setEditor('new')} />

      {detail !== null ? (
        <MechanicDetailSheet
          visit={detail}
          linked={links.linked}
          unlinked={links.unlinked}
          onClose={() => setDetail(null)}
          onEdit={() => setEditor(detail)}
          onLink={(logId) => link(logId, detail.id)}
          onUnlink={(logId) => unlink(logId, detail.id)}
        />
      ) : null}

      {editor !== null ? (
        <MechanicFormSheet
          initialVisit={editor === 'new' ? null : editor}
          onClose={() => setEditor(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      ) : null}
    </SafeAreaView>
  );
}

function MechanicSkeleton() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.content}>
        <View style={[styles.skeletonLine, { backgroundColor: theme.surfaceAlt }]} />
        <View style={[styles.skeletonCard, { backgroundColor: theme.surfaceAlt }]} />
        <View style={[styles.skeletonCard, { backgroundColor: theme.surfaceAlt }]} />
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
  skeletonLine: {
    width: '40%',
    height: 20,
    borderRadius: Radius.control,
  },
  skeletonCard: {
    height: 100,
    borderRadius: Radius.card,
  },
});
