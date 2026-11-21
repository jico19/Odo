import { useCallback, useState } from 'react';

import { ensureDatabase } from '@/db/database';
import {
  deleteDocument,
  getDocument,
  insertDocument,
  listDocuments,
  updateDocument,
} from '@/db/queries';
import { localDateKey } from '@/hooks/use-today';
import type { Document, NewDocument } from '@/types/document';
import { deleteQuietly } from '@/utils/app-files';
import { cancelDocumentReminders, syncDocumentReminders } from '@/utils/notifications';

import { useDataSync, useDatabaseReload } from './use-data-sync';

type DocumentStatus = 'loading' | 'ready' | 'error';

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export function useDocuments() {
  const { notifyDataChanged } = useDataSync();
  const [status, setStatus] = useState<DocumentStatus>('loading');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const next = listDocuments();
    setDocuments(next);

    // Recompute reminders on every load so a missed or changed expiry self-heals.
    const today = localDateKey(new Date());
    for (const document of next) void syncDocumentReminders(document, today);
  }, []);

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

  const create = useCallback(
    (input: NewDocument) => {
      const created = insertDocument(input);
      refresh();
      notifyDataChanged();
      return created;
    },
    [notifyDataChanged, refresh]
  );

  const update = useCallback(
    (id: number, input: NewDocument) => {
      const existing = getDocument(id);
      const updated = updateDocument(id, input);
      if (updated === null) throw new Error('Document not found.');

      if (existing !== null && input.photoUri !== existing.photoUri) {
        void deleteQuietly(existing.photoUri);
      }
      refresh();
      notifyDataChanged();
      return updated;
    },
    [notifyDataChanged, refresh]
  );

  const remove = useCallback(
    (id: number) => {
      const existing = getDocument(id);
      deleteDocument(id);
      if (existing !== null) void deleteQuietly(existing.photoUri);
      void cancelDocumentReminders(id);
      refresh();
      notifyDataChanged();
    },
    [notifyDataChanged, refresh]
  );

  const renew = useCallback(
    (id: number, expiryDate: string) => {
      const previous = getDocument(id);
      if (previous === null) throw new Error('Document not found.');

      const created = insertDocument({
        type: previous.type,
        name: previous.name,
        issueDate: null,
        expiryDate,
        cost: null,
        notes: previous.notes,
        photoUri: null,
        vehicleId: previous.vehicleId,
        renewedFromId: previous.id,
      });
      refresh();
      notifyDataChanged();
      return created;
    },
    [notifyDataChanged, refresh]
  );

  const retry = useCallback(() => {
    setStatus('loading');
    void load();
  }, [load]);

  return { status, documents, error, retry, create, update, remove, renew };
}
