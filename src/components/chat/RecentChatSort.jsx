
import React from 'react';
import { ArrowUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const RecentChatSort = ({ sortBy, onSortChange }) => {
  const options = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'unread', label: 'Unread Count' },
    { value: 'alphabetical', label: 'Alphabetical' },
  ];

  const currentLabel = options.find(o => o.value === sortBy)?.label || 'Sort By';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 min-w-[140px] justify-between">
          <span className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-gray-500" />
            {currentLabel}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onSortChange(option.value)}
            className="justify-between"
          >
            {option.label}
            {sortBy === option.value && <Check className="h-4 w-4 text-violet-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RecentChatSort;
