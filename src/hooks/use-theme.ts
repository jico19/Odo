import { Colors, type AppTheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme(): AppTheme {
  const scheme = useColorScheme();

  return scheme === 'dark' ? Colors.dark : Colors.light;
}
