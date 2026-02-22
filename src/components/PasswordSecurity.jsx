
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { passwordSecurityService } from '@/services/passwordSecurityService';
import { securityAuditLogService } from '@/services/securityAuditLogService';
import { Check, X, ShieldCheck, AlertTriangle, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const PasswordSecurity = ({ userId }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [strength, setStrength] = useState({ isValid: false, strength: 'weak', checks: {} });
  const [loading, setLoading] = useState(false);
  const [passwordHistory, setPasswordHistory] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    // Validate strength on typing
    if (newPassword) {
      setStrength(passwordSecurityService.validateStrength(newPassword));
    } else {
      setStrength({ isValid: false, strength: 'weak', checks: {} });
    }
  }, [newPassword]);

  // Mock fetching history metadata (in reality hashes are stored, we can't show passwords)
  // We can only show dates of change
  useEffect(() => {
    // Simulate loading history
    const history = JSON.parse(localStorage.getItem('munal_password_history') || '{}');
    const userHistory = history[userId] || [];
    setPasswordHistory(userHistory);
  }, [userId]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (!strength.isValid) {
        throw new Error("Password does not meet security requirements");
      }

      // 1. Verify current password (mock: assuming true for demo if not empty)
      // In real app: await authService.verifyPassword(userId, currentPassword)
      if (!currentPassword) throw new Error("Current password is required");

      // 2. Check history
      const isReused = await passwordSecurityService.checkHistory(userId, newPassword);
      if (!isReused) {
        throw new Error("You cannot reuse your last 5 passwords");
      }

      // 3. Hash and Save
      const hash = await passwordSecurityService.hashPassword(newPassword);
      await passwordSecurityService.addToHistory(userId, hash);
      
      // Log event
      securityAuditLogService.logEvent(userId, 'PASSWORD_CHANGE', { method: 'user_initiated' });

      // Simulate API call
      await new Promise(r => setTimeout(r, 1000));

      toast({
        title: "Success",
        description: "Password updated successfully.",
        variant: "default"
      });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (s) => {
    switch(s) {
      case 'strong': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'fair': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  const getStrengthPercentage = (s) => {
    switch(s) {
      case 'strong': return '100%';
      case 'good': return '75%';
      case 'fair': return '50%';
      default: return '25%';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          Password Security
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            type="password"
            label="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          
          <div className="space-y-2">
            <Input
              type="password"
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            
            {/* Strength Meter */}
            {newPassword && (
              <div className="space-y-1">
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-300", getStrengthColor(strength.strength))}
                    style={{ width: getStrengthPercentage(strength.strength) }}
                  />
                </div>
                <p className="text-xs text-right capitalize text-muted-foreground">
                  Strength: <span className={cn("font-medium", `text-${getStrengthColor(strength.strength).replace('bg-', '')}`)}>{strength.strength}</span>
                </p>
              </div>
            )}
          </div>

          <Input
            type="password"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            error={confirmPassword && newPassword !== confirmPassword ? "Passwords do not match" : null}
          />

          {/* Requirements List */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="text-sm font-medium mb-2">Password Requirements:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <RequirementItem label="Min 12 characters" met={strength.checks?.length} />
              <RequirementItem label="Uppercase letter" met={strength.checks?.uppercase} />
              <RequirementItem label="Lowercase letter" met={strength.checks?.lowercase} />
              <RequirementItem label="Number" met={strength.checks?.number} />
              <RequirementItem label="Special character" met={strength.checks?.special} />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={loading || !strength.isValid || newPassword !== confirmPassword}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>

        <div className="border-t pt-6">
          <h4 className="text-sm font-medium flex items-center gap-2 mb-4">
            <History className="w-4 h-4" /> Password History
          </h4>
          <div className="space-y-2">
            {passwordHistory.length > 0 ? (
              passwordHistory.map((entry, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm p-2 bg-secondary/20 rounded">
                  <span className="text-muted-foreground">Changed on</span>
                  <span className="font-mono">{new Date(entry.createdAt).toLocaleDateString()}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic">No password history available.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const RequirementItem = ({ label, met }) => (
  <div className="flex items-center gap-2">
    {met ? (
      <Check className="w-4 h-4 text-green-500" />
    ) : (
      <X className="w-4 h-4 text-muted-foreground" />
    )}
    <span className={cn(met ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
      {label}
    </span>
  </div>
);

export default PasswordSecurity;
