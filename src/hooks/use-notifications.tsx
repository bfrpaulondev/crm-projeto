'use client';

import { useCallback } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Check if notifications are supported
function checkNotificationSupport(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// Get current permission
function getNotificationPermission(): NotificationPermission {
  if (!checkNotificationSupport()) return 'denied';
  return Notification.permission;
}

export function useNotifications() {
  const isSupported = checkNotificationSupport();
  const permission = getNotificationPermission();

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error('Notificações não são suportadas neste navegador');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      
      if (result === 'granted') {
        toast.success('Notificações ativadas!');
        new Notification('CRM Pipeline', {
          body: 'Você receberá notificações sobre novos leads e atividades.',
          icon: '/icons/icon-192x192.png',
        });
        return true;
      } else if (result === 'denied') {
        toast.error('Permissão de notificação negada. Habilite nas configurações do navegador.');
        return false;
      }
      return false;
    } catch {
      toast.error('Erro ao solicitar permissão de notificação');
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') return;

    try {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options,
      });
    } catch {
      console.error('Failed to send notification');
    }
  }, [isSupported, permission]);

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    isGranted: permission === 'granted',
  };
}

export function NotificationToggle() {
  const { isSupported, permission, requestPermission, isGranted } = useNotifications();

  if (!isSupported) {
    return null;
  }

  if (isGranted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className="flex items-center gap-2 text-green-600"
      >
        <Bell className="w-4 h-4" />
        <span className="text-sm">Notificações Ativas</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={requestPermission}
      className="flex items-center gap-2 text-slate-600 hover:text-slate-700"
    >
      {permission === 'denied' ? (
        <>
          <BellOff className="w-4 h-4" />
          <span className="text-sm">Notificações Bloqueadas</span>
        </>
      ) : (
        <>
          <Bell className="w-4 h-4" />
          <span className="text-sm">Ativar Notificações</span>
        </>
      )}
    </Button>
  );
}
