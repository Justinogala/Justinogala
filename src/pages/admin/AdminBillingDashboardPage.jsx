
import React from 'react';
import { Helmet } from 'react-helmet';
import { DollarSign, Users, CreditCard, TrendingUp, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';

const AdminBillingDashboardPage = () => {
  // Mock Data
  const stats = [
    { title: 'Total Revenue', value: '$12,450', change: '+12%', icon: DollarSign, color: 'text-green-600' },
    { title: 'Active Subscriptions', value: '142', change: '+5%', icon: Users, color: 'text-indigo-600' },
    { title: 'MRR', value: '$3,850', change: '+8%', icon: TrendingUp, color: 'text-blue-600' },
    { title: 'Failed Payments', value: '4', change: '-2%', icon: AlertCircle, color: 'text-red-600' },
  ];

  const recentTransactions = [
    { id: 1, user: 'Alice Smith', plan: 'Pro', amount: 29.00, date: '2026-02-15', status: 'paid' },
    { id: 2, user: 'Bob Jones', plan: 'Enterprise', amount: 99.00, date: '2026-02-14', status: 'paid' },
    { id: 3, user: 'Charlie Day', plan: 'Pro', amount: 29.00, date: '2026-02-14', status: 'failed' },
    { id: 4, user: 'Diana Prince', plan: 'Pro', amount: 29.00, date: '2026-02-13', status: 'paid' },
    { id: 5, user: 'Evan Wright', plan: 'Enterprise', amount: 990.00, date: '2026-02-12', status: 'paid' },
  ];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <Helmet>
        <title>Billing Dashboard | Admin</title>
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing Overview</h1>
          <p className="text-gray-500">Monitor revenue, subscriptions, and financial health.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" /> Export Report
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700">Manage Plans</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-l-4 border-l-indigo-500 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                <span className={`text-xs font-medium ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change} from last month
                </span>
              </div>
              <div className={`p-3 rounded-full bg-gray-50 dark:bg-slate-800 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Transactions */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest payments from all users</CardDescription>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Search user..." className="w-[200px] h-9" />
                <Select defaultValue="all">
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{tx.user}</TableCell>
                      <TableCell><Badge variant="outline">{tx.plan}</Badge></TableCell>
                      <TableCell>{tx.date}</TableCell>
                      <TableCell>${tx.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={tx.status === 'paid' ? 'success' : 'destructive'} 
                           className={tx.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Details</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Failed Payments / Alerts */}
        <div className="space-y-6">
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Action Required
              </CardTitle>
              <CardDescription>Failed payments needing attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentTransactions.filter(t => t.status === 'failed').map(tx => (
                <div key={tx.id} className="bg-white p-4 rounded-lg shadow-sm border border-red-100 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{tx.user}</p>
                    <p className="text-sm text-red-600">Failed: ${tx.amount}</p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs">Retry</Button>
                </div>
              ))}
              {recentTransactions.filter(t => t.status === 'failed').length === 0 && (
                 <p className="text-sm text-gray-500">No failed payments requiring action.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
               <CardTitle>Plan Distribution</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                     <span>Free Tier</span>
                     <span className="font-bold">65%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                     <div className="bg-gray-400 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                     <span>Pro Tier</span>
                     <span className="font-bold">25%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                     <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                     <span>Enterprise</span>
                     <span className="font-bold">10%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                     <div className="bg-purple-600 h-2 rounded-full" style={{ width: '10%' }}></div>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default AdminBillingDashboardPage;
