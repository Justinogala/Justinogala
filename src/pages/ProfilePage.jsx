import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { User, Mail, Lock, CreditCard, AlertTriangle, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';

const ProfilePage = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const pricingTiers = [
    { name: 'Free', price: '$0', features: ['100 minutes/month', 'Basic features'] },
    { name: 'Pro', price: '$29', features: ['500 minutes/month', 'Advanced features'], popular: true },
    { name: 'Business', price: '$99', features: ['2000 minutes/month', 'All features'] }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    const result = await updateProfile(formData);
    setLoading(false);

    if (result.success) {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setEditMode(false);
    } else {
      toast({
        title: "Update Failed",
        description: result.error || "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  const handleUpgradePlan = (planName) => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
      description: `Upgrading to ${planName} plan`,
    });
  };

  const handleChangePassword = () => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
      description: "Password change functionality coming soon",
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
      description: "Account deletion requires additional confirmation",
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <>
      <Helmet>
        <title>Profile Settings - Munal</title>
        <meta name="description" content="Manage your account settings, profile information, and subscription plan." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">
        <Header />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Profile Settings</h1>
            <p className="text-gray-400 text-lg">Manage your account and preferences</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Information Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">Profile Information</CardTitle>
                      <CardDescription>Update your personal details</CardDescription>
                    </div>
                    {!editMode && (
                      <Button onClick={() => setEditMode(true)} variant="outline">
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {editMode ? (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <Input
                        label="Full Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        error={errors.name}
                        required
                      />
                      <Input
                        label="Email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email}
                        required
                      />
                      <div className="flex gap-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditMode(false);
                            setFormData({
                              name: user?.name || '',
                              email: user?.email || ''
                            });
                            setErrors({});
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                          {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-400">Name</p>
                          <p className="text-white font-medium">{user?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-400">Email</p>
                          <p className="text-white font-medium">{user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-400">Current Plan</p>
                          <Badge className="mt-1 capitalize">{user?.plan}</Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account Settings Card */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-2xl">Account Settings</CardTitle>
                  <CardDescription>Manage your security and account preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-white font-medium">Change Password</p>
                        <p className="text-sm text-gray-400">Update your password</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleChangePassword}>
                      Change
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="text-white font-medium">Delete Account</p>
                        <p className="text-sm text-red-400">Permanently delete your account</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleDeleteAccount}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      Delete
                    </Button>
                  </div>

                  <div className="pt-4">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Plan Upgrade Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Upgrade Plan</CardTitle>
                  <CardDescription>Get more features and minutes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pricingTiers.map((tier, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        tier.popular
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-white/10 bg-white/5'
                      } ${user?.plan.toLowerCase() === tier.name.toLowerCase() ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-white">{tier.name}</h3>
                        {tier.popular && (
                          <Badge className="bg-indigo-500">Popular</Badge>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-white mb-3">{tier.price}<span className="text-sm text-gray-400">/mo</span></p>
                      <ul className="space-y-1 mb-4">
                        {tier.features.map((feature, i) => (
                          <li key={i} className="text-sm text-gray-300">{feature}</li>
                        ))}
                      </ul>
                      {user?.plan.toLowerCase() === tier.name.toLowerCase() ? (
                        <Badge className="w-full justify-center">Current Plan</Badge>
                      ) : (
                        <Button
                          className="w-full"
                          variant={tier.popular ? 'default' : 'outline'}
                          onClick={() => handleUpgradePlan(tier.name)}
                        >
                          Upgrade
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  ))}

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/pricing')}
                  >
                    View All Plans
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;