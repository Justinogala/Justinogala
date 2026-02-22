
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Check, AlertCircle, Loader2, Chrome, Github } from 'lucide-react';

const SignupForm = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    switch (name) {
      case 'fullName':
        return value.trim().length < 2 ? 'Name must be at least 2 characters' : '';
      case 'email':
        return !/\S+@\S+\.\S+/.test(value) ? 'Please enter a valid email address' : '';
      case 'password':
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(value)) return 'Must contain an uppercase letter';
        if (!/[a-z]/.test(value)) return 'Must contain a lowercase letter';
        if (!/[0-9]/.test(value)) return 'Must contain a number';
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'Must contain a special character';
        return '';
      case 'confirmPassword':
        return value !== formData.password ? 'Passwords do not match' : '';
      case 'termsAccepted':
        return !value ? 'You must accept the terms' : '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    
    if (touched[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: validateField(name, finalValue)
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({
      ...prev,
      [name]: validateField(name, finalValue)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);
    setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);
    
    try {
      // Simulate signup with AuthContext
      const result = await signup(formData.email, formData.password, formData.fullName);
      
      if (result.success) {
        toast({
          title: "Account Created Successfully",
          description: "Welcome to Munal!",
          className: "bg-green-600 text-white border-none"
        });
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        toast({
          title: "Registration Failed",
          description: result.error || "Could not create account",
          variant: "destructive"
        });
        setErrors(prev => ({ ...prev, email: result.error }));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Shared classes
  const labelClass = "block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100";
  const inputContainerClass = "mb-5";
  const errorTextClass = "mt-1 text-xs text-red-500 flex items-center gap-1";

  const inputClasses = (error, success) => `
    w-full h-12 px-4 py-3 rounded-lg border text-sm leading-relaxed
    bg-white dark:bg-gray-700 
    text-gray-900 dark:text-gray-100 placeholder-gray-400
    transition-all duration-200 outline-none
    ${error 
      ? 'border-red-500 focus:border-red-500 focus:ring-[3px] focus:ring-red-500/10' 
      : success 
        ? 'border-green-500 focus:border-green-500 focus:ring-[3px] focus:ring-green-500/10'
        : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10'
    }
  `;

  return (
    <motion.div 
      className="w-full h-full flex flex-col justify-center items-center p-[20px] md:p-[40px] lg:p-[60px]"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="w-full max-w-[500px]">
        <div className="mb-8">
          <h2 className="text-[32px] font-bold text-gray-900 dark:text-white mb-2">Create Munal Account</h2>
          <p className="text-sm font-normal text-gray-500 dark:text-gray-400">Enter your details to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full" noValidate>
          {/* Full Name */}
          <motion.div className={inputContainerClass} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
            <label htmlFor="fullName" className={labelClass}>Full Name</label>
            <div className="relative">
              <input
                id="fullName"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClasses(errors.fullName, touched.fullName && !errors.fullName)}
                placeholder="John Doe"
                disabled={isLoading}
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? "fullName-error" : undefined}
              />
              {touched.fullName && !errors.fullName && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
              )}
            </div>
            {errors.fullName && (
              <p id="fullName-error" className={errorTextClass} role="alert">
                <AlertCircle className="w-3 h-3"/> {errors.fullName}
              </p>
            )}
          </motion.div>

          {/* Email */}
          <motion.div className={inputContainerClass} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
            <label htmlFor="email" className={labelClass}>Email Address</label>
            <div className="relative">
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClasses(errors.email, touched.email && !errors.email)}
                placeholder="you@example.com"
                disabled={isLoading}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {touched.email && !errors.email && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
              )}
            </div>
            {errors.email && (
              <p id="email-error" className={errorTextClass} role="alert">
                <AlertCircle className="w-3 h-3"/> {errors.email}
              </p>
            )}
          </motion.div>

          {/* Password */}
          <motion.div className={inputContainerClass} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
            <label htmlFor="password" className={labelClass}>Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClasses(errors.password, touched.password && !errors.password)}
                placeholder="Create a password"
                disabled={isLoading}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                disabled={isLoading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className={errorTextClass} role="alert">
                <AlertCircle className="w-3 h-3"/> {errors.password}
              </p>
            )}
          </motion.div>

          {/* Confirm Password */}
          <motion.div className={inputContainerClass} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} initial="hidden" animate="visible" transition={{ delay: 0.4 }}>
            <label htmlFor="confirmPassword" className={labelClass}>Confirm Password</label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClasses(errors.confirmPassword, touched.confirmPassword && !errors.confirmPassword)}
                placeholder="Confirm your password"
                disabled={isLoading}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                disabled={isLoading}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p id="confirmPassword-error" className={errorTextClass} role="alert">
                <AlertCircle className="w-3 h-3"/> {errors.confirmPassword}
              </p>
            )}
          </motion.div>

          {/* Terms Checkbox */}
          <motion.div className="mb-6 flex items-start gap-2" variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} initial="hidden" animate="visible" transition={{ delay: 0.5 }}>
            <div className="relative flex items-center mt-0.5">
              <input
                id="termsAccepted"
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isLoading}
                className="peer h-[18px] w-[18px] cursor-pointer appearance-none rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 transition-all checked:border-blue-500 checked:bg-blue-500 hover:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                aria-invalid={!!errors.termsAccepted}
              />
              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                <Check className="w-3 h-3" />
              </div>
            </div>
            <div className="flex flex-col">
              <label htmlFor="termsAccepted" className="text-sm text-gray-600 dark:text-gray-400 leading-snug cursor-pointer select-none">
                I agree to the <Link to="/legal/terms" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline">Terms of Service</Link> and <Link to="/legal/privacy" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline">Privacy Policy</Link>
              </label>
              {errors.termsAccepted && (
                <p className="text-xs text-red-500 mt-1" role="alert">{errors.termsAccepted}</p>
              )}
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={!isLoading ? { scale: 1.02 } : {}}
            whileTap={!isLoading ? { scale: 0.98 } : {}}
            className={`w-full h-12 mt-6 rounded-lg font-semibold text-base text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2
              ${isLoading 
                ? 'bg-gray-400 cursor-not-allowed opacity-70' 
                : 'bg-[#3B82F6] hover:bg-blue-700 shadow-blue-500/25 active:bg-blue-800'
              }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating account...
              </>
            ) : (
              'Sign Up'
            )}
          </motion.button>
        </form>

        {/* Social Login & Link */}
        <div className="mt-6 flex flex-col items-center gap-6">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-[#1F2937] text-gray-500 dark:text-gray-400">Or continue with</span>
            </div>
          </div>

          <div className="flex gap-3 justify-center w-full my-6">
            {['Google', 'GitHub', 'Microsoft'].map((provider) => (
              <button
                key={provider}
                disabled={isLoading}
                onClick={() => toast({ title: "Coming Soon", description: `${provider} login is not yet available.` })}
                className="w-12 h-12 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Sign up with ${provider}`}
              >
                {provider === 'Google' && <Chrome className="w-5 h-5 text-gray-700 dark:text-white" />}
                {provider === 'GitHub' && <Github className="w-5 h-5 text-gray-700 dark:text-white" />}
                {provider === 'Microsoft' && (
                  <div className="grid grid-cols-2 gap-0.5 w-5 h-5">
                    <div className="bg-red-500 rounded-[1px]"></div>
                    <div className="bg-green-500 rounded-[1px]"></div>
                    <div className="bg-blue-500 rounded-[1px]"></div>
                    <div className="bg-yellow-500 rounded-[1px]"></div>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="text-sm text-center text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SignupForm;
