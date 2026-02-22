
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiIntegrationService } from '@/services/apiIntegrationService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CreditCard, Download, Check, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import PageTransition from '@/components/PageTransition';

const UserBillingPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const result = await apiIntegrationService.getUserBillingData(user.id);
        setData(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleDownload = async (id) => {
    toast({ title: "Generating invoice..." });
    await apiIntegrationService.downloadInvoice(id);
    toast({ title: "Invoice Downloaded", description: "Your invoice has been saved." });
  };

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
        <p className="text-gray-500 mb-8">Manage your plan, payment methods and billing history.</p>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Current Plan Card */}
            <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-800 border-indigo-100 dark:border-indigo-900/50">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">Current Subscription</CardTitle>
                    <CardDescription>You are currently on the <span className="font-semibold text-indigo-600">{data?.plan || 'Free'}</span> plan.</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2 mb-4">
                   <span className="text-3xl font-bold">{data?.plan === 'Pro Plan' ? '$29.00' : '$0.00'}</span>
                   <span className="text-gray-500">/ month</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                   <Check className="h-4 w-4 text-green-500" />
                   <span>Next billing date: {format(new Date(new Date().setDate(new Date().getDate() + 15)), 'MMM d, yyyy')}</span>
                </div>
              </CardContent>
              <CardFooter className="flex gap-4 border-t bg-white/50 dark:bg-black/20 pt-4">
                <Button>Upgrade Plan</Button>
                <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">Cancel Subscription</Button>
              </CardFooter>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Payment Methods */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data?.methods && data.methods.length > 0 ? (
                      data.methods.map((method) => (
                         <div key={method.id} className="flex items-center gap-3 p-3 border rounded-lg">
                           <div className="h-8 w-10 bg-gray-100 rounded flex items-center justify-center">
                             <CreditCard className="h-4 w-4" />
                           </div>
                           <div className="flex-1">
                             <p className="font-medium text-sm">•••• {method.last4}</p>
                             <p className="text-xs text-gray-500">Expires {method.expiryDate}</p>
                           </div>
                         </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">No payment methods saved.</p>
                    )}
                    <Button variant="outline" className="w-full text-xs">
                      + Add New Card
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Billing History */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Billing History</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.invoices && data.invoices.length > 0 ? (
                        data.invoices.map((inv) => (
                          <TableRow key={inv.id}>
                            <TableCell>{format(new Date(inv.date), 'MMM d, yyyy')}</TableCell>
                            <TableCell>${inv.amount.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">{inv.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleDownload(inv.id)}>
                                <Download className="h-4 w-4 text-gray-400 hover:text-gray-900" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                             No billing history available.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default UserBillingPage;
