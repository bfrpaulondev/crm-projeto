'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_OPPORTUNITIES, GET_STAGES } from '@/graphql/queries/leads';
import { CREATE_OPPORTUNITY_MUTATION, UPDATE_OPPORTUNITY_STAGE_MUTATION } from '@/graphql/mutations/leads';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, GitBranch, Plus, AlertCircle, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import type { Opportunity } from '@/types';

const stageLabels: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  CLOSED_WON: 'Won',
  CLOSED_LOST: 'Lost',
};

const stageColors: Record<string, string> = {
  NEW: 'bg-blue-500',
  CONTACTED: 'bg-amber-500',
  QUALIFIED: 'bg-emerald-500',
  PROPOSAL: 'bg-purple-500',
  NEGOTIATION: 'bg-indigo-500',
  CLOSED_WON: 'bg-green-500',
  CLOSED_LOST: 'bg-red-500',
};

export default function PipelinePage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOpportunity, setNewOpportunity] = useState({
    name: '',
    amount: '',
    stage: 'NEW',
    probability: 50,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data: opportunitiesData, loading: opportunitiesLoading, error: opportunitiesError, refetch } = useQuery(GET_OPPORTUNITIES, {
    fetchPolicy: 'cache-and-network',
  });

  const { data: stagesData } = useQuery(GET_STAGES);

  const [createOpportunity, { loading: creating }] = useMutation(CREATE_OPPORTUNITY_MUTATION, {
    refetchQueries: [{ query: GET_OPPORTUNITIES }],
    onCompleted: () => {
      toast.success('Opportunity created successfully');
      setShowCreateForm(false);
      setNewOpportunity({ name: '', amount: '', stage: 'NEW', probability: 50 });
    },
    onError: (err) => {
      setFormError(err.message);
    },
  });

  const [updateStage, { loading: updatingStage }] = useMutation(UPDATE_OPPORTUNITY_STAGE_MUTATION, {
    onCompleted: () => {
      toast.success('Stage updated');
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const opportunities = opportunitiesData?.opportunities || [];

  const stages = useMemo(() => {
    if (!stagesData?.stages) return Object.keys(stageLabels);
    return stagesData.stages.map((s: { id: string; name: string }) => s.name);
  }, [stagesData]);

  const opportunitiesByStage = useMemo(() => {
    const grouped: Record<string, Opportunity[]> = {};
    stages.forEach((stage: string) => {
      grouped[stage] = opportunities.filter((o: Opportunity) => o.stage === stage);
    });
    return grouped;
  }, [opportunities, stages]);

  const handleCreateOpportunity = async () => {
    setFormError(null);
    
    if (!newOpportunity.name.trim()) {
      setFormError('Opportunity name is required');
      return;
    }
    
    if (!newOpportunity.amount || parseFloat(newOpportunity.amount) <= 0) {
      setFormError('Please enter a valid amount');
      return;
    }

    await createOpportunity({
      variables: {
        input: {
          name: newOpportunity.name.trim(),
          amount: parseFloat(newOpportunity.amount),
          stage: newOpportunity.stage,
          probability: newOpportunity.probability,
        },
      },
    });
  };

  const handleStageChange = async (opportunityId: string, newStage: string) => {
    await updateStage({
      variables: { id: opportunityId, stage: newStage },
    });
  };

  if (opportunitiesLoading && !opportunitiesData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (opportunitiesError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">Failed to load pipeline</p>
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
            Visualize and manage your sales pipeline
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Opportunity
        </Button>
      </div>

      {/* Pipeline Board */}
      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4">
          {stages.map((stage: string) => (
            <div key={stage} className="w-72 flex-shrink-0">
              <div className="bg-slate-100 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${stageColors[stage] || 'bg-slate-400'}`} />
                  <h3 className="font-semibold text-slate-700">{stageLabels[stage] || stage}</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {opportunitiesByStage[stage]?.length || 0}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {(opportunitiesByStage[stage] || []).map((opportunity: Opportunity) => (
                    <Card key={opportunity.id} className="bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <p className="font-medium text-slate-900 truncate">{opportunity.name}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                          <DollarSign className="w-3 h-3" />
                          <span>{opportunity.amount?.toLocaleString() || 0}</span>
                        </div>
                        {opportunity.expectedCloseDate && (
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(opportunity.expectedCloseDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="mt-2">
                          <Select
                            value={opportunity.stage || 'NEW'}
                            onValueChange={(value) => handleStageChange(opportunity.id, value)}
                            disabled={updatingStage}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {stages.map((s: string) => (
                                <SelectItem key={s} value={s}>
                                  {stageLabels[s] || s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(opportunitiesByStage[stage] || []).length === 0 && (
                    <div className="text-center py-4 text-slate-400 text-sm">
                      No opportunities
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {opportunities.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <GitBranch className="w-16 h-16 text-slate-300 mb-4" />
          <p className="text-slate-500 text-lg mb-2">No opportunities in pipeline</p>
          <p className="text-slate-400 mb-4">Create your first opportunity to get started</p>
          <Button onClick={() => setShowCreateForm(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Opportunity
          </Button>
        </div>
      )}

      {/* Create Opportunity Modal */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create Opportunity</DialogTitle>
            <DialogDescription>
              Add a new opportunity to your pipeline
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {formError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm">{formError}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Opportunity Name *</Label>
              <Input
                id="name"
                value={newOpportunity.name}
                onChange={(e) => setNewOpportunity({ ...newOpportunity, name: e.target.value })}
                placeholder="Enterprise License Deal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($) *</Label>
              <Input
                id="amount"
                type="number"
                value={newOpportunity.amount}
                onChange={(e) => setNewOpportunity({ ...newOpportunity, amount: e.target.value })}
                placeholder="50000"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage">Stage</Label>
              <Select
                value={newOpportunity.stage}
                onValueChange={(value) => setNewOpportunity({ ...newOpportunity, stage: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage: string) => (
                    <SelectItem key={stage} value={stage}>
                      {stageLabels[stage] || stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="probability">Probability: {newOpportunity.probability}%</Label>
              <input
                id="probability"
                type="range"
                min="0"
                max="100"
                value={newOpportunity.probability}
                onChange={(e) =>
                  setNewOpportunity({ ...newOpportunity, probability: parseInt(e.target.value) })
                }
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateOpportunity}
              disabled={creating}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Opportunity'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
