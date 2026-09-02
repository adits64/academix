import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/api/users';
import { coursesApi } from '@/api/courses';
import { Button } from '@/components/ui/button';
import { enrollmentsApi } from '@/api/enrollments';
import { attendanceApi } from '@/api/attendance';
import { ROUTES } from '@/constants/routes';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, UserCheck, Calendar, ArrowRight } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export function AdminDashboard() {
  const navigate = useNavigate();

  
  const { data: usersData, isLoading: usersLoading } = useQuery({ queryKey: ['users'], queryFn: usersApi.getAllUsers });
  const { data: coursesData, isLoading: coursesLoading } = useQuery({ queryKey: ['courses'], queryFn: coursesApi.getAllCourses });
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({ queryKey: ['enrollments'], queryFn: enrollmentsApi.getAllEnrollments });
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({ queryKey: ['attendance', 'admin'], queryFn: attendanceApi.getAllAttendance });

  const coursesList = coursesData?.courses || [];
  const existingCourseIds = new Set(coursesList.map((c) => String(c._id)));

  const usersCount = usersData?.users?.length || 0;
  const coursesCount = coursesList.length;

  const rawEnrollments = Array.isArray(enrollmentsData) ? enrollmentsData : [];
  const enrollmentsList = rawEnrollments.filter((e) => {
    const cid = String(e.courseId?._id || e.courseId || '');
    return cid && (existingCourseIds.size === 0 || existingCourseIds.has(cid)) && e.studentId;
  });
  const enrollmentsCount = enrollmentsList.length;

  const rawAttendance = Array.isArray(attendanceData)
    ? attendanceData
    : Array.isArray(attendanceData?.attendances)
    ? attendanceData.attendances
    : [];

  const attendanceList = rawAttendance.filter((a) => {
    const cid = String(a.courseId?._id || a.courseId || '');
    return cid && (existingCourseIds.size === 0 || existingCourseIds.has(cid)) && a.studentId;
  });
  const totalAttendance = attendanceList.length;
  const presentAttendance = attendanceList.filter((a) => a.status === 'present').length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0;

  return (
    <div className="space-y-6">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
          <p className="text-sm text-muted-foreground">Institute metrics, active courses, user directory, and overall status.</p>
        </div>
        <Badge variant="outline" className="w-fit text-xs font-semibold px-3 py-1 bg-primary/5 text-primary border-primary/20">
          Admin Control Center
        </Badge>
      </div>

      {/* Interactive Statistics Grid (Clickable Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CLICKABLE USERS CARD */}
        <Card
          onClick={() => navigate(ROUTES.ADMIN.USERS)}
          className="cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all group"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">Registered Users</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersLoading ? '--' : usersCount}</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">Teachers & Students</p>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </CardContent>
        </Card>

        {/* CLICKABLE COURSES CARD */}
        <Card
          onClick={() => navigate(ROUTES.ADMIN.COURSES)}
          className="cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all group"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">Total Courses</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <BookOpen className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coursesLoading ? '--' : coursesCount}</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">Active training programs</p>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </CardContent>
        </Card>

        {/* CLICKABLE ENROLLMENTS CARD */}
        <Card
          onClick={() => navigate(ROUTES.ADMIN.ENROLLMENTS)}
          className="cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all group"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">Enrollments</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
              <UserCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollmentsLoading ? '--' : enrollmentsCount}</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">Active course enrollments</p>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </CardContent>
        </Card>

        {/* CLICKABLE ATTENDANCE CARD */}
        <Card
          onClick={() => navigate(ROUTES.ADMIN.ATTENDANCE)}
          className="cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all group"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">Attendance Rate</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceLoading ? '--%' : `${attendanceRate}%`}</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">Institute average presence</p>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <Card className="border p-6 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">User Directory & Roles</h3>
              <p className="text-xs text-muted-foreground">View detailed profiles of students, teachers, and admins.</p>
            </div>
          </div>
          <Button size="sm" onClick={() => navigate(ROUTES.ADMIN.USERS)} className="w-full">
            Manage User Directory <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Card>

        <Card className="border p-6 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-bold">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Courses & Batches</h3>
              <p className="text-xs text-muted-foreground">Set up training programs, fees, and batch schedules.</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate(ROUTES.ADMIN.COURSES)} className="w-full">
            Manage Course Programs <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Card>
      </div>
    </div>
  );
}

export default AdminDashboard;
