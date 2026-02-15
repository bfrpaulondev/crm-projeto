import { ApolloLink, Observable } from '@apollo/client';

// Use same keys as graphql/client.ts for consistency
export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

export const clearTokens = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Auth link that adds token to headers
export const authLink = new ApolloLink((operation, forward) => {
  const token = getAccessToken();
  
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }));

  return forward(operation);
});

// Error handling link for token refresh
export const errorLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    let retryCount = 0;
    const maxRetries = 1;

    const handleOperation = () => {
      forward(operation).subscribe({
        next: (result) => observer.next(result),
        error: (error) => {
          const isAuthError = 
            error?.graphQLErrors?.some(
              (e: { extensions?: { code?: string } }) => e?.extensions?.code === 'UNAUTHENTICATED'
            ) ||
            error?.networkError?.statusCode === 401;

          if (isAuthError && retryCount < maxRetries) {
            retryCount++;
            const refreshToken = getRefreshToken();
            
            if (refreshToken) {
              // Attempt to refresh the token
              fetch('/api/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
              })
                .then((res) => res.json())
                .then((data) => {
                  if (data.accessToken) {
                    setTokens(data.accessToken, data.refreshToken || refreshToken);
                    operation.setContext(({ headers = {} }) => ({
                      headers: {
                        ...headers,
                        Authorization: `Bearer ${data.accessToken}`,
                      },
                    }));
                    handleOperation();
                  } else {
                    clearTokens();
                    window.location.href = '/login';
                    observer.error(error);
                  }
                })
                .catch(() => {
                  clearTokens();
                  window.location.href = '/login';
                  observer.error(error);
                });
            } else {
              clearTokens();
              window.location.href = '/login';
              observer.error(error);
            }
          } else {
            observer.error(error);
          }
        },
        complete: () => observer.complete(),
      });
    };

    handleOperation();
  });
});
