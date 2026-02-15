'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_ACTIVITIES } from '@/graphql/queries/activities';
import { GET_LEADS } from '@/graphql/queries/leads';
import { DELETE_ACTIVITY_MUTATION, COMPLETE_ACTIVITY_MUTATION } from '@/graphql/mutations/activities';
import { ActivityForm } from '@/components/forms/activity-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Plus, Phone, Mail, Calendar as CalendarIcon, CheckSquare, FileText, Trash2, Check, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Activity, ActivityType, ActivityStatus, ActivityPriority, Lead } from '@/types';

const ACTIVITY_ICONS: Record<ActivityType, React.ElementType> = {
  CALL: Phone,
  EMAIL: Mail,
  MEETING: CalendarIcon,
  TASK: CheckSquare,
  NOTE: FileText,
};

const STATUS_COLORS: Record<ActivityStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-slate-100 text-slate-600',
};

const PRIORITY_COLORS: Record<ActivityPriority, string> = {
  LOW: 'border-slate-300',
  MEDIUM: 'border-blue-400',
  HIGH: 'border-orange-400',
  URGENT: 'border-red-500',
};

export default function ActivitiesPage() {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [filter, setFilter] = useState<'all' | ActivityStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | ActivityType>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const { data: activitiesData, loading: activitiesLoading, error } = useQuery(GET_ACTIVITIES, {
    fetchPolicy: 'cache-and-network',
  });

  const { data: leadsData } = useQuery(GET_LEADS);

  const [deleteActivity, { loading: deleting }] = useMutation(DELETE_ACTIVITY_MUTATION, {
    refetchQueries: [{ query: GET_ACTIVITIES }],
    onCompleted: () => {
      toast.success('Activity deleted successfully');
      setDeleteDialogOpen(false);
      setActivityToDelete(null);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const [completeActivity, { loading: completing }] = useMutation(COMPLETE_ACTIVITY_MUTATION, {
    refetchQueries: [{ query: GET_ACTIVITIES }],
    onCompleted: () => {
      toast.success('Activity marked as complete');
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const activities = activitiesData?.activities || [];
  const leads = leadsData?.leads || [];

  const filteredActivities = useMemo(() => {
    return activities.filter((activity: Activity) => {
      if (filter !== 'all' && activity.status !== filter) return false;
      if (typeFilter !== 'all' && activity.type !== typeFilter) return false;
      return true;
    });
  }, [activities, filter, typeFilter]);

  const stats = useMemo(() => {
    return {
      total: activities.length,
      pending: activities.filter((a: Activity) => a.status === 'PENDING').length,
      inProgress: activities.filter((a: Activity) => a.status === 'IN_PROGRESS').length,
      completed: activities.filter((a: Activity) => a.status === 'COMPLETED').length,
      overdue: activities.filter((a: Activity) => {
        if (!a.dueDate || a.status === 'COMPLETED' || a.status === 'CANCELLED') return false;
        return new Date(a.dueDate) < new Date();
      }).length,
    };
  }, [activities]);

  const calendarActivities = useMemo(() => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    const days = eachDayOfInterval({ start, end });
    
    return days.map((day) => {
      const dayActivities = activities.filter((a: Activity) => {
        if (!a.dueDate) return false;
        return isSameDay(new Date(a.dueDate), day);
      });
      return {
        date: day,
        activities: dayActivities,
      };
    });
  }, [activities, calendarMonth]);

  const handleDelete = async () => {
    if (activityToDelete) {
      await deleteActivity({ variables: { id: activityToDelete.id } });
    }
  };

  const handleComplete = async (activity: Activity) => {
    await completeActivity({ variables: { id: activity.id } });
  };

  const handleEdit = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsFormOpen(true);
  };

  if (activitiesLoading) {
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
        <Button onClick={() => window.location.reload()}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Activities</h1>
          <p className="text-slate-600 mt-1">Manage your tasks, calls, meetings, and notes</p>
        </div>
        <Button onClick={() => { setSelectedActivity(null); setIsFormOpen(true); }} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          New Activity
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
              <CheckSquare className="h-8 w-8 text-purple-100 stroke-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-xs text-slate-500">Pending</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-100 stroke-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                <p className="text-xs text-slate-500">In Progress</p>
              </div>
              <Loader2 className="h-8 w-8 text-blue-100 stroke-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                <p className="text-xs text-slate-500">Completed</p>
              </div>
              <Check className="h-8 w-8 text-green-100 stroke-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                <p className="text-xs text-slate-500">Overdue</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-100 stroke-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="CALL">Calls</SelectItem>
            <SelectItem value="EMAIL">Emails</SelectItem>
            <SelectItem value="MEETING">Meetings</SelectItem>
            <SelectItem value="TASK">Tasks</SelectItem>
            <SelectItem value="NOTE">Notes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* View Tabs */}
      <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list" className="mt-4">
          {filteredActivities.length === 0 ? (
            <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
              <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No activities found</h3>
              <p className="text-slate-500 mb-4">Create your first activity to get started</p>
              <Button onClick={() => { setSelectedActivity(null); setIsFormOpen(true); }} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                New Activity
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((activity: Activity) => {
                const Icon = ACTIVITY_ICONS[activity.type];
                const isOverdue = activity.dueDate && 
                  new Date(activity.dueDate) < new Date() && 
                  activity.status !== 'COMPLETED' && 
                  activity.status !== 'CANCELLED';

                return (
                  <div
                    key={activity.id}
                    className={cn(
                      'bg-white rounded-lg border-l-4 shadow-sm p-4 transition-all hover:shadow-md',
                      PRIORITY_COLORS[activity.priority || 'MEDIUM'],
                      activity.status === 'COMPLETED' && 'opacity-60',
                      isOverdue && 'border-l-red-500 bg-red-50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={cn(
                          'p-2 rounded-lg',
                          activity.type === 'CALL' ? 'bg-blue-100' :
                          activity.type === 'EMAIL' ? 'bg-purple-100' :
                          activity.type === 'MEETING' ? 'bg-green-100' :
                          activity.type === 'TASK' ? 'bg-orange-100' :
                          'bg-slate-100'
                        )}>
                          <Icon className={cn(
                            'w-5 h-5',
                            activity.type === 'CALL' ? 'text-blue-600' :
                            activity.type === 'EMAIL' ? 'text-purple-600' :
                            activity.type === 'MEETING' ? 'text-green-600' :
                            activity.type === 'TASK' ? 'text-orange-600' :
                            'text-slate-600'
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={cn(
                              'font-medium',
                              activity.status === 'COMPLETED' && 'line-through text-slate-500'
                            )}>
                              {activity.subject}
                            </h3>
                            <Badge variant="secondary" className={STATUS_COLORS[activity.status]}>
                              {activity.status}
                            </Badge>
                            {isOverdue && (
                              <Badge variant="destructive" className="text-xs">
                                Overdue
                              </Badge>
                            )}
                          </div>
                          {activity.description && (
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                              {activity.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            {activity.dueDate && (
                              <span className={cn(isOverdue && 'text-red-600 font-medium')}>
                                Due: {format(new Date(activity.dueDate), 'MMM d, yyyy h:mm a')}
                              </span>
                            )}
                            {activity.lead && (
                              <span>
                                Lead: {activity.lead.firstName} {activity.lead.lastName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {activity.status !== 'COMPLETED' && activity.status !== 'CANCELLED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleComplete(activity)}
                            disabled={completing}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(activity)}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setActivityToDelete(activity); setDeleteDialogOpen(true); }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar" className="mt-4">
          <div className="bg-white rounded-lg border shadow-sm">
            {/* Calendar Navigation */}
            <div className="flex items-center justify-between p-4 border-b">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
              >
                Previous
              </Button>
              <h3 className="font-semibold text-lg">
                {format(calendarMonth, 'MMMM yyyy')}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
              >
                Next
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-slate-200">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="bg-slate-50 p-2 text-center text-sm font-medium text-slate-600">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {calendarActivities.map((day) => {
                const isCurrentMonth = isSameMonth(day.date, calendarMonth);
                const isToday = isSameDay(day.date, new Date());
                
                return (
                  <div
                    key={day.date.toISOString()}
                    className={cn(
                      'bg-white min-h-[100px] p-2',
                      !isCurrentMonth && 'bg-slate-50 text-slate-400',
                      isToday && 'bg-purple-50'
                    )}
                  >
                    <p className={cn(
                      'text-sm font-medium mb-1',
                      isToday && 'text-purple-600'
                    )}>
                      {format(day.date, 'd')}
                    </p>
                    <div className="space-y-1">
                      {day.activities.slice(0, 3).map((activity: Activity) => {
                        const Icon = ACTIVITY_ICONS[activity.type];
                        return (
                          <div
                            key={activity.id}
                            className={cn(
                              'flex items-center gap-1 px-1.5 py-0.5 rounded text-xs truncate cursor-pointer hover:opacity-80',
                              activity.type === 'CALL' ? 'bg-blue-100 text-blue-700' :
                              activity.type === 'EMAIL' ? 'bg-purple-100 text-purple-700' :
                              activity.type === 'MEETING' ? 'bg-green-100 text-green-700' :
                              activity.type === 'TASK' ? 'bg-orange-100 text-orange-700' :
                              'bg-slate-100 text-slate-700'
                            )}
                            onClick={() => handleEdit(activity)}
                            title={activity.subject}
                          >
                            <Icon className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{activity.subject}</span>
                          </div>
                        );
                      })}
                      {day.activities.length > 3 && (
                        <p className="text-xs text-slate-500 px-1.5">
                          +{day.activities.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Activity Form Dialog */}
      <ActivityForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        activity={selectedActivity}
        leads={leads}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{activityToDelete?.subject}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
