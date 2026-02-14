'use client';

import { useMemo } from 'react';
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
  Cell,
} from 'recharts';
import type { Lead } from '@/types';

interface LeadsFunnelChartProps {
  leads: Lead[];
}

const STAGES = [
  { status: 'NEW', label: 'New', color: '#3b82f6' },
  { status: 'CONTACTED', label: 'Contacted', color: '#8b5cf6' },
  { status: 'QUALIFIED', label: 'Qualified', color: '#10b981' },
  { status: 'CONVERTED', label: 'Converted', color: '#22c55e' },
  { status: 'UNQUALIFIED', label: 'Unqualified', color: '#ef4444' },
];

const chartConfig = {
  count: {
    label: 'Leads',
  },
} satisfies ChartConfig;

export function LeadsFunnelChart({ leads }: LeadsFunnelChartProps) {
  const data = useMemo(() => {
    return STAGES.map((stage) => ({
      name: stage.label,
      count: leads.filter((l) => l.status === stage.status).length,
      fill: stage.color,
    }));
  }, [leads]);

  const totalLeads = useMemo(() => leads.length, [leads]);

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Lead Pipeline Funnel</h2>
            <p className="text-sm text-slate-500">Distribution across stages</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{totalLeads}</p>
            <p className="text-sm text-slate-500">Total Leads</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              />
              <Bar
                dataKey="count"
                radius={[0, 4, 4, 0]}
                barSize={32}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Funnel Visual */}
        <div className="mt-6 grid grid-cols-5 gap-2">
          {data.map((stage, index) => {
            const percentage = totalLeads > 0 ? (stage.count / totalLeads) * 100 : 0;
            return (
              <div key={stage.name} className="text-center">
                <div
                  className="mx-auto rounded-lg transition-all duration-500"
                  style={{
                    width: `${Math.max(20, 100 - index * 15)}%`,
                    height: `${Math.max(30, 60 - index * 8)}px`,
                    backgroundColor: stage.fill,
                    opacity: 0.9,
                  }}
                />
                <p className="mt-2 text-sm font-medium">{stage.count}</p>
                <p className="text-xs text-slate-500">{percentage.toFixed(0)}%</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
