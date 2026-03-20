import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const FloatingOrbs = () => {
  const orbs = useMemo(() => [
    { size: 320, x: '10%', y: '15%', color: 'from-violet-600/30 to-indigo-600/20', duration: 18, delay: 0 },
    { size: 240, x: '75%', y: '25%', color: 'from-purple-500/25 to-fuchsia-500/15', duration: 22, delay: 2 },
    { size: 180, x: '50%', y: '70%', color: 'from-indigo-500/25 to-cyan-500/15', duration: 16, delay: 4 },
    { size: 260, x: '85%', y: '65%', color: 'from-violet-400/20 to-purple-600/15', duration: 20, delay: 1 },
    { size: 140, x: '25%', y: '80%', color: 'from-fuchsia-500/20 to-violet-500/10', duration: 14, delay: 3 },
    { size: 200, x: '60%', y: '10%', color: 'from-indigo-400/20 to-violet-400/15', duration: 24, delay: 5 },
  ], []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full bg-gradient-to-br ${orb.color} blur-3xl`}
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            x: [0, 40, -30, 20, 0],
            y: [0, -35, 25, -15, 0],
            scale: [1, 1.15, 0.9, 1.1, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: orb.delay,
          }}
        />
      ))}
    </div>
  );
};

export default FloatingOrbs;
