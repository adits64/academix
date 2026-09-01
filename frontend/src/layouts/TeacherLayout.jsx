import React from 'react';
import DashboardLayout from './DashboardLayout';
import RoleRoute from '@/routes/RoleRoute';
import { ROLES } from '@/constants/roles';

export function TeacherLayout() {
  return (
    <RoleRoute allowedRoles={[ROLES.TEACHER]}>
      <DashboardLayout />
    </RoleRoute>
  );
}

export default TeacherLayout;
