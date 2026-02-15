'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_LEADS } from '@/graphql/queries/leads';
import { QUALIFY_LEAD_MUTATION, CONVERT_LEAD_MUTATION } from '@/graphql/mutations/leads';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, GitBranch, Users, GripVertical, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Lead } from '@/types';

const statusColumns: { status: string; label: string; color: string; description: string }[] = [
  { status: 'NEW', label: 'New', color: 'bg-blue-500', description: 'Novos leads' },
  { status: 'CONTACTED', label: 'Contacted', color: 'bg-amber-500', description: 'Já contatados' },
  { status: 'QUALIFIED', label: 'Qualified', color: 'bg-emerald-500', description: 'Qualificados' },
  { status: 'CONVERTED', label: 'Converted', color: 'bg-purple-500', description: 'Convertidos' },
  { status: 'UNQUALIFIED', label: 'Unqualified', color: 'bg-slate-500', description: 'Não qualificados' },
];

export default function PipelinePage() {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [processingLead, setProcessingLead] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_LEADS, {
    fetchPolicy: 'cache-and-network',
  });

  const [qualifyLead] = useMutation(QUALIFY_LEAD_MUTATION, {
    onCompleted: () => {
      toast.success('Lead qualificado com sucesso!');
      setProcessingLead(null);
      refetch();
    },
    onError: (err) => {
      toast.error(`Erro ao qualificar lead: ${err.message}`);
      setProcessingLead(null);
    },
  });

  const [convertLead] = useMutation(CONVERT_LEAD_MUTATION, {
    onCompleted: () => {
      toast.success('Lead convertido com sucesso!');
      setProcessingLead(null);
      refetch();
    },
    onError: (err) => {
      toast.error(`Erro ao converter lead: ${err.message}`);
      setProcessingLead(null);
    },
  });

  const leads = data?.leads || [];

  // Group leads by status
  const leadsByStatus = statusColumns.reduce((acc, col) => {
    acc[col.status] = leads.filter((lead: Lead) => lead.status === col.status);
    return acc;
  }, {} as Record<string, Lead[]>);

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', lead.id);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedLead) return;

    // Check if status actually changed
    if (draggedLead.status === targetStatus) {
      setDraggedLead(null);
      return;
    }

    setProcessingLead(draggedLead.id);

    try {
      if (targetStatus === 'QUALIFIED') {
        await qualifyLead({ variables: { id: draggedLead.id } });
      } else if (targetStatus === 'CONVERTED') {
        await convertLead({ variables: { leadId: draggedLead.id, createOpportunity: true } });
      } else {
        // For other status changes, we need to inform the user
        toast.info(`Para mudar para "${targetStatus}", use as ações no card do lead`);
        setProcessingLead(null);
      }
    } catch (err) {
      console.error(err);
      setProcessingLead(null);
    }

    setDraggedLead(null);
  };

  const handleQualify = async (leadId: string) => {
    setProcessingLead(leadId);
    await qualifyLead({ variables: { id: leadId } });
  };

  const handleConvert = async (leadId: string) => {
    setProcessingLead(leadId);
    await convertLead({ variables: { leadId: leadId, createOpportunity: true } });
  };

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
            Arraste leads entre estágios para qualificar ou converter
          </p>
        </div>
        <Link href="/leads">
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Users className="w-4 h-4 mr-2" />
            Manage Leads
          </Button>
        </Link>
      </div>

      {/* Legend */}
      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
        <GripVertical className="w-4 h-4" />
        <p><strong>Dica:</strong> Arraste leads para as colunas <strong>Qualified</strong> ou <strong>Converted</strong> para mudar o status.</p>
      </div>

      {/* Pipeline Board */}
      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4">
          {statusColumns.map((column) => (
            <div
              key={column.status}
              className={cn(
                "w-72 flex-shrink-0 rounded-lg transition-all duration-200",
                dragOverColumn === column.status && "ring-2 ring-purple-500 ring-offset-2",
                column.status === 'QUALIFIED' && dragOverColumn === column.status && "bg-emerald-50",
                column.status === 'CONVERTED' && dragOverColumn === column.status && "bg-purple-50"
              )}
              onDragOver={(e) => handleDragOver(e, column.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 h-full">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${column.color}`} />
                  <h3 className="font-semibold text-slate-700 dark:text-slate-200">{column.label}</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {leadsByStatus[column.status]?.length || 0}
                  </Badge>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {(leadsByStatus[column.status] || []).map((lead: Lead) => {
                    const isProcessing = processingLead === lead.id;
                    const canDrag = lead.status === 'NEW' || lead.status === 'CONTACTED';

                    return (
                      <Card
                        key={lead.id}
                        draggable={canDrag && !isProcessing}
                        onDragStart={(e) => handleDragStart(e, lead)}
                        className={cn(
                          "bg-white dark:bg-slate-900 shadow-sm transition-all",
                          canDrag && "cursor-grab active:cursor-grabbing hover:shadow-md",
                          isProcessing && "opacity-50",
                          draggedLead?.id === lead.id && "opacity-50 rotate-2"
                        )}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                                {lead.firstName} {lead.lastName}
                              </p>
                              <p className="text-sm text-slate-500 truncate">{lead.email}</p>
                              {lead.companyName && (
                                <p className="text-xs text-slate-400 mt-1 truncate">{lead.companyName}</p>
                              )}
                            </div>
                            {canDrag && (
                              <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" />
                            )}
                          </div>

                          {/* Action buttons for NEW and CONTACTED leads */}
                          {(lead.status === 'NEW' || lead.status === 'CONTACTED') && (
                            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-7 text-xs"
                                onClick={() => handleQualify(lead.id)}
                                disabled={isProcessing}
                              >
                                <Check className="w-3 h-3 mr-1 text-emerald-500" />
                                Qualificar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-7 text-xs"
                                onClick={() => handleConvert(lead.id)}
                                disabled={isProcessing}
                              >
                                <ArrowRight className="w-3 h-3 mr-1 text-purple-500" />
                                Converter
                              </Button>
                            </div>
                          )}

                          {isProcessing && (
                            <div className="flex items-center justify-center mt-2">
                              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  {(leadsByStatus[column.status] || []).length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
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
