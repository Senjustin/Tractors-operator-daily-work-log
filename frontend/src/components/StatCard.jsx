import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue,
  color = 'primary' 
}) => {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-yellow-50 text-yellow-600',
    danger: 'bg-red-50 text-red-600',
    info: 'bg-blue-50 text-blue-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        {Icon && <Icon size={24} />}
      </div>
      <div className="flex-1">
        <p className="text-sm text-secondary-500">{title}</p>
        <p className="text-2xl font-bold text-secondary-800">{value}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            {trend === 'up' ? (
              <TrendingUp size={14} className="text-green-500" />
            ) : (
              <TrendingDown size={14} className="text-red-500" />
            )}
            <span className={`text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trendValue}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
