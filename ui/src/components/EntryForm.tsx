'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CreateEntryData, TimeEntry } from '@/lib/api';

interface EntryFormProps {
  initialData?: TimeEntry;
  onSubmit: (data: CreateEntryData) => Promise<void>;
  submitLabel?: string;
}

export default function EntryForm({
  initialData,
  onSubmit,
  submitLabel = 'Create Entry',
}: EntryFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateEntryData>({
    project: initialData?.project || '',
    start_time: initialData?.start_time ? new Date(initialData.start_time).toISOString().slice(0, 16) : '',
    end_time: initialData?.end_time ? new Date(initialData.end_time).toISOString().slice(0, 16) : '',
    notes: initialData?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side time validation
    if (new Date(formData.end_time) <= new Date(formData.start_time)) {
      setError('End time must be after start time');
      setLoading(false);
      return;
    }

    try {
      await onSubmit(formData);
      router.push('/entries');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="project" className="block text-sm font-medium mb-2">
          Project <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="project"
          required
          value={formData.project}
          onChange={(e) => setFormData({ ...formData, project: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="e.g., Website Redesign"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="start_time" className="block text-sm font-medium mb-2">
            Start Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            id="start_time"
            required
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="end_time" className="block text-sm font-medium mb-2">
            End Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            id="end_time"
            required
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium mb-2">
          Notes
        </label>
        <textarea
          id="notes"
          rows={4}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="Optional notes about this time entry..."
        />
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Submitting...' : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
