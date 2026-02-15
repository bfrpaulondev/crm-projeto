'use client';

import { useQuery } from '@apollo/client/react';
import { useAuth } from '@/lib/auth/context';
import { GET_LEADS } from '@/graphql/queries/leads';
import { MetricCard } from '@/components/dashboard/metric-card';
import { QuickActions } from '@/components/dashboard/quick-actions';
import {
  LeadsByStatusChart,
  LeadsFunnelChart,
  LeadsByCompanyChart,
  ConversionRateChart,
} from '@/components/dashboard/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, DollarSign, Target, TrendingUp, BarChart3, PieChart, Funnel } from 'lucide-react';
import type { Lead } from '@/types';

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();

  const { data, loading, error } = useQuery(GET_LEADS, {
    fetchPolicy: 'cache-and-network',
  });

  const leads = data?.leads || [];

  const stats = {
    totalLeads: leads.length,
    newLeads: leads.filter((l: Lead) => l.status === 'NEW').length,
    qualifiedLeads: leads.filter((l: Lead) => l.status === 'QUALIFIED').length,
    convertedLeads: leads.filter((l: Lead) => l.status === 'CONVERTED').length,
    conversionRate: leads.length > 0
      ? ((leads.filter((l: Lead) => l.status === 'CONVERTED').length / leads.length) * 100).toFixed(1)
      : '0',
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-purple-600 hover:text-purple-700 font-medium"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const firstName = user?.firstName || 'Usuário';

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          Bem-vindo, {firstName}!
        </h1>
        <p className="text-slate-600 mt-1">
          Aqui está o resumo do seu pipeline de vendas hoje.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total de Leads"
          value={stats.totalLeads}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          color="blue"
        />
        <MetricCard
          title="Novos Leads"
          value={stats.newLeads}
          icon={Target}
          trend={{ value: 8, isPositive: true }}
          color="amber"
        />
        <MetricCard
          title="Qualificados"
          value={stats.qualifiedLeads}
          icon={DollarSign}
          trend={{ value: 15, isPositive: true }}
          color="green"
        />
        <MetricCard
          title="Convertidos"
          value={stats.convertedLeads}
          icon={TrendingUp}
          trend={{ value: 3, isPositive: true }}
          color="purple"
        />
        <MetricCard
          title="Taxa de Conversão"
          value={`${stats.conversionRate}%`}
          icon={BarChart3}
          trend={{ value: 5, isPositive: true }}
          color="emerald"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Chart */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Funnel className="w-5 h-5 text-purple-600" />
              Funil de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LeadsFunnelChart />
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-600" />
              Leads por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LeadsByStatusChart />
          </CardContent>
        </Card>

        {/* Bar Chart - Company */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Top Empresas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LeadsByCompanyChart />
          </CardContent>
        </Card>

        {/* Conversion Rate Chart */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Taxas de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ConversionRateChart />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Leads */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Leads Recentes</h2>
            </div>
            <div className="p-6">
              {leads.length === 0 ? (
                <p className="text-slate-500 text-center py-8">
                  Nenhum lead ainda. Crie seu primeiro lead!
                </p>
              ) : (
                <div className="space-y-4">
                  {leads.slice(0, 5).map((lead: Lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/leads/${lead.id}`}
                    >
                      <div>
                        <p className="font-medium">{lead.firstName} {lead.lastName}</p>
                        <p className="text-sm text-slate-500">{lead.email}</p>
                        {lead.companyName && (
                          <p className="text-xs text-slate-400">{lead.companyName}</p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          lead.status === 'NEW'
                            ? 'bg-blue-100 text-blue-700'
                            : lead.status === 'QUALIFIED'
                            ? 'bg-green-100 text-green-700'
                            : lead.status === 'CONVERTED'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {lead.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
