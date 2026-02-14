'use client';

import { useAuth } from '@/lib/auth/context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { NotificationToggle, useNotifications } from '@/hooks/use-notifications';
import { ThemeToggle } from '@/components/theme-toggle';
import { Bell, Moon, Download, User, Building } from 'lucide-react';

export default function SettingsPage() {
  const { user, tenant } = useAuth();
  const { isGranted, isSupported } = useNotifications();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
          Configurações
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Gerencie suas preferências e configurações da conta
        </p>
      </div>

      {/* Profile Section */}
      <Card className="bg-white dark:bg-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-purple-600" />
            Perfil do Usuário
          </CardTitle>
          <CardDescription>
            Suas informações pessoais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-500">Nome</Label>
              <p className="font-medium">{user?.firstName} {user?.lastName}</p>
            </div>
            <div>
              <Label className="text-slate-500">Email</Label>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <Label className="text-slate-500">Função</Label>
              <p className="font-medium">{user?.role === 'ADMIN' ? 'Administrador' : user?.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Section */}
      <Card className="bg-white dark:bg-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-purple-600" />
            Empresa
          </CardTitle>
          <CardDescription>
            Informações da sua empresa/workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-500">Nome da Empresa</Label>
              <p className="font-medium">{tenant?.name}</p>
            </div>
            <div>
              <Label className="text-slate-500">Slug do Workspace</Label>
              <p className="font-medium">{tenant?.slug}</p>
            </div>
            <div>
              <Label className="text-slate-500">Plano</Label>
              <p className="font-medium">{tenant?.plan || 'Gratuito'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card className="bg-white dark:bg-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-purple-600" />
            Aparência
          </CardTitle>
          <CardDescription>
            Personalize a aparência do aplicativo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Tema</Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Escolha entre modo claro, escuro ou sistema
              </p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card className="bg-white dark:bg-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-600" />
            Notificações
          </CardTitle>
          <CardDescription>
            Configure como você recebe notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSupported ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notificações do Navegador</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Receba alertas sobre novos leads e atividades
                  </p>
                </div>
                <NotificationToggle />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Novos Leads</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Notificar quando um novo lead for criado
                  </p>
                </div>
                <Switch defaultChecked disabled={!isGranted} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Leads Convertidos</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Notificar quando um lead for convertido
                  </p>
                </div>
                <Switch defaultChecked disabled={!isGranted} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Tarefas Vencendo</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Lembrete de tarefas próximas do vencimento
                  </p>
                </div>
                <Switch defaultChecked disabled={!isGranted} />
              </div>
            </>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">
              Notificações não são suportadas neste navegador.
            </p>
          )}
        </CardContent>
      </Card>

      {/* PWA Section */}
      <Card className="bg-white dark:bg-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-purple-600" />
            Instalar Aplicativo
          </CardTitle>
          <CardDescription>
            Instale o CRM como um aplicativo no seu dispositivo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Instale o CRM Pipeline como um aplicativo no seu dispositivo para:
          </p>
          <ul className="text-sm text-slate-600 dark:text-slate-400 list-disc list-inside space-y-1">
            <li>Acesso rápido pela tela inicial</li>
            <li>Funcionamento offline básico</li>
            <li>Notificações push</li>
            <li>Experiência de app nativo</li>
          </ul>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
            💡 Clique no botão "Instalar App" no cabeçalho para instalar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
