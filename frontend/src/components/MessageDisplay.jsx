import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, X, Info } from 'lucide-react';

const MessageDisplay = ({ message, setMessage }) => {
  const [progress, setProgress] = useState(100);
  const DISPLAY_TIME = 7000; // 7 seconds display time

  useEffect(() => {
    if (!message.text) return;

    // Reset progress when a new message appears
    setProgress(100);

    // Start the progress countdown
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const remaining = 100 - (elapsedTime / DISPLAY_TIME * 100);
      setProgress(Math.max(remaining, 0));

      if (remaining <= 0) {
        clearInterval(interval);
        setMessage({ type: '', text: '' });
      }
    }, 50);

    return () => clearInterval(interval);
  }, [message.text, setMessage]);

  if (!message.text) return null;

  const getIcon = () => {
    switch (message.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-white" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-white" />;
      case 'info':
        return <Info className="w-5 h-5 text-white" />;
      default:
        return null;
    }
  };

  const getBgColor = () => {
    switch (message.type) {
      case 'success':
        return 'bg-green-600';
      case 'error':
        return 'bg-red-600';
      case 'info':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getProgressColor = () => {
    switch (message.type) {
      case 'success':
        return 'bg-green-400';
      case 'error':
        return 'bg-red-400';
      case 'info':
        return 'bg-blue-400';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <AnimatePresence>
      {message.text && (
        <motion.div
          className="fixed top-4 right-4 z-50 max-w-sm w-full shadow-xl"
          initial={{ opacity: 0, x: 20, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          <div className={`rounded-lg overflow-hidden ${getBgColor()}`}>
            <div className="p-4 flex items-start justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">{getIcon()}</div>
                <div className="ml-3">
                  <p className="text-white font-medium">{message.text}</p>
                </div>
              </div>
              <button
                onClick={() => setMessage({ type: '', text: '' })}
                className="text-white opacity-70 hover:opacity-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="h-1 w-full bg-black bg-opacity-20">
              <motion.div
                className={`h-full ${getProgressColor()}`}
                initial={{ width: '100%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MessageDisplay;