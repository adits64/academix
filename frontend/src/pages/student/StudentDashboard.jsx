import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { enrollmentsApi } from '@/api/enrollments';
import { attendanceApi } from '@/api/attendance';
import { notesApi } from '@/api/notes';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import { formatCurrency, formatDate } from '@/utils/format';
import { downloadNoteFile } from '@/utils/download';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/common/LoadingSpinner';

import {
  BookOpen,
  Calendar,
  FileText,
  CreditCard,
  ArrowRight,
  User,
  Clock,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Layers,
  ChevronRight,
  Shield,
} from 'lucide-react';

export function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownload = async (note) => {
    if (downloadingId) return;
    setDownloadingId(note._id);
    try {
      await downloadNoteFile(note);
    } finally {
      setDownloadingId(null);
    }
  };

  
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['enrollments', 'my'],
    queryFn: enrollmentsApi.getMyEnrollments,
  });

  
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance', 'my'],
    queryFn: attendanceApi.getMyAttendance,
  });

  
  const { data: notesData, isLoading: notesLoading } = useQuery({
    queryKey: ['notes', 'my'],
    queryFn: notesApi.getMyNotes,
  });

  const enrollments = Array.isArray(enrollmentsData) ? enrollmentsData : [];
  const attendances = Array.isArray(attendanceData) ? attendanceData : [];
  const notes = Array.isArray(notesData) ? notesData : [];

  
  const totalSessions = attendances.length;
  const presentCount = attendances.filter((r) => r.status?.toLowerCase() === 'present').length;
  const presenceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

  
  const totalTuition = enrollments.reduce((sum, enr) => sum + (enr.courseId?.fee || 0), 0);

  const isLoading = enrollmentsLoading || attendanceLoading || notesLoading;

  return (
    <div className="space-y-6">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.name || 'Student'}!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Track your class schedules, check daily attendance, access lecture notes, and review your status.
          </p>
        </div>
        <Badge variant="outline" className="w-fit text-xs font-semibold px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300">
          <Sparkles className="h-3.5 w-3.5 mr-1" /> Student Academic Hub
        </Badge>
      </div>

      {/* Real Stats Metric Cards (Clickable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Enrolled Courses */}
        <Card
          onClick={() => navigate(ROUTES.STUDENT.COURSES)}
          className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Enrolled Courses</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <BookOpen className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {enrollmentsLoading ? '...' : enrollments.length}
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground">
              <span>Active course programs</span>
              <ChevronRight className="h-3.5 w-3.5 text-primary group-hover:translate-x-0.5 transition-transform" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Attendance Rate */}
        <Card
          onClick={() => navigate(ROUTES.STUDENT.ATTENDANCE)}
          className="cursor-pointer hover:border-emerald-500/50 hover:shadow-md transition-all group"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Attendance Rate</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {attendanceLoading ? '...' : `${presenceRate}%`}
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground">
              <span>{presentCount} of {totalSessions} days present</span>
              <ChevronRight className="h-3.5 w-3.5 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Available Notes */}
        <Card
          onClick={() => navigate(ROUTES.STUDENT.NOTES)}
          className="cursor-pointer hover:border-indigo-500/50 hover:shadow-md transition-all group"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Study Notes</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <FileText className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {notesLoading ? '...' : notes.length}
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground">
              <span>Learning files available</span>
              <ChevronRight className="h-3.5 w-3.5 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Fee Balance */}
        <Card
          onClick={() => navigate(ROUTES.STUDENT.FEES)}
          className="cursor-pointer hover:border-amber-500/50 hover:shadow-md transition-all group"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Program Tuition</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <CreditCard className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {enrollmentsLoading ? '...' : formatCurrency(totalTuition)}
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground">
              <span>Standing: In Good Order</span>
              <ChevronRight className="h-3.5 w-3.5 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Enrolled Courses Preview */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <div>
                <CardTitle className="text-base font-bold flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-primary" /> My Active Enrolled Courses
                </CardTitle>
                <CardDescription className="text-xs">
                  Your registered programs and class batch schedules
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary"
                onClick={() => navigate(ROUTES.STUDENT.COURSES)}
              >
                View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </CardHeader>

            <CardContent className="p-0 divide-y">
              {isLoading ? (
                <div className="p-8">
                  <LoadingSpinner text="Loading courses..." />
                </div>
              ) : enrollments.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                  <p>You have no active course registrations currently.</p>
                </div>
              ) : (
                enrollments.slice(0, 3).map((enr) => {
                  const course = enr.courseId || {};
                  const batch = enr.batch || {};

                  return (
                    <div key={enr._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-sm">{course.name || 'Course'}</span>
                          <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                            {course.code || 'COURSE'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <Layers className="h-3 w-3 mr-1 text-primary" /> {batch.name || 'Batch'}
                          </span>
                          {batch.startTime && batch.endTime && (
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1 text-primary" /> {batch.startTime} - {batch.endTime}
                            </span>
                          )}
                        </div>
                      </div>

                      <Badge variant="outline" className="w-fit text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                      </Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Recent Notes Preview */}
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <div>
                <CardTitle className="text-base font-bold flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-primary" /> Recent Study Materials
                </CardTitle>
                <CardDescription className="text-xs">
                  Latest lecture notes and documents uploaded by teachers
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary"
                onClick={() => navigate(ROUTES.STUDENT.NOTES)}
              >
                View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </CardHeader>

            <CardContent className="p-0 divide-y">
              {notesLoading ? (
                <div className="p-8">
                  <LoadingSpinner text="Loading materials..." />
                </div>
              ) : notes.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No study notes uploaded for your batches yet.
                </div>
              ) : (
                notes.slice(0, 3).map((n) => (
                  <div key={n._id} className="p-4 flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-xs sm:text-sm text-foreground truncate">{n.title}</p>
                        <Badge variant="outline" className="text-[9px] text-primary border-primary/20 shrink-0">
                          {n.courseId?.code || 'COURSE'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{formatDate(n.createdAt)}</p>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs shrink-0 font-medium"
                      disabled={downloadingId === n._id}
                      onClick={() => handleDownload(n)}
                    >
                      {downloadingId === n._id ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-3 w-3 mr-1 text-primary" /> Download
                        </>
                      )}
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: Attendance Summary & Quick Actions */}
        <div className="space-y-6">
          {/* Attendance Overview Card */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-primary" /> Attendance Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Monthly Presence Score</p>
                <div className="text-3xl font-extrabold text-primary">{presenceRate}%</div>
                <p className="text-[11px] text-muted-foreground">{presentCount} Present / {totalSessions} Logged Sessions</p>
              </div>

              <div className="space-y-2 pt-2 divide-y">
                {attendances.slice(0, 3).map((att) => (
                  <div key={att._id} className="pt-2 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{att.courseId?.name || 'Course'}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDate(att.date)}</p>
                    </div>
                    {att.status?.toLowerCase() === 'present' ? (
                      <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200">
                        Present
                      </Badge>
                    ) : att.status?.toLowerCase() === 'absent' ? (
                      <Badge variant="outline" className="text-[10px] font-semibold bg-destructive/10 text-destructive border-destructive/20">
                        Absent
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200">
                        Late
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs mt-2"
                onClick={() => navigate(ROUTES.STUDENT.ATTENDANCE)}
              >
                View Full Attendance Log
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold">Quick Navigation</CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2 text-xs">
              <Button
                variant="ghost"
                className="w-full justify-between h-10 hover:bg-primary/10 hover:text-primary"
                onClick={() => navigate(ROUTES.STUDENT.COURSES)}
              >
                <span className="flex items-center font-medium">
                  <BookOpen className="h-4 w-4 mr-2.5 text-primary" /> Class Schedules
                </span>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-between h-10 hover:bg-primary/10 hover:text-primary"
                onClick={() => navigate(ROUTES.STUDENT.NOTES)}
              >
                <span className="flex items-center font-medium">
                  <FileText className="h-4 w-4 mr-2.5 text-indigo-500" /> Study Resources
                </span>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-between h-10 hover:bg-primary/10 hover:text-primary"
                onClick={() => navigate(ROUTES.STUDENT.FEES)}
              >
                <span className="flex items-center font-medium">
                  <CreditCard className="h-4 w-4 mr-2.5 text-amber-500" /> Tuition Status
                </span>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-between h-10 hover:bg-primary/10 hover:text-primary"
                onClick={() => navigate(ROUTES.STUDENT.PROFILE)}
              >
                <span className="flex items-center font-medium">
                  <User className="h-4 w-4 mr-2.5 text-emerald-500" /> My Profile & Picture
                </span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
