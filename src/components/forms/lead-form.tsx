'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@apollo/client/react';
import { CREATE_LEAD_MUTATION, UPDATE_LEAD_MUTATION } from '@/graphql/mutations/leads';
import { GET_LEADS } from '@/graphql/queries/leads';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Lead } from '@/types';

const leadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
  onSuccess?: () => void;
}

export function LeadForm({ open, onOpenChange, lead, onSuccess }: LeadFormProps) {
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!lead;

  const [createLead, { loading: creating }] = useMutation(CREATE_LEAD_MUTATION, {
    refetchQueries: [{ query: GET_LEADS }],
    onCompleted: () => {
      toast.success('Lead criado com sucesso');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const [updateLead, { loading: updating }] = useMutation(UPDATE_LEAD_MUTATION, {
    refetchQueries: [{ query: GET_LEADS }],
    onCompleted: () => {
      toast.success('Lead atualizado com sucesso');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => {
      // If updateLead doesn't exist, show specific message
      if (err.message.includes('Cannot query field "updateLead"')) {
        setError('A mutation updateLead ainda não está disponível na API. Aguarde o deploy ou use Qualify/Convert para mudar o status.');
      } else {
        setError(err.message);
      }
    },
  });

  const isLoading = creating || updating;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      companyName: '',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (open && lead) {
      setValue('firstName', lead.firstName || '');
      setValue('lastName', lead.lastName || '');
      setValue('email', lead.email || '');
      setValue('phone', lead.phone || '');
      setValue('companyName', lead.companyName || '');
    } else if (open) {
      reset();
    }
    setError(null);
  }, [open, lead, setValue, reset]);

  const onSubmit = async (data: LeadFormData) => {
    setError(null);
    
    if (isEditing && lead) {
      // Update existing lead
      await updateLead({
        variables: {
          id: lead.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || null,
          companyName: data.companyName || null,
        },
      });
    } else {
      // Create new lead
      await createLead({
        variables: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || null,
          companyName: data.companyName || null,
        },
      });
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize as informações do lead abaixo.'
              : 'Preencha os dados para criar um novo lead.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isEditing && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                Para mudar o status do lead, use as ações "Qualificar" ou "Converter" na página do lead.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome *</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                placeholder="João"
                className={errors.firstName ? 'border-red-500' : ''}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome *</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                placeholder="Silva"
                className={errors.lastName ? 'border-red-500' : ''}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="joao@exemplo.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="+55 (11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Empresa</Label>
              <Input
                id="companyName"
                {...register('companyName')}
                placeholder="Empresa ABC"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Atualizando...' : 'Criando...'}
                </>
              ) : (
                isEditing ? 'Atualizar Lead' : 'Criar Lead'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
