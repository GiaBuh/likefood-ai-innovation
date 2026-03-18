import React from 'react';
import { usePermission } from '../../hooks/usePermission';

interface PermissionGuardProps {
  resource: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({ resource, action, children, fallback = null }) => {
  const { hasPermission } = usePermission();

  if (!hasPermission(resource, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGuard;
