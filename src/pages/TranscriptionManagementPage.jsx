
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Plus, FileText, Calendar, 
  MoreHorizontal, Trash2, Edit, ExternalLink, Download 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';

// Note: In a real app this would come from a service/API
const MOCK_DATA = [
  { id: 1, name: 'Marketing Strategy Q1.mp3', date: '2025-02-14', duration: '45:20', status: 'completed', provider: 'AssemblyAI' },
  { id: 2, name: 'Client Feedback - Acme Corp.wav', date: '2025-02-13', duration: '12:05', status: 'completed', provider: 'AssemblyAI' },
  { id: 3, name: 'Engineering Daily Standup.m4a', date: '2025-02-13', duration: '15:00', status: 'processing', provider: 'Google' },
  { id: 4, name: 'Product Roadmap Review.mp3', date: '2025-02-12', duration: '60:00', status: 'failed', provider: 'AssemblyAI' },
  { id: 5, name: 'User Interview 001.mp3', date: '2025-02-10', duration: '32:15', status: 'completed', provider: 'Deepgram' },
];

const TranscriptionManagementPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState(MOCK_DATA);

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this transcription?')) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8">
      <Helmet>
        <title>Manage Transcriptions | Munal</title>
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transcriptions</h1>
          <p className="text-gray-500 mt-2">View and manage your audio processing tasks.</p>
        </div>
        <Button onClick={() => navigate('/transcribe-new')} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" /> New Transcription
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search by file name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/50 cursor-pointer" onClick={() => navigate(`/transcriptions/${item.id}`)}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded text-indigo-600">
                      <FileText className="w-4 h-4" />
                    </div>
                    {item.name}
                  </div>
                </TableCell>
                <TableCell className="text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {item.date}
                  </div>
                </TableCell>
                <TableCell>{item.duration}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{item.provider}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={
                    item.status === 'completed' ? 'success' : 
                    item.status === 'failed' ? 'destructive' : 'secondary'
                  } className="capitalize">
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/transcriptions/${item.id}`)}>
                        <ExternalLink className="w-4 h-4 mr-2" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" /> Export PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default TranscriptionManagementPage;
