'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  format?: 'number' | 'currency' | 'percentage';
  color?: 'blue' | 'amber' | 'green' | 'purple' | 'emerald';
}

const COLOR_MAP = {
  blue: 'bg-blue-100 text-blue-600',
  amber: 'bg-amber-100 text-amber-600',
  green: 'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  emerald: 'bg-emerald-100 text-emerald-600',
};

export function MetricCard({ title, value, icon: Icon, trend, format = 'number', color = 'purple' }: MetricCardProps) {
  const formattedValue = () => {
    // If value is already a string, return it as is
    if (typeof value === 'string') {
      return value;
    }
    
    // Handle NaN or undefined
    if (typeof value !== 'number' || isNaN(value)) {
      return '0';
    }
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case 'percentage':
        return `${value}%`;
      default:
        return new Intl.NumberFormat('en-US').format(value);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className={cn('p-2 rounded-lg', COLOR_MAP[color])}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span
            className={cn(
              'text-sm font-medium',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}
          >
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{formattedValue()}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
      </div>
    </div>
  );
}
