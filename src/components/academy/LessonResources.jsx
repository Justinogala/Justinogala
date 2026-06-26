import React from 'react';
import { FileText, ExternalLink, Download, Code, Video, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_ICONS = {
  pdf: FileText,
  code: Code,
  video: Video,
  link: Link2,
};

const TYPE_COLORS = {
  pdf: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  code: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  video: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  link: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const LessonResources = ({ resources = [] }) => {
  if (!resources || resources.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4" data-testid="lesson-resources">
      <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
        <Download className="w-3.5 h-3.5 text-violet-500" /> Resources
      </h4>
      <div className="space-y-2">
        {resources.map((r, i) => {
          const Icon = TYPE_ICONS[r.type] || Link2;
          const colorClass = TYPE_COLORS[r.type] || TYPE_COLORS.link;
          return (
            <a
              key={r.id || i}
              href={r.url !== '#' ? r.url : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 dark:border-gray-800 transition-all",
                r.url !== '#' ? "hover:border-violet-200 hover:bg-violet-50/50 dark:hover:bg-violet-900/10 cursor-pointer" : "opacity-60 cursor-default"
              )}
              data-testid={`resource-${r.id || i}`}
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", colorClass)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{r.title}</p>
                <p className="text-[10px] text-gray-400 uppercase">{r.type}</p>
              </div>
              {r.url !== '#' && <ExternalLink className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default LessonResources;
