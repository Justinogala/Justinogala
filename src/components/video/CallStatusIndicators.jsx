
import React from 'react';
import { Users, Signal } from 'lucide-react';
import { useAdvancedVideoCall } from '@/context/AdvancedVideoCallContext';
import RecordingManager from './RecordingManager';

const CallStatusIndicators = () => {
  const { participants, connectionQuality } = useAdvancedVideoCall();

  const getQualityColor = (q) => {
    switch(q) {
      case 'good': return 'text-green-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 p-4 z-40 flex justify-between items-start pointer-events-none">
      {/* Left: Call Info */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="bg-gray-900/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-white">{participants.length}</span>
        </div>
        <RecordingManager />
      </div>

      {/* Right: Connection Status */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="bg-gray-900/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
          <Signal className={`w-4 h-4 ${getQualityColor(connectionQuality)}`} />
          <span className="text-xs font-medium text-gray-300 uppercase">{connectionQuality}</span>
        </div>
      </div>
    </div>
  );
};

export default CallStatusIndicators;
