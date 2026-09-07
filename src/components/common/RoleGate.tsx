import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types';

interface RoleGateProps {
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * RoleGate component for conditionally rendering UI sections based on verified user clearance.
 * If user does not have an allowed role, renders optional fallback or null.
 */
export const RoleGate: React.FC<RoleGateProps> = ({
  allowedRoles,
  fallback = null,
  children
}) => {
  const { user, role, hasPermission, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  const isAuthenticated = Boolean(user && role !== 'guest');
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  const isAuthorized = allowedRoles.length === 0 || hasPermission(allowedRoles);
  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleGate;
