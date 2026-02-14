'use client';

import { useMemo } from 'react';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { Lead } from '@/types';

interface LeadsByCompanyChartProps {
  leads: Lead[];
}

const COLORS = [
  '#8b5cf6',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

const chartConfig = {
  company: {
    label: 'Company',
  },
} satisfies ChartConfig;

export function LeadsByCompanyChart({ leads }: LeadsByCompanyChartProps) {
  const data = useMemo(() => {
    const companyMap = new Map<string, number>();
    
    leads.forEach((lead) => {
      const company = lead.companyName || 'No Company';
      companyMap.set(company, (companyMap.get(company) || 0) + 1);
    });

    // Sort by count and take top 8, group rest as "Others"
    const sorted = Array.from(companyMap.entries())
      .sort((a, b) => b[1] - a[1]);
    
    if (sorted.length > 8) {
      const top8 = sorted.slice(0, 8);
      const othersCount = sorted.slice(8).reduce((sum, [, count]) => sum + count, 0);
      return [
        ...top8.map(([name, value]) => ({ name, value })),
        { name: 'Others', value: othersCount },
      ];
    }

    return sorted.map(([name, value]) => ({ name, value }));
  }, [leads]);

  const totalCompanies = useMemo(() => {
    const uniqueCompanies = new Set(leads.map((l) => l.companyName).filter(Boolean));
    return uniqueCompanies.size;
  }, [leads]);

  const hasData = data.length > 0 && data.some(d => d.value > 0);

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Leads by Company</h2>
            <p className="text-sm text-slate-500">Distribution across organizations</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{totalCompanies}</p>
            <p className="text-sm text-slate-500">Companies</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        {hasData ? (
          <>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            
            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {data.slice(0, 8).map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-slate-600 truncate">
                    {item.name} ({item.value})
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-slate-500">
            <div className="text-center">
              <p className="text-lg font-medium">No company data</p>
              <p className="text-sm">Add companies to your leads to see distribution</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
