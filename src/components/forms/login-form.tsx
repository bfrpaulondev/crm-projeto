'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock, Building2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  tenantSlug: z
    .string()
    .min(2, 'Workspace slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      tenantSlug: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      await login({
        email: data.email,
        password: data.password,
        tenantSlug: data.tenantSlug.toLowerCase(),
      });
      toast.success('Welcome back!');
    } catch {
      toast.error(error || 'Login failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="tenantSlug" className="text-white">Workspace</Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            id="tenantSlug"
            type="text"
            placeholder="your-company"
            {...register('tenantSlug')}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-400 focus:ring-purple-400/20"
            aria-label="Workspace slug"
            aria-invalid={!!errors.tenantSlug}
            aria-describedby={errors.tenantSlug ? 'tenantSlug-error' : undefined}
          />
        </div>
        {errors.tenantSlug && (
          <p id="tenantSlug-error" className="text-sm text-red-400" role="alert">
            {errors.tenantSlug.message}
          </p>
        )}
        <p className="text-xs text-slate-500">Enter your company workspace slug (e.g., young-dev)</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email" className="text-white">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register('email')}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-400 focus:ring-purple-400/20"
            aria-label="Email address"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
        </div>
        {errors.email && (
          <p id="email-error" className="text-sm text-red-400" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password" className="text-white">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('password')}
            className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-400 focus:ring-purple-400/20"
            aria-label="Password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="text-sm text-red-400" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>
      
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </Button>
    </form>
  );
}
