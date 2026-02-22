
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowRight, Upload, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const UserDashboardTransriptionWidget = () => {
  const navigate = useNavigate();
  
  // Mock data
  const recentTranscriptions = [
    { id: 1, name: 'Q1 Strategy Meeting.mp3', date: '2025-02-14', status: 'completed' },
    { id: 2, name: 'Client Interview - Sarah.wav', date: '2025-02-13', status: 'processing' },
    { id: 3, name: 'Product Brainstorming.m4a', date: '2025-02-10', status: 'completed' },
  ];

  return (
    <Card className="h-full border-l-4 border-l-indigo-500">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
           <div>
             <CardTitle>Recent Transcriptions</CardTitle>
             <CardDescription>Your latest audio processing tasks</CardDescription>
           </div>
           <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400">
             <FileText className="w-5 h-5" />
           </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {recentTranscriptions.length > 0 ? (
          recentTranscriptions.map(item => (
            <div 
              key={item.id} 
              className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
              onClick={() => navigate(`/transcriptions/${item.id}`)}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`p-2 rounded-lg ${item.status === 'completed' ? 'bg-indigo-100 text-indigo-600' : 'bg-yellow-100 text-yellow-600'}`}>
                  {item.status === 'completed' ? <FileText className="w-4 h-4" /> : <Clock className="w-4 h-4 animate-pulse" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.date}</p>
                </div>
              </div>
              <Badge variant={item.status === 'completed' ? 'secondary' : 'outline'} className="text-xs capitalize">
                {item.status}
              </Badge>
            </div>
          ))
        ) : (
           <div className="text-center py-6 text-gray-400">
             <p>No recent transcriptions</p>
           </div>
        )}
      </CardContent>

      <CardFooter className="pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="flex gap-2 w-full">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/transcribe-new')}>
            <Upload className="w-4 h-4 mr-2" /> Upload
          </Button>
          <Button className="flex-1" onClick={() => navigate('/transcriptions')}>
            View All <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default UserDashboardTransriptionWidget;
