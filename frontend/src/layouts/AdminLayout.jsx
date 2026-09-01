import React from 'react';
import DashboardLayout from './DashboardLayout';
import RoleRoute from '@/routes/RoleRoute';
import { ROLES } from '@/constants/roles';

export function AdminLayout() {
  return (
    <RoleRoute allowedRoles={[ROLES.ADMIN]}>
      <DashboardLayout />
    </RoleRoute>
  );
}

export default AdminLayout;
