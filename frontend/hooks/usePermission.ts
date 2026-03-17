import { useAuth } from '../contexts/AuthContext';

export function usePermission() {
  const { user } = useAuth();
  const permissions = user?.permissions || [];

  const hasPermission = (resource: string, action: string): boolean => {
    return permissions.includes(`${resource}:${action}`);
  };

  const hasAnyPermission = (resource: string): boolean => {
    return permissions.some(p => p.startsWith(`${resource}:`));
  };

  return { hasPermission, hasAnyPermission, permissions };
}
