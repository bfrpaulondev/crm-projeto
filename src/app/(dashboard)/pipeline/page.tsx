'use client';

import { useQuery } from '@apollo/client/react';
import { GET_LEADS } from '@/graphql/queries/leads';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, GitBranch, Users } from 'lucide-react';
import Link from 'next/link';
import type { Lead } from '@/types';

const statusColumns: { status: string; label: string; color: string }[] = [
  { status: 'NEW', label: 'New', color: 'bg-blue-500' },
  { status: 'CONTACTED', label: 'Contacted', color: 'bg-amber-500' },
  { status: 'QUALIFIED', label: 'Qualified', color: 'bg-emerald-500' },
  { status: 'CONVERTED', label: 'Converted', color: 'bg-purple-500' },
  { status: 'UNQUALIFIED', label: 'Unqualified', color: 'bg-slate-500' },
];

export default function PipelinePage() {
  const { data, loading, error, refetch } = useQuery(GET_LEADS, {
    fetchPolicy: 'cache-and-network',
  });

  const leads = data?.leads || [];

  // Group leads by status
  const leadsByStatus = statusColumns.reduce((acc, col) => {
    acc[col.status] = leads.filter((lead: Lead) => lead.status === col.status);
    return acc;
  }, {} as Record<string, Lead[]>);

  if (loading && !data) {
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
        <Button onClick={() => refetch()} variant="outline">
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Pipeline</h1>
          <p className="text-slate-600 mt-1">
            Visualize your leads by status
          </p>
        </div>
        <Link href="/leads">
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Users className="w-4 h-4 mr-2" />
            Manage Leads
          </Button>
        </Link>
      </div>

      {/* Pipeline Board */}
      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4">
          {statusColumns.map((column) => (
            <div key={column.status} className="w-72 flex-shrink-0">
              <div className="bg-slate-100 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${column.color}`} />
                  <h3 className="font-semibold text-slate-700">{column.label}</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {leadsByStatus[column.status]?.length || 0}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {(leadsByStatus[column.status] || []).map((lead: Lead) => (
                    <Card key={lead.id} className="bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <p className="font-medium text-slate-900 truncate">
                          {lead.firstName} {lead.lastName}
                        </p>
                        <p className="text-sm text-slate-500 truncate">{lead.email}</p>
                        {lead.companyName && (
                          <p className="text-xs text-slate-400 mt-1 truncate">{lead.companyName}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {(leadsByStatus[column.status] || []).length === 0 && (
                    <div className="text-center py-4 text-slate-400 text-sm">
                      No leads
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {leads.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <GitBranch className="w-16 h-16 text-slate-300 mb-4" />
          <p className="text-slate-500 text-lg mb-2">No leads in pipeline</p>
          <p className="text-slate-400 mb-4">Create your first lead to get started</p>
          <Link href="/leads">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Users className="w-4 h-4 mr-2" />
              Go to Leads
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
