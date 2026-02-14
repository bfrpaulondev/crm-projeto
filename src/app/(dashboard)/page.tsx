'use client';

import { useQuery } from '@apollo/client/react';
import { useAuth } from '@/lib/auth/context';
import { GET_LEADS } from '@/graphql/queries/leads';
import { MetricCard } from '@/components/dashboard/metric-card';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { Loader2, Users, DollarSign, Target, TrendingUp } from 'lucide-react';
import type { Lead } from '@/types';

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();

  const { data, loading, error } = useQuery(GET_LEADS, {
    variables: { first: 100 },
    fetchPolicy: 'cache-and-network',
  });

  const leads = data?.leads?.edges?.map((edge: { node: Lead }) => edge.node) || [];
  
  const stats = {
    totalLeads: leads.length,
    newLeads: leads.filter((l: Lead) => l.status === 'NEW').length,
    qualifiedLeads: leads.filter((l: Lead) => l.status === 'QUALIFIED').length,
    convertedLeads: leads.filter((l: Lead) => l.status === 'CONVERTED').length,
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
          Try again
        </button>
      </div>
    );
  }

  const firstName = user?.firstName || 'User';

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          Welcome back, {firstName}!
        </h1>
        <p className="text-slate-600 mt-1">
          Here&apos;s what&apos;s happening with your sales pipeline today.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard
          title="Total Leads"
          value={stats.totalLeads}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="New Leads"
          value={stats.newLeads}
          icon={Target}
          trend={{ value: 8, isPositive: true }}
        />
        <MetricCard
          title="Qualified"
          value={stats.qualifiedLeads}
          icon={DollarSign}
          trend={{ value: 15, isPositive: true }}
        />
        <MetricCard
          title="Converted"
          value={stats.convertedLeads}
          icon={TrendingUp}
          trend={{ value: 3, isPositive: true }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Leads - Takes 2 columns on xl screens */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Recent Leads</h2>
            </div>
            <div className="p-6">
              {leads.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No leads yet. Create your first lead!</p>
              ) : (
                <div className="space-y-4">
                  {leads.slice(0, 5).map((lead: Lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium">{lead.firstName} {lead.lastName}</p>
                        <p className="text-sm text-slate-500">{lead.email}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        lead.status === 'NEW' ? 'bg-blue-100 text-blue-700' :
                        lead.status === 'QUALIFIED' ? 'bg-green-100 text-green-700' :
                        lead.status === 'CONVERTED' ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {lead.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
