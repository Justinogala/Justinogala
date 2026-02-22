
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Zap, UserPlus, CreditCard, Ticket, MessageSquare, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const QuickActionsSection = () => {
  const recentUsers = [
    { id: 1, name: 'Alice Freeman', email: 'alice@example.com', initials: 'AF', time: '2 mins ago' },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', initials: 'BS', time: '15 mins ago' },
    { id: 3, name: 'Charlie Kim', email: 'charlie@example.com', initials: 'CK', time: '1 hour ago' },
  ];

  const recentTransactions = [
    { id: 1, amount: '$29.00', user: 'Alice Freeman', status: 'Success', time: '5 mins ago' },
    { id: 2, amount: '$99.00', user: 'TechCorp Inc.', status: 'Pending', time: '1 hour ago' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Quick Actions */}
      <Card className="rounded-xl shadow-lg border-none bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Zap className="w-5 h-5" /> Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Link to="/admin/users">
            <Button variant="secondary" className="w-full justify-start h-auto py-3 bg-white/10 hover:bg-white/20 text-white border-none">
              <UserPlus className="w-4 h-4 mr-2" /> Add User
            </Button>
          </Link>
          <Link to="/admin/billing">
            <Button variant="secondary" className="w-full justify-start h-auto py-3 bg-white/10 hover:bg-white/20 text-white border-none">
              <CreditCard className="w-4 h-4 mr-2" /> Invoices
            </Button>
          </Link>
          <Link to="/admin/tickets">
            <Button variant="secondary" className="w-full justify-start h-auto py-3 bg-white/10 hover:bg-white/20 text-white border-none">
              <Ticket className="w-4 h-4 mr-2" /> Tickets
            </Button>
          </Link>
          <Link to="/admin/messages">
            <Button variant="secondary" className="w-full justify-start h-auto py-3 bg-white/10 hover:bg-white/20 text-white border-none">
              <MessageSquare className="w-4 h-4 mr-2" /> Messages
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Users */}
      <Card className="rounded-xl shadow-lg border-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">New Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300 text-xs">
                      {user.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{user.time}</span>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
              <Link to="/admin/users">View All Users <ChevronRight className="w-3 h-3 ml-1" /></Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="rounded-xl shadow-lg border-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${tx.status === 'Success' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    {tx.status === 'Success' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">{tx.user}</p>
                    <p className="text-xs text-muted-foreground">{tx.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm">{tx.amount}</span>
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
              <Link to="/admin/billing">View All Transactions <ChevronRight className="w-3 h-3 ml-1" /></Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickActionsSection;
