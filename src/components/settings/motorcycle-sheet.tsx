import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DrivetrainStep } from '@/components/onboarding/drivetrain-step';
import { BottomSheet, Button, Input } from '@/components/ui';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { TransmissionType } from '@/types/pms';
import type { Vehicle } from '@/types/vehicle';

type MotorcycleSheetProps = {
  vehicle: Vehicle;
  onClose: () => void;
  onSave: (input: {
    name: string;
    plate: string | null;
    transmissionType: TransmissionType;
    isLiquidCooled: boolean;
  }) => void;
};

export function MotorcycleSheet({ vehicle, onClose, onSave }: MotorcycleSheetProps) {
  const theme = useTheme();
  const [name, setName] = useState(vehicle.name);
  const [plate, setPlate] = useState(vehicle.plate ?? '');
  const [transmission, setTransmission] = useState<TransmissionType | ''>(
    vehicle.transmissionType ?? ''
  );
  const [isLiquidCooled, setIsLiquidCooled] = useState(vehicle.isLiquidCooled);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    if (name.trim() === '') {
      setError('Enter a name for your bike.');
      return;
    }
    if (transmission === '') {
      setError('Choose a transmission type.');
      return;
    }
    onSave({
      name: name.trim(),
      plate: plate.trim() === '' ? null : plate.trim(),
      transmissionType: transmission,
      isLiquidCooled,
    });
  }

  return (
    <BottomSheet onClose={onClose} dismissLabel="Close motorcycle editor" title="My motorcycle">
      <Input
        label="Name"
        value={name}
        onChangeText={(value) => {
          setName(value);
          setError(null);
        }}
        placeholder="e.g. Ninja 400"
        error={error !== null && name.trim() === '' ? error : undefined}
      />
      <Input
        label="Plate (optional)"
        value={plate}
        onChangeText={setPlate}
        placeholder="e.g. AB 1234"
      />
      <DrivetrainStep
        transmission={transmission}
        isLiquidCooled={isLiquidCooled}
        error={error !== null && transmission === '' ? error : undefined}
        onTransmission={(value) => {
          setTransmission(value);
          setError(null);
        }}
        onLiquidCooled={setIsLiquidCooled}
      />
      <Text style={[Typography.body, styles.note, { color: theme.textMuted }]}>
        Changing the engine setup only updates the checklist. Service history and saved intervals
        are never rewritten.
      </Text>
      <View style={styles.actions}>
        <Button label="Save" onPress={handleSave} fullWidth />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  note: {
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
