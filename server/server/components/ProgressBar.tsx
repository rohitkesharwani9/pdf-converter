
import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
  showPercentage?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, label, showPercentage = true }) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full">
      {label && <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{label}</p>}
      <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-4 overflow-hidden">
        <div
          className="bg-primary h-4 rounded-full transition-all duration-300 ease-out flex items-center justify-center"
          style={{ width: `${clampedProgress}%` }}
        >
          {showPercentage && clampedProgress > 10 && ( // Only show if there's enough space
             <span className="text-xs font-medium text-white px-2">{Math.round(clampedProgress)}%</span>
          )}
        </div>
      </div>
       {showPercentage && clampedProgress <= 10 && (
          <p className="text-xs text-neutral-600 dark:text-neutral-400 text-center mt-1">{Math.round(clampedProgress)}%</p>
      )}
    </div>
  );
};

export default ProgressBar;
    