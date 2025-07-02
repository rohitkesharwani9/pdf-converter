
import React from 'react';
import { ALL_CONVERSION_TASKS, TASK_CATEGORIES, ConversionType } from '../constants';
import { NavLink } from '../types';

interface SidebarProps {
  onTaskSelect: (taskId: ConversionType) => void;
  activeTaskId: ConversionType | null;
}

const Sidebar: React.FC<SidebarProps> = ({ onTaskSelect, activeTaskId }) => {
  
  const groupedTasks: Record<string, NavLink[]> = ALL_CONVERSION_TASKS.reduce((acc, task) => {
    const category = task.categoryKey;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({
      id: task.id,
      label: task.name,
      icon: task.icon,
      category: TASK_CATEGORIES[category as keyof typeof TASK_CATEGORIES] || 'Other Tools'
    });
    return acc;
  }, {} as Record<string, NavLink[]>);

  return (
    <aside className="w-72 bg-neutral-100 dark:bg-neutral-800 p-4 space-y-6 border-r border-neutral-200 dark:border-neutral-700 overflow-y-auto transition-colors duration-300">
      {Object.entries(groupedTasks).map(([categoryKey, tasks]) => (
        <div key={categoryKey}>
          <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3 px-2">
            {TASK_CATEGORIES[categoryKey as keyof typeof TASK_CATEGORIES] || 'Other Tools'}
          </h3>
          <nav className="space-y-1">
            {tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => onTaskSelect(task.id as ConversionType)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ease-in-out
                  ${activeTaskId === task.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white'
                  }`}
              >
                <span className={activeTaskId === task.id ? 'text-white' : 'text-primary dark:text-secondary-light'}>{task.icon}</span>
                <span>{task.label}</span>
              </button>
            ))}
          </nav>
        </div>
      ))}
    </aside>
  );
};

export default Sidebar;
    