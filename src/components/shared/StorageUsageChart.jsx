
import React from 'react';

const StorageUsageChart = ({ used, total, type = 'bar' }) => {
  const percentage = Math.min((used / total) * 100, 100);
  
  if (type === 'circle') {
    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (percentage / 100) * circumference;
    
    return (
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="40"
            className="stroke-gray-200 dark:stroke-gray-800"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="64"
            cy="64"
            r="40"
            className="stroke-indigo-500 transition-all duration-1000 ease-out"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold">{Math.round(percentage)}%</span>
          <span className="text-xs text-gray-500">Used</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-200">{used} GB used</span>
        <span className="text-gray-500">{total} GB total</span>
      </div>
      <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default StorageUsageChart;
