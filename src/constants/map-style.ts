import type { MapStyleElement } from 'react-native-maps';

import { Colors } from './theme';

export const DARK_MAP_STYLE: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: Colors.dark.surface }] },
  { elementType: 'labels.text.fill', stylers: [{ color: Colors.dark.textMuted }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: Colors.dark.background }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: Colors.dark.border }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: Colors.dark.text }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: Colors.dark.background }] },
];
