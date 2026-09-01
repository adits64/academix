import React from 'react';
import DashboardLayout from './DashboardLayout';
import RoleRoute from '@/routes/RoleRoute';
import { ROLES } from '@/constants/roles';

export function StudentLayout() {
  return (
    <RoleRoute allowedRoles={[ROLES.STUDENT]}>
      <DashboardLayout />
    </RoleRoute>
  );
}

export default StudentLayout;
