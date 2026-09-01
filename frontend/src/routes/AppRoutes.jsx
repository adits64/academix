import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from '@/layouts/PublicLayout';
import AdminLayout from '@/layouts/AdminLayout';
import TeacherLayout from '@/layouts/TeacherLayout';
import StudentLayout from '@/layouts/StudentLayout';

// Public Pages
import Landing from '@/pages/public/Landing';
import Login from '@/pages/public/Login';

// Shared Pages
import Profile from '@/pages/common/Profile';
import Settings from '@/pages/common/Settings';

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import Users from '@/pages/admin/Users';
import UserDetail from '@/pages/admin/UserDetail';
import Courses from '@/pages/admin/Courses';
import Enrollments from '@/pages/admin/Enrollments';
import AttendanceOverview from '@/pages/admin/AttendanceOverview';
import AdminNotes from '@/pages/admin/AdminNotes';
import SendNotice from '@/pages/admin/SendNotice';
import Fees from '@/pages/admin/Fees';

// Teacher Pages
import TeacherDashboard from '@/pages/teacher/TeacherDashboard';
import MyCourses from '@/pages/teacher/MyCourses';
import MarkAttendance from '@/pages/teacher/MarkAttendance';
import TeacherNotes from '@/pages/teacher/TeacherNotes';
import TeacherSendNotice from '@/pages/teacher/TeacherSendNotice';

// Student Pages
import StudentDashboard from '@/pages/student/StudentDashboard';
import StudentCourses from '@/pages/student/StudentCourses';
import StudentAttendance from '@/pages/student/StudentAttendance';
import StudentNotes from '@/pages/student/StudentNotes';
import StudentFees from '@/pages/student/StudentFees';

import ProtectedRoute from './ProtectedRoute';
import { ROUTES } from '@/constants/routes';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.PUBLIC.HOME} element={<Landing />} />
        <Route path={ROUTES.PUBLIC.LOGIN} element={<Login />} />
      </Route>

      {/* Protected Admin Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.ADMIN.DASHBOARD} element={<AdminDashboard />} />
        <Route path={ROUTES.ADMIN.USERS} element={<Users />} />
        <Route path={ROUTES.ADMIN.USER_DETAIL} element={<UserDetail />} />
        <Route path={ROUTES.ADMIN.COURSES} element={<Courses />} />
        <Route path={ROUTES.ADMIN.ENROLLMENTS} element={<Enrollments />} />
        <Route path={ROUTES.ADMIN.ATTENDANCE} element={<AttendanceOverview />} />
        <Route path={ROUTES.ADMIN.NOTES} element={<AdminNotes />} />
        <Route path={ROUTES.ADMIN.FEES} element={<Fees />} />
        <Route path={ROUTES.ADMIN.EMAIL} element={<SendNotice />} />
        <Route path={ROUTES.ADMIN.PROFILE} element={<Profile />} />
        <Route path={ROUTES.ADMIN.SETTINGS} element={<Settings />} />
      </Route>

      {/* Protected Teacher Routes */}
      <Route
        element={
          <ProtectedRoute>
            <TeacherLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.TEACHER.DASHBOARD} element={<TeacherDashboard />} />
        <Route path={ROUTES.TEACHER.COURSES} element={<MyCourses />} />
        <Route path={ROUTES.TEACHER.ATTENDANCE} element={<MarkAttendance />} />
        <Route path={ROUTES.TEACHER.NOTES} element={<TeacherNotes />} />
        <Route path={ROUTES.TEACHER.EMAIL} element={<TeacherSendNotice />} />
        <Route path={ROUTES.TEACHER.PROFILE} element={<Profile />} />
        <Route path={ROUTES.TEACHER.SETTINGS} element={<Settings />} />
      </Route>

      {/* Protected Student Routes */}
      <Route
        element={
          <ProtectedRoute>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.STUDENT.DASHBOARD} element={<StudentDashboard />} />
        <Route path={ROUTES.STUDENT.COURSES} element={<StudentCourses />} />
        <Route path={ROUTES.STUDENT.ATTENDANCE} element={<StudentAttendance />} />
        <Route path={ROUTES.STUDENT.NOTES} element={<StudentNotes />} />
        <Route path={ROUTES.STUDENT.FEES} element={<StudentFees />} />
        <Route path={ROUTES.STUDENT.PROFILE} element={<Profile />} />
        <Route path={ROUTES.STUDENT.SETTINGS} element={<Settings />} />
      </Route>

      {/* Fallback redirect */}
      <Route path="*" element={<Navigate to={ROUTES.PUBLIC.HOME} replace />} />
    </Routes>
  );
}

export default AppRoutes;
