import { ProjectStats } from '@/lib/api';

interface StatsCardProps {
  stats: ProjectStats;
}

export default function StatsCard({ stats }: StatsCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 capitalize">
        {stats.project}
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Total Hours:</span>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.total_hours.toFixed(1)}h
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Entries:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {stats.total_entries}
          </span>
        </div>
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <div className="flex justify-between py-1">
              <span>First:</span>
              <span>{formatDate(stats.first_entry)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Last:</span>
              <span>{formatDate(stats.last_entry)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
