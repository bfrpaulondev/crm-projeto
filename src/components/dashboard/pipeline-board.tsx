'use client';

import { useQuery } from '@apollo/client/react';
import { GET_LEADS } from '@/graphql/queries/leads';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Lead } from '@/types';
import { Loader2, DollarSign, Calendar, User } from 'lucide-react';

interface PipelineBoardProps {
  onRefresh?: () => void;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: 'New', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  CONTACTED: { label: 'Contacted', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  QUALIFIED: { label: 'Qualified', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  CONVERTED: { label: 'Converted', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  UNQUALIFIED: { label: 'Unqualified', color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
};

const statusOrder: string[] = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'CONVERTED',
  'UNQUALIFIED',
];

export function PipelineBoard({ onRefresh }: PipelineBoardProps) {
  const { data, loading, error } = useQuery(GET_LEADS, {
    fetchPolicy: 'cache-and-network',
  });

  const leads = data?.leads || [];

  // Group leads by status
  const leadsByStatus = statusOrder.reduce((acc, status) => {
    acc[status] = leads.filter((lead: Lead) => lead.status === status);
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
      <div className="flex items-center justify-center h-32 text-red-500">
        <p>Failed to load pipeline</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {statusOrder.map((status) => {
        const config = statusConfig[status];
        const statusLeads = leadsByStatus[status] || [];

        return (
          <div
            key={status}
            className="flex-shrink-0 w-72"
          >
            <Card className={'h-full border-t-4 ' + config.bg}>
              <CardContent className="p-3 space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className={'text-sm font-semibold ' + config.color}>
                    {config.label}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {statusLeads.length}
                  </Badge>
                </div>
                
                {statusLeads.map((lead: Lead) => (
                  <div
                    key={lead.id}
                    className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium text-slate-900 line-clamp-1">
                        {lead.firstName} {lead.lastName}
                      </h4>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                      
                      {lead.companyName && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{lead.companyName}</span>
                        </div>
                      )}
                      
                      {lead.createdAt && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {statusLeads.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-xs text-slate-400">No leads</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
