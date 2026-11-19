import { Redirect } from 'expo-router';

import { useVehicle } from '@/hooks/use-vehicle';

export default function EntryScreen() {
  const { status, vehicle } = useVehicle();

  if (status === 'loading') return null;
  if (vehicle === null) return <Redirect href="/onboarding" />;

  return <Redirect href="/dashboard" />;
}
