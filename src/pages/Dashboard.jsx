
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  FileText, 
  Users, 
  HardDrive, 
  Plus, 
  Upload, 
  ArrowUpRight,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import StorageUsageChart from '@/components/shared/StorageUsageChart';
import UsageDashboard from '@/components/UsageDashboard';

const StatCard = ({ title, value, subtext, icon: Icon, trend }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-6">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
          <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>
      <div className="flex items-end justify-between mt-2">
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        </div>
        {trend && (
          <div className="flex items-center text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
            <ArrowUpRight className="h-3 w-3 mr-1" />
            {trend}
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock data for dashboard
  const recentActivity = [
    { id: 1, type: 'meeting', title: 'Weekly Sync', date: '2 hrs ago', status: 'Completed' },
    { id: 2, type: 'transcription', title: 'Client Interview', date: '5 hrs ago', status: 'Processing' },
    { id: 3, type: 'meeting', title: 'Project Kickoff', date: 'Yesterday', status: 'Completed' },
  ];

  const upcomingMeetings = [
    { id: 101, title: 'Product Review', time: '10:00 AM', date: 'Tomorrow', attendees: 4 },
    { id: 102, title: 'Design Sprint', time: '2:00 PM', date: 'Oct 28', attendees: 6 },
  ];

  return (
    <div className="space-y-12 pb-12">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Here's what's happening with your projects today.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/meetings/new')}>
            <Upload className="w-4 h-4 mr-2" /> Upload
          </Button>
          <Button onClick={() => navigate('/meetings/new')}>
            <Plus className="w-4 h-4 mr-2" /> New Meeting
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Meetings" 
          value="124" 
          subtext="Total recorded time: 48h" 
          icon={Clock} 
          trend="+12%" 
        />
        <StatCard 
          title="Transcriptions" 
          value="85" 
          subtext="98% accuracy rate" 
          icon={FileText} 
          trend="+5%" 
        />
        <StatCard 
          title="Team Members" 
          value="12" 
          subtext="2 pending invites" 
          icon={Users} 
        />
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2 mb-2">
              <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
              <HardDrive className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <StorageUsageChart used={45} total={100} />
          </CardContent>
        </Card>
      </div>

      {/* Usage & Limits Dashboard */}
      <UsageDashboard />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart/Activity Area */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest meetings and transcriptions</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/meetings')}>View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${item.type === 'meeting' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                        {item.type === 'meeting' ? <Clock className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        <p className="text-xs text-gray-500">{item.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={item.status === 'Completed' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

           {/* Activity Chart Placeholder */}
           <Card>
            <CardHeader>
              <CardTitle>Meeting Activity</CardTitle>
              <CardDescription>Overview of meeting frequency over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full bg-gray-50 dark:bg-slate-900 rounded-lg flex items-center justify-center text-gray-400">
                Chart Component Visualization
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Sidebar/Right Column */}
        <div className="space-y-12">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/workspaces')}>
                <Plus className="w-4 h-4 mr-2" /> Create Workspace
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <UserPlus className="w-4 h-4 mr-2" /> Invite Team Member
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Meetings */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex gap-3 items-start border-l-2 border-indigo-500 pl-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{meeting.title}</h4>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        {meeting.date} at {meeting.time}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">{meeting.attendees} users</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
