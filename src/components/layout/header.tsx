'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { useAuth } from '@/lib/auth/context';
import { Bell, Search, Menu, X, Check, AlertCircle, Info, Phone, Mail, Calendar, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ThemeToggle } from '@/components/theme-toggle';
import { InstallPrompt } from '@/components/install-prompt';
import { getInitials } from '@/lib/utils/formatters';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { format, formatDistanceToNow, isToday, isTomorrow, isPast, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GET_ACTIVITIES } from '@/graphql/queries/activities';
import { GET_LEADS } from '@/graphql/queries/leads';

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'alert' | 'warning';
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

export function Header({ onMenuClick, showMenuButton = false }: HeaderProps) {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Fetch activities for notifications
  const { data: activitiesData } = useQuery(GET_ACTIVITIES, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 60000, // Refresh every minute
  });

  // Fetch leads for notifications
  const { data: leadsData } = useQuery(GET_LEADS, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 60000,
  });

  // Generate notifications from activities and leads
  useEffect(() => {
    const newNotifications: Notification[] = [];
    const now = new Date();

    // Process activities
    if (activitiesData?.activities) {
      activitiesData.activities.forEach((activity: any) => {
        // Overdue activities
        if (activity.dueDate && activity.status !== 'COMPLETED' && activity.status !== 'CANCELLED') {
          const dueDate = new Date(activity.dueDate);
          if (isPast(dueDate) && !isToday(dueDate)) {
            newNotifications.push({
              id: `overdue-${activity.id}`,
              type: 'warning',
              title: 'Atividade atrasada',
              message: `${activity.subject} estava programada para ${format(dueDate, 'dd/MM/yyyy', { locale: ptBR })}`,
              time: formatDistanceToNow(dueDate, { addSuffix: true, locale: ptBR }),
              read: false,
              link: '/activities',
            });
          }
        }

        // Activities due today
        if (activity.dueDate && activity.status === 'PENDING') {
          const dueDate = new Date(activity.dueDate);
          if (isToday(dueDate)) {
            newNotifications.push({
              id: `today-${activity.id}`,
              type: 'alert',
              title: 'Atividade para hoje',
              message: activity.subject,
              time: 'Hoje',
              read: false,
              link: '/activities',
            });
          }
        }

        // Activities due tomorrow
        if (activity.dueDate && activity.status === 'PENDING') {
          const dueDate = new Date(activity.dueDate);
          if (isTomorrow(dueDate)) {
            newNotifications.push({
              id: `tomorrow-${activity.id}`,
              type: 'info',
              title: 'Atividade para amanhã',
              message: activity.subject,
              time: 'Amanhã',
              read: true,
              link: '/activities',
            });
          }
        }
      });
    }

    // Process leads
    if (leadsData?.leads) {
      leadsData.leads.forEach((lead: any) => {
        // New leads (created in last 24 hours)
        const createdAt = new Date(lead.createdAt);
        const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceCreation < 24) {
          newNotifications.push({
            id: `new-lead-${lead.id}`,
            type: 'success',
            title: 'Novo lead criado',
            message: `${lead.firstName} ${lead.lastName} foi adicionado como lead`,
            time: formatDistanceToNow(createdAt, { addSuffix: true, locale: ptBR }),
            read: hoursSinceCreation > 1,
            link: '/leads',
          });
        }

        // Converted leads
        if (lead.status === 'CONVERTED' && lead.convertedAt) {
          const convertedAt = new Date(lead.convertedAt);
          const hoursSinceConversion = (now.getTime() - convertedAt.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceConversion < 24) {
            newNotifications.push({
              id: `converted-${lead.id}`,
              type: 'success',
              title: 'Lead convertido',
              message: `${lead.firstName} ${lead.lastName} foi convertido com sucesso`,
              time: formatDistanceToNow(convertedAt, { addSuffix: true, locale: ptBR }),
              read: true,
              link: '/pipeline',
            });
          }
        }

        // Qualified leads
        if (lead.status === 'QUALIFIED') {
          newNotifications.push({
            id: `qualified-${lead.id}`,
            type: 'info',
            title: 'Lead qualificado',
            message: `${lead.firstName} ${lead.lastName} está qualificado e pronto para conversão`,
            time: 'Pronto para conversão',
            read: true,
            link: '/pipeline',
          });
        }
      });
    }

    // Sort by priority (warnings first, then unread)
    newNotifications.sort((a, b) => {
      if (a.type === 'warning' && b.type !== 'warning') return -1;
      if (b.type === 'warning' && a.type !== 'warning') return 1;
      if (!a.read && b.read) return -1;
      if (a.read && !b.read) return 1;
      return 0;
    });

    // Limit to 10 notifications
    setNotifications(newNotifications.slice(0, 10));
  }, [activitiesData, leadsData]);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'alert':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {showMenuButton && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onMenuClick}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Buscar leads, oportunidades..."
              className="w-64 lg:w-80 pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              aria-label="Buscar"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Install PWA Button */}
          <InstallPrompt />
          
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                aria-label="Notificações"
              >
                <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between p-4 border-b">
                <h4 className="font-semibold">Notificações</h4>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={markAllAsRead}
                    className="text-xs text-purple-600 hover:text-purple-700"
                  >
                    Marcar todas como lidas
                  </Button>
                )}
              </div>
              <ScrollArea className="h-64">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">
                    Nenhuma notificação
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <Link
                        key={notification.id}
                        href={notification.link || '#'}
                        className={`block cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                          !notification.read ? 'bg-purple-50 dark:bg-purple-950/20' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="p-4">
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{notification.title}</p>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {notification.time}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="flex-shrink-0">
                                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full"
                aria-label="Menu do usuário"
              >
                <Avatar className="h-9 w-9 bg-purple-600">
                  <AvatarFallback className="bg-purple-600 text-white text-sm font-medium">
                    {user ? getInitials(user.firstName, user.lastName) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">Configurações</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600">
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
