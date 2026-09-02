import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '@/api/attendance';
import { enrollmentsApi } from '@/api/enrollments';
import { formatDate } from '@/utils/format';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Filter,
  User,
  Activity,
} from 'lucide-react';

export function StudentAttendance() {
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');

  
  const { data: attendanceData, isLoading, isError, error } = useQuery({
    queryKey: ['attendance', 'my'],
    queryFn: attendanceApi.getMyAttendance,
  });

  
  const { data: enrollmentsData } = useQuery({
    queryKey: ['enrollments', 'my'],
    queryFn: enrollmentsApi.getMyEnrollments,
  });

  const attendances = Array.isArray(attendanceData) ? attendanceData : [];
  const enrollments = Array.isArray(enrollmentsData) ? enrollmentsData : [];

  
  const filteredRecords = attendances.filter((record) => {
    if (selectedCourseFilter === 'all') return true;
    return record.courseId?._id === selectedCourseFilter || record.courseId === selectedCourseFilter;
  });

  
  const totalSessions = filteredRecords.length;
  const presentCount = filteredRecords.filter((r) => r.status?.toLowerCase() === 'present').length;
  const absentCount = filteredRecords.filter((r) => r.status?.toLowerCase() === 'absent').length;
  const lateCount = filteredRecords.filter((r) => r.status?.toLowerCase() === 'late').length;
  const presenceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === 'present') {
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300 font-semibold text-xs capitalize">
          <CheckCircle2 className="h-3 w-3 mr-1" /> Present
        </Badge>
      );
    }
    if (s === 'absent') {
      return (
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 font-semibold text-xs capitalize">
          <XCircle className="h-3 w-3 mr-1" /> Absent
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-300 font-semibold text-xs capitalize">
        <Clock className="h-3 w-3 mr-1" /> Late
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance Record</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Track your class presence, attendance percentages, and session verification logs.
          </p>
        </div>

        {/* Filter Dropdown */}
        {enrollments.length > 0 && (
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="h-9 text-xs rounded-md border bg-background px-3"
            >
              <option value="all">All Enrolled Courses</option>
              {enrollments.map((enr) => (
                <option key={enr._id} value={enr.courseId?._id}>
                  {enr.courseId?.name} ({enr.courseId?.code})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              Total Sessions <Calendar className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Recorded class days</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              Present <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{presentCount}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Attended classes</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              Absent <XCircle className="h-4 w-4 text-destructive" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{absentCount}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Missed sessions</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              Late <Clock className="h-4 w-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{lateCount}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Delayed arrivals</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              Presence Rate <Activity className="h-4 w-4 text-indigo-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{presenceRate}%</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Overall rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance History List */}
      {isLoading ? (
        <LoadingSpinner text="Fetching your attendance records..." />
      ) : isError ? (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error.message || 'Failed to load attendance logs'}
        </div>
      ) : filteredRecords.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Attendance Logs Found"
          description="Your instructors have not recorded any attendance logs for this selection yet."
        />
      ) : (
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-base font-bold flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-primary" /> Session Attendance History
            </CardTitle>
          </CardHeader>

          <div className="divide-y text-xs sm:text-sm">
            {filteredRecords.map((record) => (
              <div key={record._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{record.courseId?.name || 'Academic Course'}</span>
                    <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                      {record.courseId?.code || 'COURSE'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1 text-primary" /> {formatDate(record.date)}
                    </span>
                    {record.markedBy?.name && (
                      <span className="flex items-center">
                        <User className="h-3 w-3 mr-1 text-primary" /> Marked by {record.markedBy.name}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  {getStatusBadge(record.status)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default StudentAttendance;
