
import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateSecurePassword } from '@/services/passwordGeneratorService';
import { resetUserPassword } from '@/services/adminService';
import { Copy, RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ResetPasswordModal = ({ isOpen, onClose, userId, userEmail }) => {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = () => {
    setNewPassword(generateSecurePassword(12));
  };

  const handleReset = async () => {
    if (!newPassword) return;
    setLoading(true);
    try {
      await resetUserPassword(userId, newPassword);
      toast({ title: "Password Reset", description: "User password updated successfully." });
      // Don't close immediately so admin can copy the password
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reset User Password">
      <div className="space-y-4">
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          <p className="text-sm text-yellow-200">
            This will invalidate the current password for <strong>{userEmail}</strong>. 
            Ensure you share the new credentials securely.
          </p>
        </div>

        <div className="flex gap-2">
          <Input 
            value={newPassword}
            readOnly
            placeholder="Click generate..."
            className="font-mono bg-slate-950"
          />
          <Button variant="outline" onClick={handleGenerate}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {newPassword && (
          <Button 
            variant="ghost" 
            className="w-full border border-dashed border-white/20 hover:bg-white/5"
            onClick={() => {
              navigator.clipboard.writeText(newPassword);
              toast({ description: "Copied to clipboard" });
            }}
          >
            <Copy className="w-4 h-4 mr-2" /> Copy to Clipboard
          </Button>
        )}

        <div className="flex gap-3 pt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
          <Button 
            className="flex-1 bg-red-600 hover:bg-red-700" 
            onClick={handleReset}
            disabled={!newPassword || loading}
          >
            {loading ? 'Resetting...' : 'Confirm Reset'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ResetPasswordModal;
