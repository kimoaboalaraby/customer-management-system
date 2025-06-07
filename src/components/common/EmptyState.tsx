import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  icon, 
  action 
}) => {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50">
      <div className="text-center">
        {icon && (
          <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-primary-100 text-primary-600 mb-4">
            {icon}
          </div>
        )}
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{description}</p>
        
        {action && (
          <div className="mt-2">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;