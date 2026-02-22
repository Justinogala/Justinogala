
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Shield, Zap, BrainCircuit } from 'lucide-react';

const AuthLeftSide = ({ 
  headline = "Munal AI Intelligence", 
  subheadline = "Capture every detail automatically", 
  tagline = "Transforming how teams capture, analyze, and share meeting insights with enterprise-grade AI."
}) => {
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] flex items-center justify-center p-12">
      {/* Animated Background Overlay */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-indigo-500/20"
        animate={{ 
          backgroundPosition: ['0% 0%', '100% 100%'],
          opacity: [0.3, 0.5, 0.3] 
        }}
        transition={{ 
          duration: 15, 
          repeat: Infinity, 
          repeatType: "reverse" 
        }}
      />

      {/* Floating Shapes */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"
        animate={{ 
          y: [0, -50, 0], 
          x: [0, 30, 0],
          scale: [1, 1.1, 1] 
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"
        animate={{ 
          y: [0, 60, 0], 
          x: [0, -40, 0],
          scale: [1, 1.2, 1] 
        }}
        transition={{ duration: 14, repeat: Infinity }}
      />

      {/* Content Container */}
      <div className="relative z-10 max-w-lg text-white">
        <motion.div 
          className="mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-white/30"
            whileHover={{ rotate: 10, scale: 1.05 }}
          >
             <BrainCircuit className="w-8 h-8 text-white" />
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 font-heading tracking-tight leading-tight">
            {headline}
          </h1>
          <h2 className="text-xl md:text-2xl text-purple-100 mb-6 font-light">
            {subheadline}
          </h2>
          <p className="text-lg text-purple-100/80 leading-relaxed max-w-md">
            {tagline}
          </p>
        </motion.div>

        {/* Feature Icons */}
        <div className="flex gap-8 mt-12">
          {[
            { Icon: Zap, label: "AI Transcribe" },
            { Icon: Shield, label: "Encrypted" },
            { Icon: CheckCircle2, label: "Action Items" }
          ].map(({ Icon, label }, index) => (
            <motion.div 
              key={label}
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (index * 0.1), duration: 0.5 }}
            >
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
                <Icon className="w-6 h-6 text-purple-100" />
              </div>
              <span className="text-sm font-medium text-purple-200">{label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthLeftSide;
