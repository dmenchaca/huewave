import * as React from 'react';
import { cn } from '../../../lib/utils';

interface SheetHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
}

export const SheetHeader: React.FC<SheetHeaderProps> = ({
  title,
  description,
  className,
  ...props
}) => (
  <div 
    className={cn("px-6 py-4 border-b dark:border-gray-700", className)} 
    {...props}
  >
    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
      {title}
    </h2>
    {description && (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
    )}
  </div>
);