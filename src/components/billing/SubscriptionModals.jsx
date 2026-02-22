
import React, { useState } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ArrowUpCircle } from 'lucide-react';
import PlanComparisonTable from './PlanComparisonTable';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';

export const SubscriptionUpgradeModal = ({ isOpen, onClose, currentPlanId, onUpgrade }) => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleUpgrade = async (planId) => {
    setLoading(true);
    setSelectedPlan(planId);
    try {
      await onUpgrade(planId);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <ArrowUpCircle className="w-6 h-6 text-indigo-600" />
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            Choose a plan that scales with your needs. Unlock premium features instantly.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <PlanComparisonTable 
            currentPlanId={currentPlanId} 
            onUpgrade={handleUpgrade} 
            isLoading={loading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const SubscriptionDowngradeModal = ({ isOpen, onClose, currentPlanId, onDowngrade }) => {
  const [loading, setLoading] = useState(false);

  const handleDowngrade = async () => {
    setLoading(true);
    try {
      await onDowngrade('plan_free');
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Confirm Downgrade?
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to downgrade to the Free plan? You will lose access to:
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 dark:text-gray-300">
              <li>Premium high-quality transcription models</li>
              <li>Extended storage limit (downgrades to 1GB)</li>
              <li>Priority support</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleDowngrade} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Confirm Downgrade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
