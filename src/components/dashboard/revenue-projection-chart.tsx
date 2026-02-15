'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ComposedChart,
  Line,
  Area,
} from 'recharts';
import type { Lead } from '@/types';
import { DollarSign, TrendingUp, Calculator } from 'lucide-react';

interface RevenueProjectionChartProps {
  leads: Lead[];
}

// Estimated values per stage (for projection)
const STAGE_VALUES: Record<string, number> = {
  NEW: 5000,
  CONTACTED: 8000,
  QUALIFIED: 15000,
  CONVERTED: 25000,
  UNQUALIFIED: 0,
};

const CONVERSION_RATES: Record<string, number> = {
  NEW: 0.2,
  CONTACTED: 0.35,
  QUALIFIED: 0.6,
  CONVERTED: 1.0,
  UNQUALIFIED: 0,
};

const chartConfig = {
  potential: {
    label: 'Potential Revenue',
    color: '#c4b5fd',
  },
  projected: {
    label: 'Projected Revenue',
    color: '#8b5cf6',
  },
} satisfies ChartConfig;

export function RevenueProjectionChart({ leads }: RevenueProjectionChartProps) {
  const { stageData, totals } = useMemo(() => {
    const stages = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED'] as const;
    
    const stageData = stages.map((stage) => {
      const count = leads.filter((l) => l.status === stage).length;
      const potentialValue = STAGE_VALUES[stage];
      const conversionRate = CONVERSION_RATES[stage];
      
      return {
        stage: stage.charAt(0) + stage.slice(1).toLowerCase(),
        leads: count,
        potential: count * potentialValue,
        projected: count * potentialValue * conversionRate,
        avgDealSize: potentialValue,
        conversionRate: conversionRate * 100,
      };
    });

    const totalPotential = stageData.reduce((sum, s) => sum + s.potential, 0);
    const totalProjected = stageData.reduce((sum, s) => sum + s.projected, 0);

    return {
      stageData,
      totals: {
        potential: totalPotential,
        projected: totalProjected,
        pipelineValue: totalPotential,
      },
    };
  }, [leads]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Revenue Projection</h2>
            <p className="text-sm text-slate-500">Estimated revenue by pipeline stage</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-purple-600 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">Potential</span>
            </div>
            <p className="text-xl font-bold text-purple-700">
              {formatCurrency(totals.potential)}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-green-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Projected</span>
            </div>
            <p className="text-xl font-bold text-green-700">
              {formatCurrency(totals.projected)}
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-blue-600 mb-1">
              <Calculator className="w-4 h-4" />
              <span className="text-sm font-medium">Win Rate</span>
            </div>
            <p className="text-xl font-bold text-blue-700">
              {totals.potential > 0 
                ? ((totals.projected / totals.potential) * 100).toFixed(0)
                : 0}%
            </p>
          </div>
        </div>

        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={stageData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="stage"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <ChartTooltip
                content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />}
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              />
              <Bar
                dataKey="potential"
                fill="#c4b5fd"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
                name="Potential Revenue"
              />
              <Line
                type="monotone"
                dataKey="projected"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
                name="Projected Revenue"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Stage Details */}
        <div className="mt-6 space-y-2">
          {stageData.map((stage, index) => (
            <div
              key={stage.stage}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-sm font-medium">{stage.stage}</span>
                <span className="text-xs text-slate-500">
                  ({stage.leads} leads)
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600">
                  {formatCurrency(stage.potential)}
                </span>
                <span className="text-sm font-medium text-purple-600">
                  {formatCurrency(stage.projected)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
