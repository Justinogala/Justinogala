
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, UserPlus, Trash2, Settings, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

const getIcon = (action) => {
  if (action.includes('Create') || action.includes('Add')) return UserPlus;
  if (action.includes('Delete') || action.includes('Remove')) return Trash2;
  if (action.includes('Update') || action.includes('Edit')) return Edit;
  if (action.includes('File') || action.includes('Upload')) return FileText;
  return Settings;
};

const ActivityLog = ({ logs = [], className }) => {
  return (
    <ScrollArea className={cn("h-[300px] w-full pr-4", className)}>
      <div className="space-y-4">
        {logs.map((log) => {
          const Icon = getIcon(log.action);
          return (
            <div key={log.id} className="flex gap-4 items-start">
              <div className="mt-1 bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
                <Icon className="h-4 w-4 text-gray-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  <span className="font-semibold">{log.user}</span> {log.action}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(log.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
        {logs.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No activity logs found.</p>
        )}
      </div>
    </ScrollArea>
  );
};

export default ActivityLog;
