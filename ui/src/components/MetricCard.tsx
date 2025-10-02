import React from 'react';

interface MetricCardProps {
  title: string;
  value: number;
  trend?: string;
  subtitle?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange';
  icon?: string;
  format?: 'number' | 'currency' | 'percentage';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  subtitle,
  color = 'blue',
  icon,
  format = 'number'
}) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-900',
          iconBg: 'bg-green-100',
          trendPositive: 'text-green-600',
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-900',
          iconBg: 'bg-yellow-100',
          trendPositive: 'text-yellow-600',
        };
      case 'red':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-900',
          iconBg: 'bg-red-100',
          trendPositive: 'text-red-600',
        };
      case 'purple':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-900',
          iconBg: 'bg-purple-100',
          trendPositive: 'text-purple-600',
        };
      case 'orange':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-900',
          iconBg: 'bg-orange-100',
          trendPositive: 'text-orange-600',
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-900',
          iconBg: 'bg-blue-100',
          trendPositive: 'text-blue-600',
        };
    }
  };

  const formatValue = (value: number, format: string): string => {
    switch (format) {
      case 'currency':
        return formatIndianCurrency(value);
      case 'percentage':
        return `${value}%`;
      default:
        return value.toLocaleString();
    }
  };

  // Indian currency formatter (lakhs and crores)
  const formatIndianCurrency = (value: number): string => {
    if (value >= 10000000) { // 1 crore
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    } else if (value >= 100000) { // 1 lakh
      return `₹${(value / 100000).toFixed(2)} L`;
    } else if (value >= 1000) { // thousands
      return `₹${(value / 1000).toFixed(0)}K`;
    } else {
      return `₹${value.toLocaleString('en-IN')}`;
    }
  };

  const isTrendPositive = (trend?: string): boolean | null => {
    if (!trend) return null;
    if (trend.includes('+')) return true;
    if (trend.includes('-')) return false;
    return null;
  };

  const colors = getColorClasses(color);
  const trendIsPositive = isTrendPositive(trend);

  return (
    <div className={`p-6 rounded-lg border-2 ${colors.bg} ${colors.border} transition-all hover:shadow-md`}>
      {/* Header with Icon */}
      <div className="flex items-start justify-between mb-3">
        <h3 className={`text-sm font-medium opacity-75 ${colors.text}`}>
          {title}
        </h3>
        {icon && (
          <div className={`${colors.iconBg} rounded-full w-10 h-10 flex items-center justify-center text-xl`}>
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <p className={`text-3xl font-bold mb-2 ${colors.text}`}>
        {formatValue(value, format)}
      </p>

      {/* Trend and Subtitle */}
      <div className="flex items-center justify-between">
        {subtitle && (
          <p className={`text-sm opacity-75 ${colors.text}`}>
            {subtitle}
          </p>
        )}
        {trend && (
          <div className="flex items-center space-x-1">
            {trendIsPositive === true && (
              <span className={`text-sm font-medium ${colors.trendPositive}`}>
                ↗️ {trend}
              </span>
            )}
            {trendIsPositive === false && (
              <span className="text-sm font-medium text-red-600">
                ↘️ {trend}
              </span>
            )}
            {trendIsPositive === null && (
              <span className={`text-xs opacity-75 ${colors.text}`}>
                {trend}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
