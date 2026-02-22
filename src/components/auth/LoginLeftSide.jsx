
import React from 'react';
import { motion } from 'framer-motion';
import { Video, BarChart2, Users } from 'lucide-react';

const LoginLeftSide = () => {
  return (
    <motion.div 
      className="hidden md:flex relative w-full h-full overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 items-center justify-center"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Animated Gradient Overlay */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-tr from-blue-500/30 to-purple-500/30"
        animate={{ 
          backgroundPosition: ['0% 0%', '100% 100%'],
          opacity: [0.3, 0.6, 0.3] 
        }}
        transition={{ 
          duration: 10, 
          repeat: Infinity, 
          repeatType: "reverse" 
        }}
      />

      {/* Floating Shapes */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl"
        animate={{ 
          y: [0, -30, 0], 
          x: [0, 20, 0],
          scale: [1, 1.1, 1] 
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-indigo-400/10 rounded-full blur-3xl"
        animate={{ 
          y: [0, 40, 0], 
          x: [0, -30, 0],
          scale: [1, 1.2, 1] 
        }}
        transition={{ duration: 12, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      {/* Content Container */}
      <div className="relative z-10 p-12 max-w-lg text-white">
        <motion.div 
          className="mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-white/30">
            <span className="text-3xl font-bold">M</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 font-heading">Welcome to Munal</h1>
          <h2 className="text-2xl text-blue-100 mb-6">Sign in to unlock insights from your meetings</h2>
          <p className="text-lg text-blue-100/80 leading-relaxed">
            Munal helps teams capture, analyze, and share meeting insights efficiently.
          </p>
        </motion.div>

        {/* Feature Icons */}
        <div className="flex gap-6 mt-12">
          <motion.div 
            className="flex flex-col items-center gap-2"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: 0 }}
          >
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Video className="w-6 h-6" />
            </div>
            <span className="text-xs text-blue-200">Meeting</span>
          </motion.div>

          <motion.div 
            className="flex flex-col items-center gap-2"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: 1.3 }}
          >
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <BarChart2 className="w-6 h-6" />
            </div>
            <span className="text-xs text-blue-200">Analytics</span>
          </motion.div>

          <motion.div 
            className="flex flex-col items-center gap-2"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: 2.6 }}
          >
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs text-blue-200">Collaboration</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginLeftSide;
