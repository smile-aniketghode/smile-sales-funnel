import React from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  subtitle?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

export const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  color = 'blue' 
}) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'yellow':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'red':
        return 'bg-red-50 border-red-200 text-red-900';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  return (
    <div className={`p-6 rounded-lg border-2 ${getColorClasses(color)}`}>
      <h3 className="text-sm font-medium opacity-75 mb-1">{title}</h3>
      <p className="text-3xl font-bold mb-1">{value.toLocaleString()}</p>
      {subtitle && (
        <p className="text-sm opacity-75">{subtitle}</p>
      )}
    </div>
  );
};