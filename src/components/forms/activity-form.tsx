'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@apollo/client/react';
import { CREATE_ACTIVITY_MUTATION, UPDATE_ACTIVITY_MUTATION } from '@/graphql/mutations/activities';
import { GET_ACTIVITIES } from '@/graphql/queries/activities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Loader2, AlertCircle, Phone, Mail, Calendar, CheckSquare, FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { Activity, ActivityType, ActivityPriority, Lead } from '@/types';

const activitySchema = z.object({
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE']),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional(),
  leadId: z.string().optional(),
  assignedToId: z.string().optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

interface ActivityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: Activity | null;
  leads?: Lead[];
  onSuccess?: () => void;
}

const ACTIVITY_TYPES: { value: ActivityType; label: string; icon: React.ElementType }[] = [
  { value: 'CALL', label: 'Call', icon: Phone },
  { value: 'EMAIL', label: 'Email', icon: Mail },
  { value: 'MEETING', label: 'Meeting', icon: Calendar },
  { value: 'TASK', label: 'Task', icon: CheckSquare },
  { value: 'NOTE', label: 'Note', icon: FileText },
];

const PRIORITIES: { value: ActivityPriority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'text-slate-600' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-blue-600' },
  { value: 'HIGH', label: 'High', color: 'text-orange-600' },
  { value: 'URGENT', label: 'Urgent', color: 'text-red-600' },
];

export function ActivityForm({ open, onOpenChange, activity, leads = [], onSuccess }: ActivityFormProps) {
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!activity;

  const [createActivity, { loading: creating }] = useMutation(CREATE_ACTIVITY_MUTATION, {
    refetchQueries: [{ query: GET_ACTIVITIES }],
    onCompleted: () => {
      toast.success('Activity created successfully');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const [updateActivity, { loading: updating }] = useMutation(UPDATE_ACTIVITY_MUTATION, {
    refetchQueries: [{ query: GET_ACTIVITIES }],
    onCompleted: () => {
      toast.success('Activity updated successfully');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const isLoading = creating || updating;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      type: activity?.type || 'TASK',
      subject: activity?.subject || '',
      description: activity?.description || '',
      priority: activity?.priority || 'MEDIUM',
      dueDate: activity?.dueDate ? activity.dueDate.slice(0, 16) : '',
      leadId: activity?.leadId || '',
      assignedToId: activity?.assignedToId || '',
    },
  });

  const onSubmit = async (data: ActivityFormData) => {
    setError(null);
    
    if (isEditing) {
      await updateActivity({
        variables: {
          id: activity.id,
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        },
      });
    } else {
      await createActivity({
        variables: {
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        },
      });
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onOpenChange(false);
  };

  const selectedType = watch('type');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Activity' : 'Create New Activity'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the activity details.' : 'Fill in the details to create a new activity.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Activity Type */}
          <div className="space-y-2">
            <Label>Type *</Label>
            <div className="grid grid-cols-5 gap-2">
              {ACTIVITY_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setValue('type', type.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                      selectedType === type.value
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{type.label}</span>
                  </button>
                );
              })}
            </div>
            <input type="hidden" {...register('type')} />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              {...register('subject')}
              placeholder="Enter activity subject"
              className={errors.subject ? 'border-red-500' : ''}
            />
            {errors.subject && (
              <p className="text-sm text-red-500">{errors.subject.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Add details about this activity..."
              rows={3}
            />
          </div>

          {/* Priority and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={watch('priority')}
                onValueChange={(value) => setValue('priority', value as ActivityPriority)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      <span className={priority.color}>{priority.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                {...register('dueDate')}
              />
            </div>
          </div>

          {/* Lead Assignment */}
          {leads.length > 0 && (
            <div className="space-y-2">
              <Label>Related Lead</Label>
              <Select
                value={watch('leadId') || ''}
                onValueChange={(value) => setValue('leadId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a lead" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No lead</SelectItem>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.firstName} {lead.lastName} {lead.companyName ? `(${lead.companyName})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Activity' : 'Create Activity'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
