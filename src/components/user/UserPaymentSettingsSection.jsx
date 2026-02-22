
import React, { useEffect, useState } from 'react';
import { CreditCard, History, Download, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { paymentGatewayService } from '@/services/paymentGatewayService';
import { paymentTransactionService } from '@/services/paymentTransactionService';

const UserPaymentSettingsSection = () => {
  const [gateways, setGateways] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate user fetching
    setTimeout(() => {
      const allGateways = paymentGatewayService.getGateways();
      setGateways(allGateways.filter(g => g.status === 'active'));
      // Using generic mock transactions since we don't have a specific logged in user context passed here easily
      // In real app, pass currentUserId
      setTransactions(paymentTransactionService.getTransactionHistory()); 
      setLoading(false);
    }, 500);
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Methods
        </CardTitle>
        <CardDescription>Manage your payment preferences and view history</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="methods">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="methods">Available Methods</TabsTrigger>
            <TabsTrigger value="history">Transaction History</TabsTrigger>
          </TabsList>

          <TabsContent value="methods" className="space-y-4">
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : gateways.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
                No active payment methods available at this time.
              </div>
            ) : (
              gateways.map(gw => (
                <div key={gw.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded p-2 border flex items-center justify-center">
                      <img src={gw.logo} alt={gw.name} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{gw.name}</h4>
                      <p className="text-sm text-muted-foreground">Secure payments via {gw.name}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
              ))
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4 bg-slate-50 dark:bg-slate-900 p-3 rounded">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              All payments are secured with 256-bit SSL encryption.
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No recent transactions.</div>
              ) : (
                transactions.slice(0, 5).map(txn => (
                  <div key={txn.id} className="flex items-center justify-between p-4 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${txn.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        <History className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium">${txn.amount} {txn.currency}</p>
                        <p className="text-xs text-muted-foreground">{new Date(txn.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className={`text-xs px-2 py-1 rounded-full uppercase font-bold ${txn.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                         {txn.status}
                       </span>
                       {txn.status === 'completed' && (
                         <Button variant="ghost" size="icon" title="Download Receipt">
                           <Download className="w-4 h-4" />
                         </Button>
                       )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UserPaymentSettingsSection;
