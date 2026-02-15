'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_LEADS } from '@/graphql/queries/leads';
import { LeadForm } from '@/components/forms/lead-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus,
  Search,
  Loader2,
  Users,
} from 'lucide-react';
import { Lead, LeadStatus } from '@/types';
import { formatDate, getInitials } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';

const statusStyles: Record<LeadStatus, { bg: string; text: string }> = {
  NEW: { bg: 'bg-blue-100', text: 'text-blue-700' },
  CONTACTED: { bg: 'bg-amber-100', text: 'text-amber-700' },
  QUALIFIED: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  UNQUALIFIED: { bg: 'bg-slate-100', text: 'text-slate-700' },
  CONVERTED: { bg: 'bg-purple-100', text: 'text-purple-700' },
};

export default function LeadsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_LEADS, {
    fetchPolicy: 'cache-and-network',
  });

  const allLeads = data?.leads || [];

  // Filter leads client-side
  const leads = useMemo(() => {
    return allLeads.filter((lead: Lead) => {
      const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;
      const matchesSearch = !searchQuery || 
        lead.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.companyName || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });
  }, [allLeads, statusFilter, searchQuery]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">Failed to load leads</p>
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
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Leads</h1>
          <p className="text-slate-600 mt-1">Manage your sales leads and prospects</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Lead List
            {!loading && (
              <span className="text-sm font-normal text-slate-500">
                ({leads.length} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search by name, email, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as LeadStatus | 'ALL')}
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="CONTACTED">Contacted</SelectItem>
                <SelectItem value="QUALIFIED">Qualified</SelectItem>
                <SelectItem value="UNQUALIFIED">Unqualified</SelectItem>
                <SelectItem value="CONVERTED">Converted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">No leads found</p>
              <Button
                onClick={() => setShowCreateForm(true)}
                variant="outline"
              >
                Add your first lead
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Lead</TableHead>
                    <TableHead className="hidden md:table-cell">Company</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead: Lead) => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer hover:bg-slate-50/50"
                      onClick={() => window.location.href = `/leads/${lead.id}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 bg-purple-100">
                            <AvatarFallback className="bg-purple-100 text-purple-700 text-sm font-medium">
                              {getInitials(lead.firstName, lead.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-900 hover:text-purple-600 transition-colors">
                              {lead.firstName} {lead.lastName}
                            </p>
                            <p className="text-xs text-slate-500">{lead.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-slate-600">
                        {lead.companyName || '-'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant="secondary"
                          className={cn(
                            'font-medium',
                            statusStyles[lead.status]?.bg,
                            statusStyles[lead.status]?.text
                          )}
                        >
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-slate-500 text-sm">
                        {formatDate(lead.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Lead Modal */}
      <LeadForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
