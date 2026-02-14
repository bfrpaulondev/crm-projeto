'use client';

import { useQuery } from '@apollo/client/react';
import { GET_LEADS } from '@/graphql/queries/leads';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import { Loader2 } from 'lucide-react';
import type { Lead } from '@/types';

const COLORS = {
  NEW: '#3b82f6',
  CONTACTED: '#f59e0b',
  QUALIFIED: '#10b981',
  CONVERTED: '#8b5cf6',
  UNQUALIFIED: '#6b7280',
};

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Novos',
  CONTACTED: 'Contactados',
  QUALIFIED: 'Qualificados',
  CONVERTED: 'Convertidos',
  UNQUALIFIED: 'Desqualificados',
};

export function LeadsByStatusChart() {
  const { data, loading, error } = useQuery(GET_LEADS, {
    fetchPolicy: 'cache-and-network',
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        Erro ao carregar dados
      </div>
    );
  }

  const leads = data?.leads || [];

  // Count leads by status
  const statusCounts = leads.reduce((acc: Record<string, number>, lead: Lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    value: count,
    fill: COLORS[status as keyof typeof COLORS] || '#6b7280',
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LeadsFunnelChart() {
  const { data, loading, error } = useQuery(GET_LEADS, {
    fetchPolicy: 'cache-and-network',
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        Erro ao carregar dados
      </div>
    );
  }

  const leads = data?.leads || [];

  // Funnel stages in order
  const funnelStages = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED'];

  const chartData = funnelStages
    .map((status) => {
      const count = leads.filter((l: Lead) => l.status === status).length;
      return {
        name: STATUS_LABELS[status],
        value: count,
        fill: COLORS[status as keyof typeof COLORS],
      };
    })
    .filter((item) => item.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Nenhum dado para exibir
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Funnel
            dataKey="value"
            data={chartData}
            isAnimationActive
          >
            <LabelList
              position="right"
              fill="#374151"
              stroke="none"
              dataKey="name"
            />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LeadsByCompanyChart() {
  const { data, loading, error } = useQuery(GET_LEADS, {
    fetchPolicy: 'cache-and-network',
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        Erro ao carregar dados
      </div>
    );
  }

  const leads = data?.leads || [];

  // Count leads by company
  const companyCounts = leads.reduce((acc: Record<string, number>, lead: Lead) => {
    const company = lead.companyName || 'Sem empresa';
    acc[company] = (acc[company] || 0) + 1;
    return acc;
  }, {});

  // Get top 5 companies
  const chartData = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      leads: value,
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Nenhum dado para exibir
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
          <YAxis
            dataKey="name"
            type="category"
            width={100}
            tick={{ fill: '#374151', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="leads" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ConversionRateChart() {
  const { data, loading, error } = useQuery(GET_LEADS, {
    fetchPolicy: 'cache-and-network',
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        Erro ao carregar dados
      </div>
    );
  }

  const leads = data?.leads || [];
  const total = leads.length;
  const converted = leads.filter((l: Lead) => l.status === 'CONVERTED').length;
  const qualified = leads.filter((l: Lead) => l.status === 'QUALIFIED').length;
  const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0';
  const qualificationRate = total > 0 ? ((qualified / total) * 100).toFixed(1) : '0';

  const chartData = [
    { name: 'Taxa de Conversão', value: parseFloat(conversionRate), fill: '#10b981' },
    { name: 'Taxa de Qualificação', value: parseFloat(qualificationRate), fill: '#f59e0b' },
  ];

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fill: '#374151', fontSize: 12 }} />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Valor']}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
