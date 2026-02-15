'use client';
import { api, TimeEntry } from '@/lib/api';
import EntryForm from './EntryForm';

export default function EditEntryClient({ entry }: { entry: TimeEntry }) {
  return (
    <EntryForm
      initialData={entry}
      onSubmit={async (data) => { await api.updateEntry(entry.id, data); }}
      submitLabel="Update Entry"
    />
  );
}
