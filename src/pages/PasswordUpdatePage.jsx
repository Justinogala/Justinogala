
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { cn } from '@/lib/utils';

const PasswordUpdatePage = () => {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const requirements = [
    { re: /.{8,}/, label: "At least 8 characters" },
    { re: /[0-9]/, label: "Contains number" },
    { re: /[a-z]/, label: "Lowercase letter" },
    { re: /[A-Z]/, label: "Uppercase letter" },
  ];

  const isValid = requirements.every(req => req.re.test(password)) && password === confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    
    setIsLoading(true);
    setError('');

    try {
      const result = await updatePassword(password);
      if (result.success) {
        toast({ title: "Success", description: "Password updated successfully." });
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-secondary flex flex-col">
      <Helmet><title>Update Password - Munal</title></Helmet>
      <Header />
      
      <div className="flex-grow flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Set New Password</CardTitle>
              <CardDescription>Choose a strong password for your account</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <div className="relative">
                    <Input 
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {requirements.map((req, i) => (
                      <div key={i} className="flex items-center text-xs text-gray-500">
                        {req.re.test(password) ? (
                          <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1 text-gray-300" />
                        )}
                        <span className={cn(req.re.test(password) ? "text-green-600" : "")}>{req.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input 
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                  />
                  {confirm && confirm !== password && (
                    <p className="text-xs text-red-500">Passwords do not match</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || !isValid}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PasswordUpdatePage;
