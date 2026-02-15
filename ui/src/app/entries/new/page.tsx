import { api } from '@/lib/api';
import EntryForm from '@/components/EntryForm';

export default function NewEntryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Entry</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <EntryForm
          onSubmit={async (data) => {
            await api.createEntry(data);
          }}
          submitLabel="Create Entry"
        />
      </div>
    </div>
  );
}
