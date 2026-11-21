import type { IconName } from '@/components/ui';

const PMS_ICONS: Record<string, IconName> = {
  engine_oil: 'water-outline',
  oil_filter: 'funnel-outline',
  gear_oil: 'settings-outline',
  chain_sprocket: 'link-outline',
  clutch_adjustment: 'options-outline',
  cvt_belt_rollers: 'repeat-outline',
  air_filter: 'aperture-outline',
  spark_plug: 'flash-outline',
  brake_pads: 'stop-circle-outline',
  brake_fluid: 'beaker-outline',
  tires: 'disc-outline',
  battery: 'battery-charging-outline',
  coolant: 'thermometer-outline',
};

export function pmsIcon(type: string): IconName {
  return PMS_ICONS[type] ?? 'construct-outline';
}
