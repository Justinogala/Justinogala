
import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertTriangle, CheckCircle, Mail } from 'lucide-react';

export const InvoiceActionModals = ({ 
  activeModal, 
  invoice, 
  onClose, 
  onConfirm, 
  loading 
}) => {
  // Local state for forms
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (invoice) {
      setFormData({
        amount: invoice.amount || 0,
        customerEmail: invoice.customerEmail || '',
        message: `Please find attached invoice #${invoice.id}.`
      });
    }
  }, [invoice, activeModal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(formData);
  };

  if (!activeModal || !invoice) return null;

  return (
    <>
      {/* Delete Confirmation */}
      <Modal 
        isOpen={activeModal === 'delete'} 
        onClose={onClose}
        title="Delete Invoice"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <AlertTriangle className="h-6 w-6" />
            <p className="font-medium">This action cannot be undone.</p>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete invoice <strong>{invoice.id}</strong>?
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => onConfirm()}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete Invoice
            </Button>
          </div>
        </div>
      </Modal>

      {/* Mark Paid Confirmation */}
      <Modal 
        isOpen={activeModal === 'markPaid'} 
        onClose={onClose}
        title="Confirm Payment"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium">Mark as Paid?</h3>
            <p className="text-gray-500 mt-2">
              This will update the status of invoice <strong>{invoice.id}</strong> to paid.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white" 
              onClick={() => onConfirm()}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Payment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Email Invoice */}
      <Modal 
        isOpen={activeModal === 'email'} 
        onClose={onClose}
        title="Send Invoice via Email"
      >
        <form onSubmit={(e) => { e.preventDefault(); onConfirm({ email: formData.customerEmail, message: formData.message }); }}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Recipient Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={formData.customerEmail}
                onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                placeholder="client@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea 
                id="message" 
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                Send Email
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Invoice (Simplified) */}
      <Modal 
        isOpen={activeModal === 'edit'} 
        onClose={onClose}
        title="Edit Invoice Amount"
      >
        <form onSubmit={(e) => { e.preventDefault(); onConfirm({ amount: parseFloat(formData.amount) }); }}>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Editing functionality is limited in this demo. You can adjust the total amount.
            </p>
            <div className="space-y-2">
              <Label htmlFor="amount">Total Amount ($)</Label>
              <Input 
                id="amount" 
                type="number" 
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
};
