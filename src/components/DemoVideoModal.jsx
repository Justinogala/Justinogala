import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const DemoVideoModal = ({ isOpen, onClose }) => {
  const videoRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

  useEffect(() => {
    if (!isOpen && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          data-testid="demo-video-overlay"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

          {/* Modal */}
          <motion.div
            data-testid="demo-video-modal"
            className="relative w-full max-w-4xl z-10"
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Close Button */}
            <button
              data-testid="demo-video-close"
              onClick={onClose}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Video Container */}
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-violet-500/20 border border-white/10 bg-black">
              <video
                ref={videoRef}
                data-testid="demo-video-player"
                className="w-full aspect-video"
                controls
                autoPlay
                playsInline
                src={`${API_URL}/api/demo-video`}
              >
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Caption */}
            <p className="text-center text-sm text-gray-400 mt-4">
              Munal AI — Manage, Collaborate, and Scale Your Team
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DemoVideoModal;
