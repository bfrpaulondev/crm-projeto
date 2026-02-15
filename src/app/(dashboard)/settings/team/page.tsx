'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_USERS } from '@/graphql/queries/users';
import { DELETE_USER_MUTATION, UPDATE_USER_MUTATION, INVITE_USER_MUTATION } from '@/graphql/mutations/users';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, Plus, MoreVertical, Trash2, Shield, Crown, User, Eye, Mail, UserPlus, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { getInitials } from '@/lib/utils/formatters';
import type { User as UserType, UserRole } from '@/types';

const ROLE_STYLES: Record<UserRole, { badge: string; icon: React.ElementType; label: string }> = {
  ADMIN: { badge: 'bg-purple-100 text-purple-700', icon: Crown, label: 'Administrador' },
  MANAGER: { badge: 'bg-blue-100 text-blue-700', icon: Shield, label: 'Gerente' },
  SALES_REP: { badge: 'bg-green-100 text-green-700', icon: User, label: 'Vendedor' },
  READ_ONLY: { badge: 'bg-slate-100 text-slate-700', icon: Eye, label: 'Somente Leitura' },
};

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'ADMIN', label: 'Administrador', description: 'Acesso total a todas as funcionalidades' },
  { value: 'MANAGER', label: 'Gerente', description: 'Gerencia equipe e leads' },
  { value: 'SALES_REP', label: 'Vendedor', description: 'Gerencia seus próprios leads' },
  { value: 'READ_ONLY', label: 'Somente Leitura', description: 'Apenas visualização' },
];

export default function TeamPage() {
  const { user: currentUser } = useAuth();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'SALES_REP',
  });

  const { data, loading, error, refetch } = useQuery(GET_USERS, {
    fetchPolicy: 'cache-and-network',
  });

  const [deleteUser, { loading: deleting }] = useMutation(DELETE_USER_MUTATION, {
    refetchQueries: [{ query: GET_USERS }],
    onCompleted: () => {
      toast.success('Usuário removido com sucesso');
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
      toast.success('Role do usuário atualizada');
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const [inviteUser, { loading: inviting }] = useMutation(INVITE_USER_MUTATION, {
    refetchQueries: [{ query: GET_USERS }],
    onCompleted: () => {
      toast.success('Usuário convidado com sucesso');
      setIsInviteOpen(false);
      setInviteData({ email: '', firstName: '', lastName: '', role: 'SALES_REP' });
      setInviteError(null);
    },
    onError: (err) => {
      if (err.message.includes('Cannot query field "inviteUser"')) {
        setInviteError('A mutation inviteUser ainda não está disponível na API. Aguarde o deploy ou contate o administrador.');
      } else {
        setInviteError(err.message);
      }
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

  const handleInvite = async () => {
    setInviteError(null);
    
    if (!inviteData.email || !inviteData.firstName || !inviteData.lastName) {
      setInviteError('Todos os campos são obrigatórios');
      return;
    }

    await inviteUser({
      variables: {
        email: inviteData.email,
        firstName: inviteData.firstName,
        lastName: inviteData.lastName,
        role: inviteData.role,
      },
    });
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
        <Button onClick={() => refetch()}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Equipe</h1>
          <p className="text-slate-600 mt-1">Gerencie os membros da equipe e suas permissões</p>
        </div>
        {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER') && (
          <Button onClick={() => setIsInviteOpen(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Convidar Membro
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{users.length}</p>
            <p className="text-xs text-slate-500">Total de Membros</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-purple-600">
              {users.filter((u: UserType) => u.role === 'ADMIN').length}
            </p>
            <p className="text-xs text-slate-500">Administradores</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-blue-600">
              {users.filter((u: UserType) => u.role === 'MANAGER').length}
            </p>
            <p className="text-xs text-slate-500">Gerentes</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-600">
              {users.filter((u: UserType) => u.role === 'SALES_REP').length}
            </p>
            <p className="text-xs text-slate-500">Vendedores</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members List */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
          <CardDescription>
            {users.length} membro{users.length !== 1 ? 's' : ''} na sua organização
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">Nenhum membro na equipe</h3>
              <p className="text-slate-500 mb-4">Convide o primeiro membro para começar</p>
              <Button onClick={() => setIsInviteOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Convidar Membro
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((member: UserType) => {
                const roleStyle = ROLE_STYLES[member.role] || ROLE_STYLES.SALES_REP;
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
                              Você
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
                              Tornar Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'MANAGER')}>
                              <Shield className="w-4 h-4 mr-2" />
                              Tornar Gerente
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'SALES_REP')}>
                              <User className="w-4 h-4 mr-2" />
                              Tornar Vendedor
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'READ_ONLY')}>
                              <Eye className="w-4 h-4 mr-2" />
                              Somente Leitura
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => { setUserToDelete(member); setDeleteDialogOpen(true); }}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remover Usuário
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
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-600" />
              Convidar Membro
            </DialogTitle>
            <DialogDescription>
              Adicione um novo membro à equipe.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {inviteError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm">{inviteError}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-700">
                O novo membro receberá um email com as credenciais de acesso. A senha padrão será "TempPassword123!".
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-email">Email *</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colega@empresa.com"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invite-firstName">Nome *</Label>
                <Input
                  id="invite-firstName"
                  placeholder="João"
                  value={inviteData.firstName}
                  onChange={(e) => setInviteData({ ...inviteData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-lastName">Sobrenome *</Label>
                <Input
                  id="invite-lastName"
                  placeholder="Silva"
                  value={inviteData.lastName}
                  onChange={(e) => setInviteData({ ...inviteData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role *</Label>
              <Select
                value={inviteData.role}
                onValueChange={(value) => setInviteData({ ...inviteData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex flex-col">
                        <span>{role.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                {ROLES.find(r => r.value === inviteData.role)?.description}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleInvite} 
              disabled={inviting} 
              className="bg-purple-600 hover:bg-purple-700"
            >
              {inviting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Convidando...
                </>
              ) : (
                'Enviar Convite'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {userToDelete?.firstName} {userToDelete?.lastName} da equipe? Ele perderá acesso a todos os recursos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
