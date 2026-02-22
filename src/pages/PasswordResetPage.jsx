
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import AnimatedHeroBackground from '@/components/AnimatedHeroBackground';

const PasswordResetPage = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await resetPassword(email);
      setIsSent(true);
    } catch (err) {
      setError('Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-secondary flex flex-col">
      <Helmet><title>Reset Password - Munal</title></Helmet>
      <Header />
      
      <div className="flex-grow flex items-center justify-center relative p-4">
        <AnimatedHeroBackground gradientFrom="from-slate-900/10" gradientTo="to-indigo-900/10" />
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md z-10">
          <Card className="backdrop-blur-sm bg-bg-primary/95 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-600">
                {isSent ? <CheckCircle className="w-6 h-6" /> : <Mail className="w-6 h-6" />}
              </div>
              <CardTitle className="text-2xl font-bold">
                {isSent ? "Check your email" : "Reset Password"}
              </CardTitle>
              <CardDescription>
                {isSent 
                  ? `We have sent a password reset link to ${email}` 
                  : "Enter your email address and we'll send you a link to reset your password."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4 border border-red-200">
                  {error}
                </div>
              )}

              {!isSent ? (
                <form onSubmit={handleReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="you@example.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Send Reset Link"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 text-center">
                    Didn't receive the email? Check your spam folder or try again.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setIsSent(false)}
                  >
                    Try another email
                  </Button>
                </div>
              )}

              <div className="mt-6 text-center">
                <Link to="/login" className="text-sm text-gray-500 hover:text-indigo-600 inline-flex items-center">
                  <ArrowLeft className="w-3 h-3 mr-1" /> Back to login
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PasswordResetPage;
