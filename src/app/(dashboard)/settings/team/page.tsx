'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_USERS } from '@/graphql/queries/users';
import { DELETE_USER_MUTATION, UPDATE_USER_MUTATION } from '@/graphql/mutations/users';
import { InviteUserForm } from '@/components/forms/invite-user-form';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, Plus, MoreVertical, Trash2, Shield, Crown, User, Eye, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { getInitials } from '@/lib/utils/formatters';
import type { User as UserType, UserRole } from '@/types';

const ROLE_STYLES: Record<UserRole, { badge: string; icon: React.ElementType; label: string }> = {
  ADMIN: { badge: 'bg-purple-100 text-purple-700', icon: Crown, label: 'Administrator' },
  MANAGER: { badge: 'bg-blue-100 text-blue-700', icon: Shield, label: 'Manager' },
  SALES_REP: { badge: 'bg-green-100 text-green-700', icon: User, label: 'Sales Rep' },
  READ_ONLY: { badge: 'bg-slate-100 text-slate-700', icon: Eye, label: 'Read Only' },
};

export default function TeamPage() {
  const { user: currentUser } = useAuth();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);

  const { data, loading, error } = useQuery(GET_USERS, {
    fetchPolicy: 'cache-and-network',
  });

  const [deleteUser, { loading: deleting }] = useMutation(DELETE_USER_MUTATION, {
    refetchQueries: [{ query: GET_USERS }],
    onCompleted: () => {
      toast.success('User removed successfully');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const [updateUser] = useMutation(UPDATE_USER_MUTATION, {
    refetchQueries: [{ query: GET_USERS }],
    onCompleted: () => {
      toast.success('User role updated');
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const users = data?.users || [];

  const handleDelete = async () => {
    if (userToDelete) {
      await deleteUser({ variables: { id: userToDelete.id } });
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    await updateUser({ variables: { id: userId, role: newRole } });
  };

  const canManageUser = (targetUser: UserType) => {
    if (!currentUser) return false;
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') return false;
    if (targetUser.id === currentUser.id) return false;
    if (currentUser.role === 'MANAGER' && targetUser.role === 'ADMIN') return false;
    return true;
  };

  if (loading) {
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
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Team</h1>
          <p className="text-slate-600 mt-1">Manage your team members and their roles</p>
        </div>
        {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER') && (
          <Button onClick={() => setIsInviteOpen(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{users.length}</p>
            <p className="text-xs text-slate-500">Total Members</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-purple-600">
              {users.filter((u: UserType) => u.role === 'ADMIN').length}
            </p>
            <p className="text-xs text-slate-500">Admins</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-blue-600">
              {users.filter((u: UserType) => u.role === 'MANAGER').length}
            </p>
            <p className="text-xs text-slate-500">Managers</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-600">
              {users.filter((u: UserType) => u.role === 'SALES_REP').length}
            </p>
            <p className="text-xs text-slate-500">Sales Reps</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members List */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {users.length} member{users.length !== 1 ? 's' : ''} in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No team members</h3>
              <p className="text-slate-500 mb-4">Invite your first team member to get started</p>
              <Button onClick={() => setIsInviteOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((member: UserType) => {
                const roleStyle = ROLE_STYLES[member.role];
                const RoleIcon = roleStyle.icon;
                const isCurrentUser = member.id === currentUser?.id;

                return (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                      isCurrentUser ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={isCurrentUser ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700'}>
                          {getInitials(member.firstName, member.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {member.firstName} {member.lastName}
                          </p>
                          {isCurrentUser && (
                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                              You
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Mail className="w-3 h-3" />
                          {member.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className={roleStyle.badge}>
                        <RoleIcon className="w-3 h-3 mr-1" />
                        {roleStyle.label}
                      </Badge>
                      {canManageUser(member) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'ADMIN')}>
                              <Crown className="w-4 h-4 mr-2" />
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'MANAGER')}>
                              <Shield className="w-4 h-4 mr-2" />
                              Make Manager
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'SALES_REP')}>
                              <User className="w-4 h-4 mr-2" />
                              Make Sales Rep
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'READ_ONLY')}>
                              <Eye className="w-4 h-4 mr-2" />
                              Make Read Only
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => { setUserToDelete(member); setDeleteDialogOpen(true); }}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite User Dialog */}
      <InviteUserForm open={isInviteOpen} onOpenChange={setIsInviteOpen} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {userToDelete?.firstName} {userToDelete?.lastName} from the team? They will lose access to all resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
