
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Settings, ExternalLink } from 'lucide-react';
import { paymentGatewayService } from '@/services/paymentGatewayService';

const PaymentGatewayWidget = () => {
  const navigate = useNavigate();
  const [gateways, setGateways] = useState([]);
  const [stats, setStats] = useState({ active: 0, total: 0 });

  useEffect(() => {
    const data = paymentGatewayService.getGateways();
    setGateways(data.slice(0, 3)); // Show top 3
    setStats({
      active: data.filter(g => g.status === 'active').length,
      total: data.length
    });
  }, []);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Payment Gateways
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            {stats.active}/{stats.total} Active
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {gateways.map(gateway => (
            <div key={gateway.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1">
                  <img src={gateway.logo} alt={gateway.name} className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="text-sm font-medium">{gateway.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{gateway.status}</p>
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full ${gateway.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`} />
            </div>
          ))}
          
          <Button 
            variant="outline" 
            className="w-full text-xs" 
            onClick={() => navigate('/admin/payment-gateways')}
          >
            Manage All Gateways
            <ExternalLink className="w-3 h-3 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentGatewayWidget;
