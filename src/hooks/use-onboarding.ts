import { useCallback, useMemo, useState } from 'react';

import { localDateKey } from '@/hooks/use-today';
import {
  getTemplateItems,
  newCustomPmsType,
  newItemsFromTemplate,
  pmsItemToDraft,
} from '@/utils/pms';
import { ensureNotificationPermission } from '@/utils/notifications';
import {
  validatePmsItemDraft,
  validateVehicleDraft,
  type VehicleFieldErrors,
} from '@/utils/validation';
import type { NewPmsItem, PmsItemUpdate, TransmissionType } from '@/types/pms';
import type { VehicleDraft } from '@/types/vehicle';

import { useVehicle } from './use-vehicle';

export type OnboardingStep = 1 | 2 | 3 | 4;
export type OnboardingErrors = VehicleFieldErrors & { transmission?: string; pms?: string };

const EMPTY_DRAFT: VehicleDraft = { name: '', plate: '', odometer: '' };

function starterItem(): NewPmsItem {
  return {
    type: newCustomPmsType(),
    label: '',
    intervalKm: 3000,
    intervalDays: 180,
    defaultIntervalKm: null,
    defaultIntervalDays: null,
    enabled: true,
    isCustom: true,
    lastDoneOdometer: null,
    lastDoneDate: null,
    startedOdometer: null,
    startedDate: null,
  };
}

export function useOnboarding() {
  const { status, vehicle, createWithItems } = useVehicle();
  const today = useMemo(() => localDateKey(new Date()), []);
  const [step, setStep] = useState<OnboardingStep>(1);
  const [draft, setDraft] = useState<VehicleDraft>(EMPTY_DRAFT);
  const [transmission, setTransmissionState] = useState<TransmissionType | ''>('');
  const [isLiquidCooled, setIsLiquidCooledState] = useState(false);
  const [items, setItems] = useState<NewPmsItem[]>([]);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [errors, setErrors] = useState<OnboardingErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const applyTemplate = useCallback(
    (
      nextTransmission: TransmissionType | '',
      nextLiquidCooled: boolean,
      current: NewPmsItem[]
    ): NewPmsItem[] => {
      if (nextTransmission === '') return current;
      const odometer = Number(draft.odometer.replace(/,/g, '')) || 0;
      const templates = getTemplateItems(nextTransmission, nextLiquidCooled);

      return [
        ...templates.map((template) => {
          const previous = current.find(
            (item) => item.type === template.key && !item.isCustom
          );
          if (previous !== undefined) {
            return {
              ...previous,
              label: template.label,
              defaultIntervalKm: template.defaultIntervalKm,
              defaultIntervalDays: template.defaultIntervalDays,
              startedOdometer: odometer,
              startedDate: today,
            };
          }
          return newItemsFromTemplate([template], odometer, today)[0] as NewPmsItem;
        }),
        ...current.filter((item) => item.isCustom),
      ];
    },
    [draft.odometer, today]
  );

  const updateDraft = useCallback((field: keyof VehicleDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  }, []);

  const setTransmission = useCallback(
    (value: TransmissionType) => {
      setTransmissionState(value);
      setItems((current) => applyTemplate(value, isLiquidCooled, current));
      setErrors((current) => ({ ...current, transmission: undefined }));
    },
    [applyTemplate, isLiquidCooled]
  );

  const setLiquidCooled = useCallback(
    (value: boolean) => {
      setIsLiquidCooledState(value);
      setItems((current) => applyTemplate(transmission, value, current));
    },
    [applyTemplate, transmission]
  );

  const syncBaseline = useCallback(
    (value: string) => {
      const odometer = Number(value.replace(/,/g, '')) || 0;
      setItems((current) =>
        current.map((item) => ({ ...item, startedOdometer: odometer, startedDate: today }))
      );
    },
    [today]
  );

  const openItemEditor = useCallback((type: string) => setEditingType(type), []);
  const closeItemEditor = useCallback(() => setEditingType(null), []);

  const addCustomItem = useCallback(() => {
    const item = starterItem();
    setItems((current) => [...current, item]);
    setEditingType(item.type);
  }, []);

  const saveItem = useCallback(
    (value: PmsItemUpdate) => {
      if (editingType === null) return;
      setItems((current) =>
        current.map((item) => (item.type === editingType ? { ...item, ...value } : item))
      );
      setEditingType(null);
      setErrors((current) => ({ ...current, pms: undefined }));
    },
    [editingType]
  );

  const resetItem = useCallback(
    (type: string) => {
      setItems((current) =>
        current.map((item) =>
          item.type === type
            ? {
                ...item,
                intervalKm: item.defaultIntervalKm,
                intervalDays: item.defaultIntervalDays,
              }
            : item
        )
      );
    },
    []
  );

  const removeItem = useCallback((type: string) => {
    setItems((current) => current.filter((item) => item.type !== type || !item.isCustom));
    setEditingType(null);
  }, []);

  const validateStep = useCallback((): boolean => {
    if (step === 1) {
      const result = validateVehicleDraft(draft);
      if (!result.ok) {
        setErrors(result.errors);
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (transmission === '') {
        setErrors({ transmission: 'Choose a transmission type.' });
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (items.length === 0) {
        setErrors({ pms: 'Add at least one service item.' });
        return false;
      }
      for (const item of items) {
        const result = validatePmsItemDraft(pmsItemToDraft(item));
        if (!result.ok) {
          setErrors({ pms: `Check the interval for ${item.label || 'your custom item'}.` });
          setEditingType(item.type);
          return false;
        }
      }
    }
    return true;
  }, [draft, items, step, transmission]);

  const next = useCallback(() => {
    if (!validateStep()) return;
    setStep((current) => (Math.min(current + 1, 4) as OnboardingStep));
  }, [validateStep]);

  const back = useCallback(() => {
    setStep((current) => (Math.max(current - 1, 1) as OnboardingStep));
    setErrors({});
  }, []);

  const finish = useCallback(async (): Promise<boolean> => {
    const result = validateVehicleDraft(draft);
    if (!result.ok) {
      setErrors(result.errors);
      setStep(1);
      return false;
    }
    if (transmission === '') {
      setErrors({ transmission: 'Choose a transmission type.' });
      setStep(2);
      return false;
    }

    setSaving(true);
    try {
      createWithItems(
        {
          ...result.value,
          transmissionType: transmission,
          isLiquidCooled,
          onboardingCompleted: true,
        },
        items
      );
      // A denied prompt is fine: intervals still show in the app.
      await ensureNotificationPermission();
      return true;
    } catch (cause: unknown) {
      setFormError(cause instanceof Error ? cause.message : 'Could not finish setup.');
      setSaving(false);
      return false;
    }
  }, [createWithItems, draft, isLiquidCooled, items, transmission]);

  const editingItem = useMemo(
    () => items.find((item) => item.type === editingType) ?? null,
    [editingType, items]
  );

  return {
    status,
    vehicle,
    step,
    draft,
    transmission,
    isLiquidCooled,
    items,
    errors,
    formError,
    saving,
    editingItem,
    updateDraft,
    syncBaseline,
    setTransmission,
    setLiquidCooled,
    openItemEditor,
    closeItemEditor,
    addCustomItem,
    saveItem,
    resetItem,
    removeItem,
    next,
    back,
    finish,
  };
}
