import { ReactNode } from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

interface StatsCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  change?: number;
  changeType?: 'percentage' | 'number' | 'seconds';
}

export default function StatsCard({ title, value, icon, change, changeType }: StatsCardProps) {
  const getChangeIcon = () => {
    if (change === undefined) return null;
    
    if (change > 0) {
      return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
    } else if (change < 0) {
      return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />;
    } else {
      return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getChangeText = () => {
    if (change === undefined) return null;
    
    const absChange = Math.abs(change);
    const sign = change > 0 ? '+' : '';
    
    switch (changeType) {
      case 'percentage':
        return `${sign}${absChange}%`;
      case 'seconds':
        return `${sign}${absChange}s`;
      case 'number':
      default:
        return `${sign}${absChange}`;
    }
  };

  const getChangeColor = () => {
    if (change === undefined) return 'text-gray-500';
    
    if (change > 0) {
      return 'text-green-600';
    } else if (change < 0) {
      return 'text-red-600';
    } else {
      return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg transition-all duration-200 hover:shadow-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {change !== undefined && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${getChangeColor()}`}>
                    {getChangeIcon()}
                    <span className="ml-1">{getChangeText()}</span>
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <span className="text-gray-500">Compared to yesterday</span>
        </div>
      </div>
    </div>
  );
}