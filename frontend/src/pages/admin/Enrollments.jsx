import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { enrollmentsApi } from '@/api/enrollments';
import { usersApi } from '@/api/users';
import { coursesApi } from '@/api/courses';
import { createEnrollmentSchema } from '@/schemas/enrollment';
import { useNotification } from '@/hooks/useNotification';
import { formatDate } from '@/utils/format';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

import {
  UserCheck,
  UserPlus,
  Search,
  Trash2,
  Edit3,
  Calendar,
  X,
  Loader2,
  BookOpen,
} from 'lucide-react';

export function Enrollments() {
  const queryClient = useQueryClient();
  const notify = useNotification();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState(null);
  const [deletingEnrollment, setDeletingEnrollment] = useState(null);

  
  const { data: enrollments, isLoading, isError, error } = useQuery({
    queryKey: ['enrollments'],
    queryFn: enrollmentsApi.getAllEnrollments,
  });

  
  const { data: usersData } = useQuery({ queryKey: ['users'], queryFn: usersApi.getAllUsers });
  const { data: coursesData } = useQuery({ queryKey: ['courses'], queryFn: coursesApi.getAllCourses });

  const students = (usersData?.users || []).filter((u) => u.role === 'student');
  const courses = coursesData?.courses || [];

  
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createEnrollmentSchema),
    defaultValues: { studentId: '', courseId: '', batchId: '', status: 'active' },
  });

  const selectedCourseId = watch('courseId');
  const selectedCourse = courses.find((c) => c._id === selectedCourseId);
  const availableBatches = selectedCourse?.batches || [];

  
  const createMutation = useMutation({
    mutationFn: enrollmentsApi.createEnrollment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      notify.success('Student enrolled successfully');
      setIsCreateOpen(false);
      reset();
    },
    onError: (err) => {
      notify.error(err.message || 'Failed to create enrollment');
    },
  });

  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => enrollmentsApi.updateEnrollment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      notify.success('Enrollment status updated');
      setEditingEnrollment(null);
    },
    onError: (err) => {
      notify.error(err.message || 'Failed to update enrollment');
    },
  });

  
  const deleteMutation = useMutation({
    mutationFn: enrollmentsApi.deleteEnrollment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      notify.success('Enrollment removed');
      setDeletingEnrollment(null);
    },
    onError: (err) => {
      notify.error(err.message || 'Failed to delete enrollment');
    },
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const existingCourseIds = new Set(courses.map((c) => String(c._id)));
  const existingStudentIds = new Set(students.map((s) => String(s._id)));

  const rawList = Array.isArray(enrollments) ? enrollments : [];
  const list = rawList.filter((e) => {
    const courseId = String(e.courseId?._id || e.courseId || '');
    const studentId = String(e.studentId?._id || e.studentId || '');
    const hasValidCourse = courseId && (existingCourseIds.size === 0 || existingCourseIds.has(courseId));
    const hasValidStudent = studentId && (existingStudentIds.size === 0 || existingStudentIds.has(studentId));
    return hasValidCourse && hasValidStudent && e.courseId && e.studentId;
  });

  const filteredEnrollments = list.filter((e) => {
    const studentName = e.studentId?.name || '';
    const courseName = e.courseId?.name || '';
    return (
      studentName.toLowerCase().includes(search.toLowerCase()) ||
      courseName.toLowerCase().includes(search.toLowerCase())
    );
  });

  const getBatchName = (item) => {
    if (item.batch?.name) return item.batch.name;
    if (item.batchId?.name) return item.batchId.name;
    const courseBatches = item.courseId?.batches;
    const targetId = item.batchId?._id || item.batchId || item.batch?._id || item.batch;
    if (Array.isArray(courseBatches)) {
      const found = courseBatches.find((b) => String(b._id) === String(targetId));
      if (found?.name) return found.name;
    }
    const parentCourse = courses.find((c) => c._id === (item.courseId?._id || item.courseId));
    if (parentCourse?.batches) {
      const found = parentCourse.batches.find((b) => String(b._id) === String(targetId));
      if (found?.name) return found.name;
    }
    if (typeof item.batch === 'string' && item.batch.length < 25) return item.batch;
    return 'Morning Batch A';
  };

  return (
    <div className="space-y-6">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student Enrollments</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Enroll students into course programs and assigned study batches.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto font-medium shadow-sm">
          <UserPlus className="h-4 w-4 mr-2" /> Enroll Student
        </Button>
      </div>

      {}
      <div className="flex items-center justify-between bg-card p-3 rounded-xl border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search student or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 h-9 text-xs sm:text-sm rounded-md border bg-background px-3"
          />
        </div>
      </div>

      {}
      {isLoading ? (
        <LoadingSpinner text="Fetching enrollment records..." />
      ) : isError ? (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error.message || 'Error loading enrollments'}
        </div>
      ) : filteredEnrollments.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No Enrollments Found"
          description={search ? `No records match "${search}"` : 'No active student enrollments found.'}
        />
      ) : (
        
        <Card className="overflow-hidden border shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Enrolled Course</th>
                  <th className="py-3 px-4">Batch Name</th>
                  <th className="py-3 px-4">Enrollment Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredEnrollments.map((item) => (
                  <tr key={item._id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">
                      <span
                        className="hover:text-primary hover:underline cursor-pointer transition-colors"
                        onClick={() => item.studentId?._id && navigate(`/admin/users/${item.studentId._id}`)}
                      >
                        {item.studentId?.name || 'Unknown Student'}
                      </span>
                      <p className="text-[11px] font-normal text-muted-foreground">{item.studentId?.email}</p>
                    </td>
                    <td className="py-3 px-4 font-medium">{item.courseId?.name || 'N/A'}</td>
                    <td className="py-3 px-4 text-foreground font-medium text-xs">
                      <Badge variant="outline" className="text-xs font-medium">
                        {getBatchName(item)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{formatDate(item.enrollmentDate)}</td>
                    <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingEnrollment(item)}>
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => setDeletingEnrollment(item)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* CREATE ENROLLMENT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl border p-4 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold flex items-center">
                <UserCheck className="h-4 w-4 mr-2 text-primary" /> Enroll Student in Course
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setIsCreateOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="font-medium">Select Student</label>
                <select {...register('studentId')} className="w-full h-10 rounded-md border bg-background px-3">
                  <option value="">Choose Student</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
                {errors.studentId && <p className="text-[11px] text-destructive">{errors.studentId.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="font-medium">Select Course Program</label>
                <select {...register('courseId')} className="w-full h-10 rounded-md border bg-background px-3">
                  <option value="">Choose Course</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
                {errors.courseId && <p className="text-[11px] text-destructive">{errors.courseId.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="font-medium">Select Course Batch</label>
                <select {...register('batchId')} className="w-full h-10 rounded-md border bg-background px-3">
                  <option value="">Choose Batch</option>
                  {availableBatches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.startTime} - {b.endTime})
                    </option>
                  ))}
                </select>
                {errors.batchId && <p className="text-[11px] text-destructive">{errors.batchId.message}</p>}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Confirm Enrollment
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* EDIT STATUS MODAL */}
      {editingEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-sm shadow-2xl border p-4 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold">Update Enrollment Status</h3>
              <Button variant="ghost" size="icon" onClick={() => setEditingEnrollment(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3 text-xs">
              <p>Student: <span className="font-bold">{editingEnrollment.studentId?.name}</span></p>
              <div className="space-y-1">
                <label className="font-medium">Status</label>
                <select
                  defaultValue={editingEnrollment.status}
                  id="status-select"
                  className="w-full h-9 rounded-md border bg-background px-3"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setEditingEnrollment(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={updateMutation.isPending}
                  onClick={() => {
                    const status = document.getElementById('status-select').value;
                    updateMutation.mutate({ id: editingEnrollment._id, data: { status } });
                  }}
                >
                  Save Status
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deletingEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-sm shadow-2xl border p-6 space-y-4 text-center">
            <Trash2 className="h-10 w-10 text-destructive mx-auto" />
            <div>
              <h3 className="text-base font-bold">Remove Enrollment Record?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Are you sure you want to remove <span className="font-semibold text-foreground">{deletingEnrollment.studentId?.name}</span> from <span className="font-semibold text-foreground">{deletingEnrollment.courseId?.name}</span>?
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeletingEnrollment(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deletingEnrollment._id)}
              >
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default Enrollments;
