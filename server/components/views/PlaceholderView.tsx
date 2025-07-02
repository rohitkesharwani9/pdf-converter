
import React, { ReactNode } from 'react';
import { Layers } from 'lucide-react'; // Default icon

interface PlaceholderViewProps {
  title: string;
  message: string;
  icon?: ReactNode;
}

const PlaceholderView: React.FC<PlaceholderViewProps> = ({ title, message, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-10 bg-white dark:bg-neutral-800 rounded-lg shadow-lg">
      <div className="text-primary dark:text-secondary-light mb-6">
        {icon || <Layers className="w-16 h-16" />}
      </div>
      <h2 className="text-3xl font-semibold text-neutral-800 dark:text-neutral-100 mb-3">{title}</h2>
      <p className="text-neutral-600 dark:text-neutral-400 max-w-md">{message}</p>
      
      {/* Optional: Add a call to action or image */}
      {/* <img src="https://picsum.photos/400/200" alt="Placeholder graphic" className="mt-8 rounded-lg shadow-md" /> */}
    </div>
  );
};

export default PlaceholderView;
    