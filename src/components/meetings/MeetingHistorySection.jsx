
import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Download, 
  Share2, 
  Trash2, 
  MoreVertical, 
  Eye, 
  Calendar,
  Clock,
  Users
} from 'lucide-react';
import { format } from 'date-fns';

const MeetingHistorySection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data
  const history = [
    {
      id: 1,
      title: "Q4 Product Strategy",
      date: new Date(2023, 10, 15, 14, 0),
      duration: 55,
      participants: 8,
      status: 'completed',
      hasRecording: true,
      size: '245 MB'
    },
    {
      id: 2,
      title: "Design Review: Mobile App",
      date: new Date(2023, 10, 12, 10, 30),
      duration: 45,
      participants: 4,
      status: 'completed',
      hasRecording: false,
      size: null
    },
    {
      id: 3,
      title: "Weekly Engineering Sync",
      date: new Date(2023, 10, 10, 11, 0),
      duration: 32,
      participants: 12,
      status: 'completed',
      hasRecording: true,
      size: '180 MB'
    },
    {
      id: 4,
      title: "Client Onboarding: Acme Corp",
      date: new Date(2023, 10, 8, 15, 0),
      duration: 60,
      participants: 3,
      status: 'completed',
      hasRecording: true,
      size: '310 MB'
    }
  ];

  const filteredHistory = history.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Past Meetings</h3>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search history..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
              <TableHead className="w-[300px]">Meeting Info</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Recording</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHistory.map((meeting) => (
              <TableRow key={meeting.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <TableCell>
                  <div className="font-medium text-slate-900 dark:text-white">{meeting.title}</div>
                  <div className="text-xs text-slate-500">ID: #{1000 + meeting.id}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(meeting.date, 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <Clock className="w-3 h-3" />
                    {format(meeting.date, 'h:mm a')}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium">
                    {meeting.duration} min
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex -space-x-2">
                    {[...Array(Math.min(meeting.participants, 4))].map((_, i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-bold text-slate-600">
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                    {meeting.participants > 4 && (
                      <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-bold text-slate-500">
                        +{meeting.participants - 4}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {meeting.hasRecording ? (
                    <Badge variant="outline" className="border-red-200 text-red-600 bg-red-50 dark:bg-red-900/20 dark:border-red-900 flex w-fit gap-1 items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      Recorded
                    </Badge>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Not recorded</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" /> View Details
                      </DropdownMenuItem>
                      {meeting.hasRecording && (
                        <>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" /> Download Recording
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share2 className="w-4 h-4 mr-2" /> Share Recording
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem className="text-red-600 focus:text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredHistory.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            <p>No meetings found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingHistorySection;
