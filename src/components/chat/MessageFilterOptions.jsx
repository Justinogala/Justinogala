
import React from 'react';
import { CheckCheck, Clock, User, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';

const MessageFilterOptions = ({ filters, onFilterChange }) => {
  const activeFiltersCount = 
    (filters.status !== 'all' ? 1 : 0) + 
    (filters.role !== 'all' ? 1 : 0) + 
    (filters.timeRange !== 'all' ? 1 : 0);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={filters.status !== 'all' ? "default" : "outline"} 
            size="sm"
            className={filters.status !== 'all' ? "bg-violet-600 hover:bg-violet-700" : ""}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Status
            {filters.status !== 'all' && (
              <Badge variant="secondary" className="ml-2 h-5 px-1 bg-white/20 text-white hover:bg-white/30">
                {filters.status === 'read' ? 'Read' : 'Unread'}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onFilterChange('status', 'all')}>
            All Messages
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilterChange('status', 'unread')}>
            Unread Only
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilterChange('status', 'read')}>
            Read Only
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={filters.role !== 'all' ? "default" : "outline"} 
            size="sm"
            className={filters.role !== 'all' ? "bg-violet-600 hover:bg-violet-700" : ""}
          >
            <User className="w-4 h-4 mr-2" />
            Role
            {filters.role !== 'all' && (
              <Badge variant="secondary" className="ml-2 h-5 px-1 bg-white/20 text-white hover:bg-white/30">
                {filters.role}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Filter by User Role</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onFilterChange('role', 'all')}>All Roles</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilterChange('role', 'admin')}>Admin</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilterChange('role', 'premium')}>Premium</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilterChange('role', 'free')}>Free</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilterChange('role', 'member')}>Member</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={filters.timeRange !== 'all' ? "default" : "outline"} 
            size="sm"
            className={filters.timeRange !== 'all' ? "bg-violet-600 hover:bg-violet-700" : ""}
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            Date
            {filters.timeRange !== 'all' && (
              <Badge variant="secondary" className="ml-2 h-5 px-1 bg-white/20 text-white hover:bg-white/30">
                {filters.timeRange}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Filter by Date</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onFilterChange('timeRange', 'all')}>All Time</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilterChange('timeRange', 'today')}>Today</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilterChange('timeRange', 'week')}>This Week</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilterChange('timeRange', 'month')}>This Month</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {activeFiltersCount > 0 && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onFilterChange('clear')}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          Clear Filters
        </Button>
      )}
    </div>
  );
};

export default MessageFilterOptions;
