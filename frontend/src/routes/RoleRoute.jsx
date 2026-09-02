import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import { ROLES } from '@/constants/roles';

export function RoleRoute({ allowedRoles, children }) {
  const { role } = useAuth();

  if (!role || !allowedRoles.includes(role)) {
    
    if (role === ROLES.ADMIN) return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
    if (role === ROLES.TEACHER) return <Navigate to={ROUTES.TEACHER.DASHBOARD} replace />;
    if (role === ROLES.STUDENT) return <Navigate to={ROUTES.STUDENT.DASHBOARD} replace />;
    return <Navigate to={ROUTES.PUBLIC.LOGIN} replace />;
  }

  return children;
}

export default RoleRoute;
