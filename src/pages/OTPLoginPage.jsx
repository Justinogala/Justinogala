
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import AnimatedHeroBackground from '@/components/AnimatedHeroBackground';

const OTPLoginPage = () => {
  const { sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1); // 1: Email, 2: OTP
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await sendOTP(email);
      if (result.success) {
        setStep(2);
        setCooldown(60);
        toast({ title: "OTP Sent", description: "Check your inbox for the code." });
      } else {
        setError(result.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await verifyOTP(email, otp);
      if (result.success) {
        toast({ title: "Success", description: "Logged in successfully." });
        navigate('/dashboard');
      } else {
        setError(result.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-secondary flex flex-col">
      <Helmet><title>OTP Login - Munal</title></Helmet>
      <Header />
      
      <div className="flex-grow flex items-center justify-center relative p-4">
        <AnimatedHeroBackground gradientFrom="from-blue-900/10" gradientTo="to-green-900/10" />
        
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md z-10">
          <Card className="backdrop-blur-sm bg-bg-primary/95 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Passwordless Login</CardTitle>
              <CardDescription>
                {step === 1 ? "Enter your email to receive a code" : `Enter the code sent to ${email}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4 border border-red-200">
                  {error}
                </div>
              )}

              {step === 1 ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="you@example.com" 
                        className="pl-9"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Send Code"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Enter 6-Digit Code</Label>
                    <Input 
                      id="otp" 
                      type="text" 
                      placeholder="123456" 
                      className="text-center text-2xl tracking-widest"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Verify & Login"}
                  </Button>
                  
                  <div className="flex justify-between items-center text-sm pt-2">
                    <button 
                      type="button" 
                      onClick={() => setStep(1)} 
                      className="text-gray-500 hover:text-gray-700 flex items-center"
                    >
                      <ArrowLeft className="w-3 h-3 mr-1" /> Change Email
                    </button>
                    
                    {cooldown > 0 ? (
                      <span className="text-gray-400 flex items-center">
                        <Clock className="w-3 h-3 mr-1" /> Resend in {cooldown}s
                      </span>
                    ) : (
                      <button 
                        type="button" 
                        onClick={handleSendOTP} 
                        className="text-indigo-600 hover:underline"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                </form>
              )}

              <div className="mt-6 text-center pt-4 border-t border-border">
                <Link to="/login" className="text-sm text-gray-500 hover:text-indigo-600">
                  Back to standard login
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default OTPLoginPage;
