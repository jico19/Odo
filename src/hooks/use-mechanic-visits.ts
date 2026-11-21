import { useCallback, useState } from 'react';

import { ensureDatabase } from '@/db/database';
import {
  deleteMechanicVisit,
  getMechanicVisit,
  insertMechanicVisit,
  linkMaintenanceLogToVisit,
  listMaintenanceLogsForVisit,
  listMechanicVisits,
  listUnlinkedMaintenanceLogs,
  unlinkMaintenanceLogFromVisit,
  updateMechanicVisit,
} from '@/db/queries';
import type { MaintenanceLog } from '@/types/maintenance';
import type { MechanicVisit, NewMechanicVisit } from '@/types/mechanic';
import { deleteQuietly } from '@/utils/app-files';

import { useDataSync, useDatabaseReload } from './use-data-sync';

type VisitStatus = 'loading' | 'ready' | 'error';
type VisitLinks = { linked: MaintenanceLog[]; unlinked: MaintenanceLog[] };

const EMPTY_LINKS: VisitLinks = { linked: [], unlinked: [] };

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export function useMechanicVisits(vehicleId: number) {
  const { notifyDataChanged } = useDataSync();
  const [status, setStatus] = useState<VisitStatus>('loading');
  const [visits, setVisits] = useState<MechanicVisit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<VisitLinks>(EMPTY_LINKS);

  const refresh = useCallback(() => {
    setVisits(listMechanicVisits(vehicleId));
  }, [vehicleId]);

  const load = useCallback(() => {
    let active = true;

    ensureDatabase()
      .then(() => {
        if (!active) return;
        refresh();
        setError(null);
        setStatus('ready');
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(toErrorMessage(cause));
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [refresh]);

  useDatabaseReload(load);

  const refreshLinks = useCallback(
    (visitId: number) => {
      setLinks({
        linked: listMaintenanceLogsForVisit(visitId, vehicleId),
        unlinked: listUnlinkedMaintenanceLogs(vehicleId),
      });
    },
    [vehicleId]
  );

  const create = useCallback(
    (input: NewMechanicVisit) => {
      const created = insertMechanicVisit(vehicleId, input);
      refresh();
      notifyDataChanged();
      return created;
    },
    [notifyDataChanged, refresh, vehicleId]
  );

  const update = useCallback(
    (id: number, input: NewMechanicVisit) => {
      const existing = getMechanicVisit(id);
      const updated = updateMechanicVisit(id, vehicleId, input);
      if (updated === null) throw new Error('Mechanic visit not found.');

      if (existing !== null && input.receiptUri !== existing.receiptUri) {
        void deleteQuietly(existing.receiptUri);
      }
      refresh();
      notifyDataChanged();
      return updated;
    },
    [notifyDataChanged, refresh, vehicleId]
  );

  const remove = useCallback(
    (id: number) => {
      const existing = getMechanicVisit(id);
      deleteMechanicVisit(id, vehicleId);
      if (existing !== null) void deleteQuietly(existing.receiptUri);
      setLinks(EMPTY_LINKS);
      refresh();
      notifyDataChanged();
    },
    [notifyDataChanged, refresh, vehicleId]
  );

  const link = useCallback(
    (logId: number, visitId: number) => {
      linkMaintenanceLogToVisit(logId, visitId, vehicleId);
      refreshLinks(visitId);
      notifyDataChanged();
    },
    [notifyDataChanged, refreshLinks, vehicleId]
  );

  const unlink = useCallback(
    (logId: number, visitId: number) => {
      unlinkMaintenanceLogFromVisit(logId, visitId, vehicleId);
      refreshLinks(visitId);
      notifyDataChanged();
    },
    [notifyDataChanged, refreshLinks, vehicleId]
  );

  const retry = useCallback(() => {
    setStatus('loading');
    void load();
  }, [load]);

  return { status, visits, error, retry, create, update, remove, links, refreshLinks, link, unlink };
}
