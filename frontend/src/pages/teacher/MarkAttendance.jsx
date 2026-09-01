import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '@/api/courses';
import { attendanceApi } from '@/api/attendance';
import { toast } from 'sonner';
import { getInitials, formatDate } from '@/utils/format';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  BookOpen,
  Layers,
  Save,
  Loader2,
  Edit2,
  Check,
  RotateCcw,
  Users,
} from 'lucide-react';

export function MarkAttendance() {
  const queryClient = useQueryClient();

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { studentId: 'present' | 'absent' | 'late' }
  const [editingStudentId, setEditingStudentId] = useState(null); // studentId currently being edited inline

  // Fetch Teacher's Courses
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses', 'teacher'],
    queryFn: coursesApi.getMyCourses,
  });

  const courseList = Array.isArray(courses) ? courses : [];
  const selectedCourse = courseList.find((c) => c._id === selectedCourseId);
  const availableBatches = selectedCourse?.batches || [];
  const selectedBatch = availableBatches.find((b) => b._id === selectedBatchId);

  // Fetch Enrolled Students for selected course & batch
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['batchStudents', selectedCourseId, selectedBatchId],
    queryFn: () => coursesApi.getBatchStudents(selectedCourseId, selectedBatchId),
    enabled: Boolean(selectedCourseId && selectedBatchId),
  });

  // Fetch Existing Attendance Records for this batch
  const { data: batchAttendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['batchAttendance', selectedCourseId, selectedBatchId],
    queryFn: () => attendanceApi.getTeacherBatchAttendance(selectedCourseId, selectedBatchId),
    enabled: Boolean(selectedCourseId && selectedBatchId),
  });

  const students = Array.isArray(studentsData) ? studentsData : [];
  const batchAttendance = Array.isArray(batchAttendanceData) ? batchAttendanceData : [];

  // Filter attendance records specifically for the selected date
  const recordsForSelectedDate = batchAttendance.filter((att) => {
    if (!att?.date) return false;
    const attDateStr = new Date(att.date).toISOString().split('T')[0];
    return attDateStr === attendanceDate;
  });

  // Map existing records by studentId
  const existingMapByStudent = {};
  recordsForSelectedDate.forEach((att) => {
    const sId = att.studentId?._id || att.studentId;
    if (sId) {
      existingMapByStudent[String(sId)] = att;
    }
  });

  const hasSavedAttendanceForDate = recordsForSelectedDate.length > 0;

  // Initialize or synchronize local status map when batch, date, or records change
  useEffect(() => {
    const newMap = {};
    students.forEach((s) => {
      const studentObj = s.studentId || s;
      const sId = String(studentObj._id || s._id);
      const existing = existingMapByStudent[sId];
      if (existing) {
        newMap[sId] = existing.status;
      } else {
        newMap[sId] = attendanceMap[sId] || 'present';
      }
    });
    setAttendanceMap(newMap);
  }, [studentsData, batchAttendanceData, attendanceDate]);

  // Submit New Attendance Mutation
  const createMutation = useMutation({
    mutationFn: async (records) => {
      const promises = records.map((record) => attendanceApi.createAttendance(record));
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batchAttendance', selectedCourseId, selectedBatchId] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance saved successfully');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to save attendance');
    },
  });

  // Update Individual Attendance Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      return attendanceApi.updateAttendance(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batchAttendance', selectedCourseId, selectedBatchId] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance updated successfully');
      setEditingStudentId(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update attendance');
    },
  });

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status) => {
    const nextMap = { ...attendanceMap };
    students.forEach((s) => {
      const studentObj = s.studentId || s;
      const id = String(studentObj._id || s._id);
      nextMap[id] = status;
    });
    setAttendanceMap(nextMap);
  };

  const handleSaveAttendance = () => {
    if (!selectedCourseId || !selectedBatchId) {
      toast.error('Please select both a course and a batch schedule');
      return;
    }

    if (students.length === 0) {
      toast.error('No enrolled students in this batch');
      return;
    }

    // Filter out students who already have saved attendance records to prevent duplicates
    const recordsToSubmit = [];
    students.forEach((s) => {
      const studentObj = s.studentId || s;
      const id = String(studentObj._id || s._id);
      if (!existingMapByStudent[id]) {
        recordsToSubmit.push({
          studentId: id,
          courseId: selectedCourseId,
          batchId: selectedBatchId,
          date: attendanceDate,
          status: attendanceMap[id] || 'present',
        });
      }
    });

    if (recordsToSubmit.length === 0) {
      toast.info('Attendance for all students on this date has already been recorded.');
      return;
    }

    createMutation.mutate(recordsToSubmit);
  };

  const handleQuickUpdateStatus = (existingRecord, newStatus) => {
    if (!existingRecord?._id) return;
    if (existingRecord.status === newStatus) {
      setEditingStudentId(null);
      return;
    }
    updateMutation.mutate({ id: existingRecord._id, status: newStatus });
  };

  // Real database-calculated stats
  const presentCount = recordsForSelectedDate.filter((r) => r.status === 'present').length;
  const absentCount = recordsForSelectedDate.filter((r) => r.status === 'absent').length;
  const lateCount = recordsForSelectedDate.filter((r) => r.status === 'late').length;
  const totalRecorded = recordsForSelectedDate.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mark Batch Attendance</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Record daily present, absent, and late attendance status for your active student batches.
          </p>
        </div>
      </div>

      {/* 3-Step Selection Filters Card */}
      <Card className="p-4 border shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
          {/* Step 1: Select Course */}
          <div className="space-y-1">
            <label className="font-medium flex items-center">
              <BookOpen className="h-3.5 w-3.5 mr-1 text-primary" /> Step 1: Course Program
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setSelectedBatchId('');
                setEditingStudentId(null);
              }}
              className="w-full h-10 rounded-md border bg-background px-3"
            >
              <option value="">Select Course</option>
              {courseList.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Select Batch */}
          <div className="space-y-1">
            <label className="font-medium flex items-center">
              <Layers className="h-3.5 w-3.5 mr-1 text-primary" /> Step 2: Batch Schedule
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                setEditingStudentId(null);
              }}
              disabled={!selectedCourseId}
              className="w-full h-10 rounded-md border bg-background px-3 disabled:opacity-50"
            >
              <option value="">Select Batch</option>
              {availableBatches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name} ({b.startTime} - {b.endTime})
                </option>
              ))}
            </select>
          </div>

          {/* Step 3: Select Date */}
          <div className="space-y-1">
            <label className="font-medium flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1 text-primary" /> Step 3: Session Date
            </label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => {
                setAttendanceDate(e.target.value);
                setEditingStudentId(null);
              }}
              className="w-full h-10 rounded-md border bg-background px-3"
            />
          </div>
        </div>
      </Card>

      {/* Roster & Attendance Controls */}
      {!selectedCourseId || !selectedBatchId ? (
        <EmptyState
          icon={Calendar}
          title="Select Course & Batch"
          description="Choose an assigned course program and batch schedule above to load enrolled students."
        />
      ) : studentsLoading || attendanceLoading ? (
        <LoadingSpinner text="Loading enrolled student roster & attendance history..." />
      ) : students.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No Enrolled Students"
          description="This batch does not currently have any active student enrollments."
        />
      ) : (
        <div className="space-y-6">
          {/* Real Database Attendance Summary Banner */}
          {hasSavedAttendanceForDate && (
            <Card className="bg-muted/40 border p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-300">
                      Saved Session
                    </Badge>
                    <span className="font-semibold text-sm">{formatDate(attendanceDate)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedCourse?.name} &bull; Batch: {selectedBatch?.name}
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-3 text-center sm:text-right">
                  <div className="bg-background px-3 py-1.5 rounded-lg border">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-base font-bold text-foreground">{students.length}</p>
                  </div>
                  <div className="bg-background px-3 py-1.5 rounded-lg border">
                    <p className="text-xs text-emerald-600 font-medium">Present</p>
                    <p className="text-base font-bold text-emerald-600">{presentCount}</p>
                  </div>
                  <div className="bg-background px-3 py-1.5 rounded-lg border">
                    <p className="text-xs text-destructive font-medium">Absent</p>
                    <p className="text-base font-bold text-destructive">{absentCount}</p>
                  </div>
                  <div className="bg-background px-3 py-1.5 rounded-lg border">
                    <p className="text-xs text-amber-600 font-medium">Late</p>
                    <p className="text-base font-bold text-amber-600">{lateCount}</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Student Roster Table Card */}
          <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b bg-muted/30">
              <div>
                <CardTitle className="text-base font-bold flex items-center">
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  Enrolled Students ({students.length})
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {hasSavedAttendanceForDate
                    ? 'Attendance saved in database. Click Edit on any student to update their record.'
                    : 'Toggle present/absent/late for each student and save the log.'}
                </p>
              </div>

              {!hasSavedAttendanceForDate && (
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleMarkAll('present')} className="text-xs h-8">
                    Mark All Present
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleMarkAll('absent')} className="text-xs h-8">
                    Mark All Absent
                  </Button>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0 divide-y">
              {students.map((item) => {
                const student = item.studentId || item;
                const studentId = String(student._id || item._id);
                const existingRecord = existingMapByStudent[studentId];
                const currentStatus = existingRecord?.status || attendanceMap[studentId] || 'present';
                const isEditingThis = editingStudentId === studentId;

                return (
                  <div
                    key={studentId}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                        {getInitials(student.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                    </div>

                    {/* If record already exists and not in inline edit mode: Show status badge + Edit button */}
                    {existingRecord && !isEditingThis ? (
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant={
                            existingRecord.status === 'present'
                              ? 'default'
                              : existingRecord.status === 'absent'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className={`text-xs px-2.5 py-1 capitalize font-semibold ${
                            existingRecord.status === 'present'
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : existingRecord.status === 'late'
                              ? 'bg-amber-500 text-white hover:bg-amber-600'
                              : ''
                          }`}
                        >
                          {existingRecord.status === 'present' && <CheckCircle2 className="h-3 w-3 mr-1 inline" />}
                          {existingRecord.status === 'absent' && <XCircle className="h-3 w-3 mr-1 inline" />}
                          {existingRecord.status === 'late' && <Clock className="h-3 w-3 mr-1 inline" />}
                          {existingRecord.status}
                        </Badge>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingStudentId(studentId)}
                          className="text-xs h-8"
                        >
                          <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                      </div>
                    ) : (
                      /* Interactive Toggle Buttons (for initial marking OR inline editing) */
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={currentStatus === 'present' ? 'default' : 'outline'}
                          onClick={() => {
                            if (existingRecord) {
                              handleQuickUpdateStatus(existingRecord, 'present');
                            } else {
                              handleStatusChange(studentId, 'present');
                            }
                          }}
                          disabled={updateMutation.isPending}
                          className={`text-xs h-8 ${
                            currentStatus === 'present' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Present
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant={currentStatus === 'absent' ? 'destructive' : 'outline'}
                          onClick={() => {
                            if (existingRecord) {
                              handleQuickUpdateStatus(existingRecord, 'absent');
                            } else {
                              handleStatusChange(studentId, 'absent');
                            }
                          }}
                          disabled={updateMutation.isPending}
                          className="text-xs h-8"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Absent
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant={currentStatus === 'late' ? 'secondary' : 'outline'}
                          onClick={() => {
                            if (existingRecord) {
                              handleQuickUpdateStatus(existingRecord, 'late');
                            } else {
                              handleStatusChange(studentId, 'late');
                            }
                          }}
                          disabled={updateMutation.isPending}
                          className={`text-xs h-8 ${
                            currentStatus === 'late' ? 'bg-amber-500 text-white hover:bg-amber-600' : ''
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5 mr-1" /> Late
                        </Button>

                        {isEditingThis && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingStudentId(null)}
                            className="text-xs h-8 text-muted-foreground"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>

            {/* Save Attendance Button if not all records are created */}
            {!hasSavedAttendanceForDate && (
              <CardFooter className="p-4 border-t flex justify-end bg-card">
                <Button
                  onClick={handleSaveAttendance}
                  disabled={createMutation.isPending}
                  size="lg"
                  className="font-semibold shadow-md"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving Attendance...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" /> Save Attendance
                    </>
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

export default MarkAttendance;

