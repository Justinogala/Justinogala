
import React from 'react';
import { Hand, X } from 'lucide-react';
import { useAdvancedVideoCall } from '@/context/AdvancedVideoCallContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

const RaiseHandManager = () => {
  const { raisedHands, lowerHand } = useAdvancedVideoCall();

  if (raisedHands.length === 0) return null;

  return (
    <div className="absolute top-20 right-4 z-40 flex flex-col gap-2">
      <AnimatePresence>
        {raisedHands.map((hand) => (
          <motion.div
            key={`${hand.userId}-${hand.timestamp}`}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 50, opacity: 0 }}
            className="flex items-center gap-3 bg-gray-800/90 backdrop-blur border border-yellow-500/30 text-white p-3 rounded-lg shadow-lg max-w-[250px]"
          >
            <div className="bg-yellow-500 p-1.5 rounded-full text-black">
              <Hand className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{hand.name}</p>
              <p className="text-xs text-gray-400">Raised hand</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-gray-400 hover:text-white"
              onClick={() => lowerHand(hand.userId)}
            >
              <X className="w-3 h-3" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default RaiseHandManager;
