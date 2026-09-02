import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '@/api/attendance';
import { coursesApi } from '@/api/courses';
import { enrollmentsApi } from '@/api/enrollments';
import { useNotification } from '@/hooks/useNotification';
import { formatDate, getInitials } from '@/utils/format';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import UserAvatar from '@/components/common/UserAvatar';

import {
  Calendar,
  CheckCircle2,
  XCircle,
  Filter,
  Search,
  BookOpen,
  Layers,
  Activity,
  UserCheck,
  Check,
  X as XIcon,
  Loader2,
  Clock,
} from 'lucide-react';

export function AttendanceOverview() {
  const navigate = useNavigate();

  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeCourseId, setActiveCourseId] = useState('');
  const [activeBatchId, setActiveBatchId] = useState('');

  
  const { data: attendanceData, isLoading, isError, error } = useQuery({
    queryKey: ['attendance', 'admin'],
    queryFn: attendanceApi.getAllAttendance,
  });

  
  const { data: coursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.getAllCourses,
  });

  
  const { data: enrollmentsData } = useQuery({
    queryKey: ['enrollments'],
    queryFn: enrollmentsApi.getAllEnrollments,
  });

  const courses = coursesData?.courses || [];
  const existingCourseIds = new Set(courses.map((c) => String(c._id)));

  
  const rawRecords = Array.isArray(attendanceData)
    ? attendanceData
    : Array.isArray(attendanceData?.attendances)
    ? attendanceData.attendances
    : [];

  const records = rawRecords.filter((r) => {
    const cid = String(r.courseId?._id || r.courseId || '');
    const hasValidCourse = cid && existingCourseIds.has(cid);
    const hasValidStudent = Boolean(r.studentId && (r.studentId._id || typeof r.studentId === 'string'));
    return hasValidCourse && hasValidStudent;
  });

  const rawEnrollments = Array.isArray(enrollmentsData) ? enrollmentsData : [];
  const allEnrollments = rawEnrollments.filter((e) => {
    const cid = String(e.courseId?._id || e.courseId || '');
    return cid && existingCourseIds.has(cid) && e.studentId;
  });

  
  const currentCourse = courses.find((c) => c._id === activeCourseId) || courses[0];
  const currentBatch =
    currentCourse?.batches?.find((b) => String(b._id) === String(activeBatchId)) ||
    currentCourse?.batches?.[0];

  
  const getBatchName = (r) => {
    if (r.batchId?.name) return r.batchId.name;
    if (r.batch?.name) return r.batch.name;
    const courseBatches = r.courseId?.batches;
    const targetId = r.batchId?._id || r.batchId || r.batch?._id || r.batch;
    if (Array.isArray(courseBatches)) {
      const found = courseBatches.find((b) => String(b._id) === String(targetId));
      if (found?.name) return found.name;
    }
    const parentCourse = courses.find((c) => c._id === (r.courseId?._id || r.courseId));
    if (parentCourse?.batches) {
      const found = parentCourse.batches.find((b) => String(b._id) === String(targetId));
      if (found?.name) return found.name;
    }
    return 'Morning Batch A';
  };

  
  const filteredRecords = records.filter((r) => {
    const courseId = r.courseId?._id || r.courseId;
    const batchId = String(r.batchId?._id || r.batchId || r.batch?._id || r.batch);
    const matchesCourse = selectedCourse === 'all' || courseId === selectedCourse;
    const matchesBatch = selectedBatchFilter === 'all' || batchId === selectedBatchFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const studentName = r.studentId?.name || '';
    const matchesSearch = studentName.toLowerCase().includes(search.toLowerCase());
    return matchesCourse && matchesBatch && matchesStatus && matchesSearch;
  });

  
  const total = records.length;
  const presentCount = records.filter((r) => r.status === 'present').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const presentPercentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  
  const totalActiveBatches = courses.reduce((acc, c) => acc + (c.batches?.length || 0), 0);

  
  const getTimelineProgress = (startDateStr, endDateStr) => {
    if (!startDateStr || !endDateStr) return { percentage: 0, status: 'Not Scheduled', daysLeft: 0, totalDays: 0 };
    const start = new Date(startDateStr).getTime();
    const end = new Date(endDateStr).getTime();
    const now = new Date(selectedDate).getTime();

    const totalDuration = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    const elapsed = Math.round((now - start) / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, Math.round((end - now) / (1000 * 60 * 60 * 24)));

    if (now < start) {
      return { percentage: 0, status: 'Upcoming', daysLeft, totalDays: totalDuration, elapsed: 0 };
    } else if (now > end) {
      return { percentage: 100, status: 'Completed', daysLeft: 0, totalDays: totalDuration, elapsed: totalDuration };
    } else {
      const pct = Math.min(100, Math.max(1, Math.round((elapsed / totalDuration) * 100)));
      return { percentage: pct, status: 'In Session (Live)', daysLeft, totalDays: totalDuration, elapsed };
    }
  };

  const timeline = currentBatch
    ? getTimelineProgress(currentBatch.startDate, currentBatch.endDate)
    : null;

  
  const batchStudents = allEnrollments.filter((e) => {
    const matchCourse = (e.courseId?._id || e.courseId) === currentCourse?._id;
    const matchBatch = !currentBatch || String(e.batchId || e.batch?._id || e.batch) === String(currentBatch._id);
    return matchCourse && matchBatch;
  });

  const getStudentStatusForDate = (studentId) => {
    const match = records.find((r) => {
      const isStudentMatch = (r.studentId?._id || r.studentId) === studentId;
      const isCourseMatch = (r.courseId?._id || r.courseId) === currentCourse?._id;
      const recDate = new Date(r.date).toISOString().split('T')[0];
      return isStudentMatch && isCourseMatch && recDate === selectedDate;
    });
    return match ? { status: match.status, markedBy: match.markedBy?.name || 'Instructor' } : null;
  };

  
  const getStudentCourseAttendanceRate = (studentId) => {
    const studentCourseRecords = records.filter(
      (r) =>
        (r.studentId?._id || r.studentId) === studentId &&
        (r.courseId?._id || r.courseId) === currentCourse?._id
    );
    if (studentCourseRecords.length === 0) return null;
    const present = studentCourseRecords.filter((r) => r.status === 'present').length;
    return {
      rate: Math.round((present / studentCourseRecords.length) * 100),
      total: studentCourseRecords.length,
      present,
    };
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'present':
        return <Badge variant="success" className="capitalize text-[11px]"><CheckCircle2 className="h-3 w-3 mr-1" /> Present</Badge>;
      case 'absent':
        return <Badge variant="destructive" className="capitalize text-[11px]"><XCircle className="h-3 w-3 mr-1" /> Absent</Badge>;
      default:
        return <Badge variant="outline" className="text-[11px]">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance & Live Class Tracking</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Monitor institute attendance rates, inspect live class timelines, and view teacher attendance logs.
          </p>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Sessions Logged</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">Recorded attendance entries</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Overall Presence Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{presentPercentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">{presentCount} present entries</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Absences Recorded</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{absentCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Absent student entries</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-gradient-to-br from-primary/5 via-card to-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Live Class Batches</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalActiveBatches}</div>
            <p className="text-xs text-muted-foreground mt-1">Active training schedules</p>
          </CardContent>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 🌟 INTERACTIVE CALENDAR & LIVE CLASS TIMELINE TRACKER 🌟 */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Card className="border shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-primary" /> Live Class Timeline & Date Inspector
              </CardTitle>
              <CardDescription className="text-xs">
                Inspect batch timeline progression and view real-time student attendance marked by the teacher for any date.
              </CardDescription>
            </div>

            {/* Date Picker & Today button */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1.5 bg-background p-1 rounded-lg border shadow-sm">
                <Calendar className="h-4 w-4 ml-2 text-muted-foreground" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-8 text-xs border-0 focus-visible:ring-0 w-36"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              >
                Today
              </Button>
            </div>
          </div>

          {/* Selectors for Course & Batch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Selected Course Program</label>
              <select
                value={activeCourseId || currentCourse?._id || ''}
                onChange={(e) => {
                  setActiveCourseId(e.target.value);
                  const c = courses.find((x) => x._id === e.target.value);
                  if (c?.batches?.[0]) setActiveBatchId(c.batches[0]._id);
                }}
                className="w-full h-9 rounded-md border bg-background px-3 text-xs sm:text-sm"
              >
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Selected Batch Schedule</label>
              <select
                value={activeBatchId || currentBatch?._id || ''}
                onChange={(e) => setActiveBatchId(e.target.value)}
                className="w-full h-9 rounded-md border bg-background px-3 text-xs sm:text-sm"
              >
                {currentCourse?.batches?.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.startTime} - {b.endTime})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-5">
          {/* Live Progress Bar from Start Date to End Date */}
          {currentBatch && timeline && (
            <div className="p-4 rounded-xl border bg-card space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{currentBatch.name}</span>
                    <Badge
                      variant={timeline.status.includes('Live') ? 'success' : timeline.status === 'Upcoming' ? 'warning' : 'secondary'}
                      className="text-[10px] uppercase font-semibold"
                    >
                      {timeline.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Class Schedule: <strong className="text-foreground">{currentBatch.startTime} – {currentBatch.endTime}</strong> · Assigned Instructor: <strong className="text-primary">{currentCourse?.teacher?.name || 'Assigned Instructor'}</strong>
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs font-bold text-primary">{timeline.percentage}% Completed</span>
                  <p className="text-[11px] text-muted-foreground">
                    {timeline.daysLeft} days remaining ({timeline.totalDays} total days)
                  </p>
                </div>
              </div>

              {/* Progress Track */}
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 rounded-full"
                  style={{ width: `${timeline.percentage}%` }}
                />
              </div>

              {/* Dates Legend */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                <span>Start: <strong className="text-foreground">{formatDate(currentBatch.startDate)}</strong></span>
                <span>Inspector Date: <strong className="text-primary">{formatDate(selectedDate)}</strong></span>
                <span>End: <strong className="text-foreground">{formatDate(currentBatch.endDate)}</strong></span>
              </div>
            </div>
          )}

          {/* Enrolled Students Live Roster for Selected Date */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center">
                <UserCheck className="h-4 w-4 mr-1.5 text-primary" />
                Roster for {currentBatch?.name || currentCourse?.name || 'Class'} ({batchStudents.length} Students)
              </h3>
              <span className="text-xs text-muted-foreground">
                Date: <span className="font-semibold text-foreground">{formatDate(selectedDate)}</span>
              </span>
            </div>

            {batchStudents.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed text-muted-foreground text-xs bg-muted/20">
                No students are currently enrolled in this course batch.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {batchStudents.map((enr) => {
                  const student = enr.studentId;
                  const dayStatus = getStudentStatusForDate(student?._id);
                  const courseStats = getStudentCourseAttendanceRate(student?._id);

                  return (
                    <div
                      key={enr._id}
                      className="p-3.5 rounded-lg border bg-card hover:border-primary/40 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start space-x-3">
                        <UserAvatar
                          user={student}
                          size="md"
                          onClick={() => student?._id && navigate(`/admin/users/${student._id}`)}
                        />
                        <div className="flex-1 min-w-0">
                          <span
                            className="font-bold text-xs hover:text-primary hover:underline cursor-pointer transition-colors block truncate"
                            onClick={() => student?._id && navigate(`/admin/users/${student._id}`)}
                          >
                            {student?.name || 'Student'}
                          </span>
                          <p className="text-[11px] text-muted-foreground truncate">{student?.email}</p>
                        </div>
                      </div>

                      {/* Status for Selected Date */}
                      <div className="pt-2 border-t flex items-center justify-between text-xs">
                        <span className="text-muted-foreground text-[11px]">Date Status:</span>
                        {dayStatus ? (
                          getStatusBadge(dayStatus.status)
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1 text-amber-500" /> Awaiting Teacher
                          </Badge>
                        )}
                      </div>

                      {/* Overall Course Attendance % */}
                      {courseStats && (
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                          <span>Overall Presence:</span>
                          <span className="font-bold text-foreground">
                            {courseStats.rate}% ({courseStats.present}/{courseStats.total} days)
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ATTENDANCE RECORDS LOG (Filters & History) */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Attendance Log History</h2>
            <p className="text-xs text-muted-foreground">Full institute log of teacher-recorded attendance sessions.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search student name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs h-8"
              />
            </div>

            {/* Course Filter */}
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="h-8 rounded-md border bg-background px-3 text-xs w-full sm:w-44"
            >
              <option value="all">All Courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>

            {/* Status Filter */}
            <div className="flex items-center space-x-1 w-full sm:w-auto">
              {['all', 'present', 'absent'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className="text-xs h-8 capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <LoadingSpinner text="Fetching attendance records..." />
        ) : isError ? (
          <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
            {error?.message || 'Failed to load attendance logs'}
          </div>
        ) : filteredRecords.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No Attendance Logs Found"
            description="No attendance records match the selected filters."
            action={
              <Button size="sm" variant="outline" onClick={() => { setSelectedCourse('all'); setStatusFilter('all'); setSearch(''); }}>
                Reset Filters
              </Button>
            }
          />
        ) : (
          <Card className="overflow-hidden border shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Course & Batch</th>
                    <th className="py-3 px-4">Session Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Marked By</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRecords.map((r) => (
                    <tr key={r._id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground flex items-center space-x-2.5">
                        <UserAvatar
                          user={r.studentId}
                          size="sm"
                          onClick={() => r.studentId?._id && navigate(`/admin/users/${r.studentId._id}`)}
                        />
                        <div>
                          <span
                            className="hover:text-primary hover:underline cursor-pointer transition-colors block"
                            onClick={() => r.studentId?._id && navigate(`/admin/users/${r.studentId._id}`)}
                          >
                            {r.studentId?.name || 'Student'}
                          </span>
                          <p className="text-[11px] font-normal text-muted-foreground">{r.studentId?.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        <span>{r.courseId?.name || 'Course'}</span>
                        <p className="text-[11px] text-muted-foreground font-normal">{getBatchName(r)}</p>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{formatDate(r.date)}</td>
                      <td className="py-3 px-4">{getStatusBadge(r.status)}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {r.markedBy?.name || 'Assigned Instructor'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default AttendanceOverview;
