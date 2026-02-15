'use client';

import { useMemo, useState } from 'react';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { format, startOfDay, startOfWeek, isWithinInterval, subDays, subWeeks } from 'date-fns';
import type { Lead } from '@/types';

interface LeadsPerDayChartProps {
  leads: Lead[];
}

const chartConfig = {
  leads: {
    label: 'New Leads',
    color: '#8b5cf6',
  },
} satisfies ChartConfig;

export function LeadsPerDayChart({ leads }: LeadsPerDayChartProps) {
  const [viewMode, setViewMode] = useState<'7d' | '30d' | 'week'>('7d');

  const data = useMemo(() => {
    const now = new Date();
    let result: { date: string; leads: number; label: string }[] = [];

    if (viewMode === '7d' || viewMode === '30d') {
      const days = viewMode === '7d' ? 7 : 30;
      // Generate date buckets
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(now, i);
        const dayStart = startOfDay(date);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const count = leads.filter((lead) => {
          const leadDate = new Date(lead.createdAt);
          return isWithinInterval(leadDate, { start: dayStart, end: dayEnd });
        }).length;

        result.push({
          date: format(date, 'yyyy-MM-dd'),
          leads: count,
          label: format(date, viewMode === '7d' ? 'EEE' : 'MMM d'),
        });
      }
    } else {
      // Weekly view
      for (let i = 7; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(now, i));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const count = leads.filter((lead) => {
          const leadDate = new Date(lead.createdAt);
          return isWithinInterval(leadDate, { start: weekStart, end: weekEnd });
        }).length;

        result.push({
          date: format(weekStart, 'yyyy-MM-dd'),
          leads: count,
          label: format(weekStart, 'MMM d'),
        });
      }
    }

    return result;
  }, [leads, viewMode]);

  const totalLeadsInPeriod = useMemo(() => {
    return data.reduce((sum, item) => sum + item.leads, 0);
  }, [data]);

  const averageLeads = useMemo(() => {
    return data.length > 0 ? (totalLeadsInPeriod / data.length).toFixed(1) : '0';
  }, [data, totalLeadsInPeriod]);

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Leads Over Time</h2>
            <p className="text-sm text-slate-500">Track lead creation trends</p>
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            <Button
              variant={viewMode === '7d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('7d')}
              className={viewMode === '7d' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}
            >
              7 Days
            </Button>
            <Button
              variant={viewMode === '30d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('30d')}
              className={viewMode === '30d' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}
            >
              30 Days
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className={viewMode === 'week' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}
            >
              Weekly
            </Button>
          </div>
        </div>
      </div>
      <div className="p-6">
        {/* Stats Row */}
        <div className="flex gap-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-sm text-slate-600">
              Total: <span className="font-semibold">{totalLeadsInPeriod}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-300" />
            <span className="text-sm text-slate-600">
              Avg: <span className="font-semibold">{averageLeads}</span> per {viewMode === 'week' ? 'week' : 'day'}
            </span>
          </div>
        </div>

        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                allowDecimals={false}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
              />
              <Bar
                dataKey="leads"
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
}
