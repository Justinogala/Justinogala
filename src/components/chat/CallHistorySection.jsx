
import React from 'react';
import { useCallState } from '@/context/CallStateContext';
import CallHistoryItem from './CallHistoryItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History } from 'lucide-react';

const CallHistorySection = () => {
  const { callHistory } = useCallState();

  if (callHistory.length === 0) return null;

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="p-3 bg-gray-50/50 dark:bg-slate-900/50 flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <History className="w-3 h-3" />
        Recent Calls
      </div>
      <ScrollArea className="h-48 w-full p-2">
        <div className="space-y-1">
          {callHistory.map((call) => (
            <CallHistoryItem key={call.id} call={call} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CallHistorySection;
