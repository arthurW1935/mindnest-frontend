// hooks/useRouteProtection.ts
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface UseRouteProtectionOptions {
  requiredRole?: 'admin' | 'psychiatrist' | 'user';
  allowedRoles?: Array<'admin' | 'psychiatrist' | 'user'>;
  redirectTo?: string;
}

export const useRouteProtection = (options: UseRouteProtectionOptions = {}) => {
  const { user, isAuthenticated, isLoading, getRedirectPath } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't do anything while loading
    if (isLoading) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated || !user) {
      console.log('User not authenticated, redirecting to login');
      router.replace('/auth/login');
      return;
    }

    // Check role-based access
    const { requiredRole, allowedRoles, redirectTo } = options;

    // If a specific role is required
    if (requiredRole && user.role !== requiredRole) {
      console.log(`Access denied. Required: ${requiredRole}, User: ${user.role}`);
      const fallbackPath = redirectTo || getRedirectPath(user.role);
      router.replace(fallbackPath);
      return;
    }

    // If specific roles are allowed
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      console.log(`Access denied. Allowed: ${allowedRoles.join(', ')}, User: ${user.role}`);
      const fallbackPath = redirectTo || getRedirectPath(user.role);
      router.replace(fallbackPath);
      return;
    }

    console.log(`Access granted for user role: ${user.role}`);
  }, [user, isAuthenticated, isLoading, router, options, getRedirectPath]);

  return {
    user,
    isAuthenticated,
    isLoading,
    hasAccess: isAuthenticated && user && (
      !options.requiredRole || user.role === options.requiredRole
    ) && (
      !options.allowedRoles || options.allowedRoles.includes(user.role)
    )
  };
};

// Convenience hooks for specific roles
export const useAdminProtection = () => useRouteProtection({ requiredRole: 'admin' });
export const useTherapistProtection = () => useRouteProtection({ requiredRole: 'psychiatrist' });
export const useUserProtection = () => useRouteProtection({ requiredRole: 'user' });