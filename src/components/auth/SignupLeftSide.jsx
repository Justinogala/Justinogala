
import React from 'react';
import { motion } from 'framer-motion';
import { Video, BarChart2, Users } from 'lucide-react';

const SignupLeftSide = () => {
  return (
    <motion.div 
      className="hidden lg:flex relative w-full h-full overflow-hidden bg-gradient-to-br from-[#3B82F6] to-[#5B4FFF] items-center justify-center p-[20px] md:p-[40px] lg:p-[60px]"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated Background Overlay */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"
        animate={{ 
          backgroundPosition: ['0% 0%', '100% 100%'],
          opacity: [0.1, 0.2, 0.1] 
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
        className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl"
        animate={{ 
          y: [0, 40, 0], 
          x: [0, -30, 0],
          scale: [1, 1.2, 1] 
        }}
        transition={{ duration: 12, repeat: Infinity }}
      />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-lg text-white flex flex-col justify-center items-center h-full text-center">
        <motion.div 
          className="flex flex-col items-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 shadow-xl border border-white/20">
            <span className="text-4xl font-bold">M</span>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 font-heading tracking-tight text-white">Join Munal</h1>
          <h2 className="text-xl text-blue-100 mb-6 font-medium">Create your Munal account to get started</h2>
          <p className="text-base text-blue-50 leading-relaxed max-w-md">
            Munal transforms how teams capture, analyze, and share meeting insights. Unlock the power of AI for your productivity.
          </p>
        </motion.div>

        {/* Feature Icons */}
        <div className="flex gap-8 mt-12">
          <motion.div 
            className="flex flex-col items-center gap-3 group"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: 0 }}
          >
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-colors">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-blue-100">Meetings</span>
          </motion.div>

          <motion.div 
            className="flex flex-col items-center gap-3 group"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: 1.5 }}
          >
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-colors">
              <BarChart2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-blue-100">Analytics</span>
          </motion.div>

          <motion.div 
            className="flex flex-col items-center gap-3 group"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: 3 }}
          >
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-colors">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-blue-100">Collaboration</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default SignupLeftSide;
