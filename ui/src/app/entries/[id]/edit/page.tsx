'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, TimeEntry } from '@/lib/api';
import EntryForm from '@/components/EntryForm';

export default function EditEntryPage() {
  const params = useParams();
  const router = useRouter();
  const [entry, setEntry] = useState<TimeEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEntry = async () => {
      const id = Number(params.id);
      if (isNaN(id)) {
        setError('Invalid entry ID');
        setLoading(false);
        return;
      }
      try {
        const data = await api.getEntry(id);
        setEntry(data);
      } catch (err) {
        setError('Entry not found');
      } finally {
        setLoading(false);
      }
    };
    loadEntry();
  }, [params.id]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading entry...</p>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-6 py-4 rounded-lg">
        <p>{error || 'Entry not found'}</p>
        <button onClick={() => router.push('/entries')} className="mt-2 text-blue-600 hover:underline">← Back to entries</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Entry</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <EntryForm
          initialData={entry}
          onSubmit={async (data) => { await api.updateEntry(entry.id, data); }}
          submitLabel="Update Entry"
        />
      </div>
    </div>
  );
}
