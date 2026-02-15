import { api } from '@/lib/api';
import EditEntryClient from '@/components/EditEntryClient';
import { notFound } from 'next/navigation';

export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entryId = parseInt(id, 10);

  if (isNaN(entryId)) {
    notFound();
  }

  let entry;
  try {
    entry = await api.getEntry(entryId);
  } catch (error) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Entry</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <EditEntryClient entry={entry} />
      </div>
    </div>
  );
}
