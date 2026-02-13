'use client';

import React, { createContext, useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { graphqlRequest, setTokens, clearTokens, getAccessToken } from '@/lib/graphql/client';
import type { User, Tenant, LoginInput, RegisterInput } from '@/types';

// Auth context type
interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// GraphQL mutations
const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        firstName
        lastName
        role
      }
      tenant {
        id
        name
        slug
        plan
      }
    }
  }
`;

const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        firstName
        lastName
        role
      }
      tenant {
        id
        name
        slug
        plan
      }
    }
  }
`;

const ME_QUERY = `
  query Me {
    me {
      id
      email
      firstName
      lastName
      role
    }
  }
`;

const TENANT_BY_SLUG_QUERY = `
  query TenantBySlug($slug: String!) {
    tenantBySlug(slug: $slug) {
      id
      name
      slug
      plan
    }
  }
`;

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check for existing session on mount
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      // Fetch current user
      graphqlRequest<{ me: User | null }>(ME_QUERY)
        .then((data) => {
          if (data.me) {
            setUser(data.me);
          }
        })
        .catch(() => {
          // Token might be expired, clear it
          clearTokens();
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    setError(null);
    setIsLoading(true);

    try {
      // Step 1: Look up tenant by slug to get the tenant ID
      const tenantData = await graphqlRequest<{
        tenantBySlug: Tenant | null;
      }>(TENANT_BY_SLUG_QUERY, { slug: input.tenantSlug });

      if (!tenantData.tenantBySlug) {
        throw new Error('Workspace not found. Please check your workspace slug.');
      }

      // Step 2: Login with the tenant ID
      const data = await graphqlRequest<{
        login: {
          accessToken: string;
          refreshToken: string;
          user: User;
          tenant: Tenant;
        };
      }>(LOGIN_MUTATION, {
        input: {
          email: input.email,
          password: input.password,
          tenantId: tenantData.tenantBySlug.id,
        },
      });

      setTokens(data.login.accessToken, data.login.refreshToken);
      setUser(data.login.user);
      setTenant(data.login.tenant);

      // Use replace instead of push to avoid history issues
      router.replace('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const register = useCallback(async (input: RegisterInput) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const data = await graphqlRequest<{
        register: {
          accessToken: string;
          refreshToken: string;
          user: User;
          tenant: Tenant;
        };
      }>(REGISTER_MUTATION, { input });

      setTokens(data.register.accessToken, data.register.refreshToken);
      setUser(data.register.user);
      setTenant(data.register.tenant);
      
      // Use replace instead of push to avoid history issues
      router.replace('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const logout = useCallback(async () => {
    clearTokens();
    setUser(null);
    setTenant(null);
    router.replace('/login');
  }, [router]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    tenant,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
