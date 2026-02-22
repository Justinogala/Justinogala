import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Calendar } from 'lucide-react';
import PageTransition from '@/components/PageTransition';

// Simple bar component since we can't use chart libraries
const SimpleBar = ({ height, label, color = "bg-indigo-500" }) => (
  <div className="flex flex-col items-center gap-2 group flex-1">
    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-t-lg h-48 relative overflow-hidden flex items-end justify-center">
      <div 
        className={`w-4/5 ${color} rounded-t-sm transition-all duration-500 hover:opacity-80`} 
        style={{ height: `${height}%` }} 
      />
      {/* Tooltip */}
      <div className="absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs py-1 px-2 rounded">
        {height}%
      </div>
    </div>
    <span className="text-xs text-gray-500 font-medium">{label}</span>
  </div>
);

const AdminAnalytics = () => {
  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-gray-500 dark:text-gray-400">Deep dive into platform usage metrics.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" /> Last 30 Days
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Download className="w-4 h-4" /> Export Data
            </Button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">$45,231.89</div>
               <p className="text-xs text-green-500 font-medium mt-1">+20.1% from last month</p>
             </CardContent>
          </Card>
          <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-gray-500">Active Subscriptions</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">+2,350</div>
               <p className="text-xs text-green-500 font-medium mt-1">+180.1% from last month</p>
             </CardContent>
          </Card>
          <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-gray-500">Meeting Hours Processed</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">12,234</div>
               <p className="text-xs text-green-500 font-medium mt-1">+19% from last month</p>
             </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>New signups over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2 h-64 pt-4">
                <SimpleBar height={30} label="Jan" />
                <SimpleBar height={45} label="Feb" />
                <SimpleBar height={35} label="Mar" />
                <SimpleBar height={60} label="Apr" />
                <SimpleBar height={75} label="May" />
                <SimpleBar height={90} label="Jun" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage by Plan</CardTitle>
              <CardDescription>Distribution of user subscription tiers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                 {/* CSS Pie Chart simulation */}
                 <div className="w-48 h-48 rounded-full bg-[conic-gradient(at_center,_var(--tw-gradient-stops))] from-indigo-500 via-blue-500 to-green-500 flex items-center justify-center relative shadow-lg">
                    <div className="w-32 h-32 bg-white dark:bg-card rounded-full flex flex-col items-center justify-center absolute z-10">
                       <span className="text-2xl font-bold">Total</span>
                       <span className="text-xs text-gray-500">Distribution</span>
                    </div>
                 </div>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                    <span className="text-sm">Enterprise (30%)</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Pro (45%)</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Free (25%)</span>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminAnalytics;