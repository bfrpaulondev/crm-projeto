'use client';

import { useEffect, useState, useRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedMetricCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  format?: 'number' | 'currency' | 'percentage';
  subtitle?: string;
  color?: 'purple' | 'blue' | 'green' | 'orange' | 'red';
}

const colorStyles = {
  purple: {
    bg: 'bg-purple-100',
    icon: 'text-purple-600',
    trend: 'text-purple-600',
  },
  blue: {
    bg: 'bg-blue-100',
    icon: 'text-blue-600',
    trend: 'text-blue-600',
  },
  green: {
    bg: 'bg-green-100',
    icon: 'text-green-600',
    trend: 'text-green-600',
  },
  orange: {
    bg: 'bg-orange-100',
    icon: 'text-orange-600',
    trend: 'text-orange-600',
  },
  red: {
    bg: 'bg-red-100',
    icon: 'text-red-600',
    trend: 'text-red-600',
  },
};

function useCountUp(end: number, duration: number = 1000) {
  const [count, setCount] = useState(0);
  const countRef = useRef({ start: 0, end, duration, startTime: null as number | null });

  useEffect(() => {
    countRef.current = { start: 0, end, duration, startTime: null };
    
    const animate = (timestamp: number) => {
      if (!countRef.current.startTime) {
        countRef.current.startTime = timestamp;
      }

      const progress = Math.min(
        (timestamp - countRef.current.startTime) / countRef.current.duration,
        1
      );

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(
        countRef.current.start + (countRef.current.end - countRef.current.start) * easeOutQuart
      );

      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
}

export function AnimatedMetricCard({
  title,
  value,
  icon: Icon,
  trend,
  format = 'number',
  subtitle,
  color = 'purple',
}: AnimatedMetricCardProps) {
  const animatedValue = useCountUp(value);
  const styles = colorStyles[color];

  const formattedValue = () => {
    const displayValue = animatedValue;
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(displayValue);
      case 'percentage':
        return `${displayValue}%`;
      default:
        return new Intl.NumberFormat('en-US').format(displayValue);
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={cn('p-2 rounded-lg', styles.bg)}>
          <Icon className={cn('h-5 w-5', styles.icon)} />
        </div>
        {trend && (
          <span
            className={cn(
              'text-sm font-medium flex items-center gap-1',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}
          >
            {trend.isPositive ? (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold tabular-nums">{formattedValue()}</p>
        <p className="text-sm text-slate-500">{title}</p>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
