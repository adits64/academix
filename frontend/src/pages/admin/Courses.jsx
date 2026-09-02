import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { coursesApi } from '@/api/courses';
import { usersApi } from '@/api/users';
import { enrollmentsApi } from '@/api/enrollments';
import { mailApi } from '@/api/mail';
import { createCourseSchema } from '@/schemas/course';
import { useNotification } from '@/hooks/useNotification';
import { formatCurrency, formatDate, getInitials } from '@/utils/format';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import UserAvatar from '@/components/common/UserAvatar';

import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  User,
  X,
  Loader2,
  Layers,
  Mail,
  UserCheck,
  Send,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export function Courses() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notify = useNotification();

  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);

  
  const [isAssignTeacherOpen, setIsAssignTeacherOpen] = useState(false);
  const [selectedTeacherToAssign, setSelectedTeacherToAssign] = useState('');

  
  const [noticeStudent, setNoticeStudent] = useState(null);
  const [noticeSubject, setNoticeSubject] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');

  
  const { data: coursesData, isLoading, isError, error } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.getAllCourses,
  });

  const courses = coursesData?.courses || [];

  
  const { data: enrollmentsData } = useQuery({
    queryKey: ['enrollments'],
    queryFn: enrollmentsApi.getAllEnrollments,
  });
  const allEnrollments = Array.isArray(enrollmentsData) ? enrollmentsData : [];

  
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAllUsers,
  });

  const teachers = (usersData?.users || []).filter((u) => u.role === 'teacher');

  
  const getTeacherForCourse = (courseOrTeacher) => {
    if (!courseOrTeacher) return null;
    const teacherRef = courseOrTeacher.teacher !== undefined ? courseOrTeacher.teacher : courseOrTeacher;
    if (!teacherRef) return null;
    const tid = String(teacherRef._id || teacherRef);
    const found = teachers.find((t) => String(t._id) === tid);
    if (found) return found;
    if (typeof teacherRef === 'object' && teacherRef.name) return teacherRef;
    return null;
  };

  
  const sendNoticeMutation = useMutation({
    mutationFn: mailApi.sendNotice,
    onSuccess: () => {
      notify.success(`Notice sent successfully to ${noticeStudent?.name}`);
      setNoticeStudent(null);
      setNoticeSubject('');
      setNoticeMessage('');
    },
    onError: (err) => {
      notify.error(err.message || 'Failed to send notice email');
    },
  });

  
  const createMutation = useMutation({
    mutationFn: coursesApi.createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      notify.success('Course created successfully');
      setIsCreateOpen(false);
      reset();
    },
    onError: (err) => {
      notify.error(err.message || 'Failed to create course');
    },
  });

  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => coursesApi.updateCourse(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      notify.success('Course updated successfully');
      setEditingCourse(null);
      if (selectedCourse && selectedCourse._id === (res?.course?._id || editingCourse?._id)) {
        setSelectedCourse(res?.course || { ...selectedCourse, ...res });
      }
    },
    onError: (err) => {
      notify.error(err.message || 'Failed to update course');
    },
  });

  
  const assignTeacherMutation = useMutation({
    mutationFn: ({ courseId, teacherId }) => coursesApi.updateCourse(courseId, { teacher: teacherId }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notify.success('Teacher assignment updated');
      setIsAssignTeacherOpen(false);
      const updatedTeacher = teachers.find((t) => String(t._id) === String(selectedTeacherToAssign));
      if (selectedCourse) {
        setSelectedCourse({
          ...selectedCourse,
          teacher: updatedTeacher || res?.course?.teacher || selectedTeacherToAssign,
        });
      }
    },
    onError: (err) => {
      notify.error(err.message || 'Failed to update teacher assignment');
    },
  });

  
  const deleteMutation = useMutation({
    mutationFn: coursesApi.deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notify.success('Course deleted successfully');
      setDeletingCourse(null);
      if (selectedCourse && selectedCourse._id === deletingCourse?._id) {
        setSelectedCourse(null);
      }
    },
    onError: (err) => {
      notify.error(err.message || 'Failed to delete course');
    },
  });

  
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      teacher: '',
      duration: '3 Months',
      fee: 15000,
      status: 'active',
      batches: [
        {
          name: 'Morning Batch A',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          startTime: '08:00 AM',
          endTime: '10:00 AM',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'batches',
  });

  const filteredCourses = courses.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses & Batches</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Configure institute training programs, batch schedules, fees, and assigned instructors.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto font-medium shadow-sm">
          <Plus className="h-4 w-4 mr-2" /> Create New Course
        </Button>
      </div>

      {}
      <div className="flex items-center justify-between bg-card p-3 rounded-xl border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by course name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs sm:text-sm h-9"
          />
        </div>
      </div>

      {}
      {isLoading ? (
        <LoadingSpinner text="Loading courses..." />
      ) : isError ? (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error.message || 'Failed to load courses'}
        </div>
      ) : filteredCourses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Courses Found"
          description={search ? `No courses match "${search}"` : 'No course programs have been added yet.'}
        />
      ) : (
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((c) => (
            <Card key={c._id} className="flex flex-col justify-between border hover:border-primary/40 transition-all">
              <CardHeader className="pb-3 space-y-2">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="font-mono text-xs font-bold border-primary/30 text-primary">
                    {c.code}
                  </Badge>
                  <Badge variant={c.status === 'active' ? 'success' : 'secondary'} className="capitalize text-[11px]">
                    {c.status}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{c.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">{c.description || 'No description provided.'}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 text-xs text-muted-foreground pb-4">
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="flex items-center"><User className="h-3.5 w-3.5 mr-1 text-primary" /> Teacher</span>
                  <span className="font-semibold text-foreground">{getTeacherForCourse(c)?.name || 'Unassigned'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center"><Clock className="h-3.5 w-3.5 mr-1 text-primary" /> Duration</span>
                  <span className="font-medium text-foreground">{c.duration}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center"><Layers className="h-3.5 w-3.5 mr-1 text-primary" /> Batches</span>
                  <Badge variant="outline" className="text-[11px]">{c.batches?.length || 0} Batches</Badge>
                </div>

                <div className="flex items-center justify-between text-sm font-bold text-foreground border-t pt-2">
                  <span>Course Fee</span>
                  <span className="text-primary">{formatCurrency(c.fee)}</span>
                </div>
              </CardContent>

              <div className="p-4 pt-0 flex items-center justify-between border-t mt-auto pt-3">
                <Button variant="outline" size="sm" onClick={() => setSelectedCourse(c)} className="text-xs">
                  View Details & Batches
                </Button>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary hover:bg-primary/10"
                    title="Edit Course"
                    onClick={() => setEditingCourse(c)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    title="Delete Course"
                    onClick={() => setDeletingCourse(c)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE COURSE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-2xl shadow-2xl border my-8">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-base font-bold flex items-center">
                <Plus className="h-4 w-4 mr-2 text-primary" /> Add New Course Program
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setIsCreateOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="p-4 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-medium">Course Name</label>
                  <Input placeholder="Full Stack Web Development" {...register('name')} />
                  {errors.name && <p className="text-[11px] text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="font-medium">Course Code</label>
                  <Input placeholder="FSWD-101" {...register('code')} />
                  {errors.code && <p className="text-[11px] text-destructive">{errors.code.message}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium">Description & Syllabus</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  placeholder="Overview of curriculum, learning objectives, and skills covered..."
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-medium">Assigned Teacher</label>
                  <select {...register('teacher')} className="w-full h-10 rounded-md border bg-background px-3">
                    <option value="">Select Instructor</option>
                    {teachers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.email})
                      </option>
                    ))}
                  </select>
                  {errors.teacher && <p className="text-[11px] text-destructive">{errors.teacher.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="font-medium">Duration</label>
                  <Input placeholder="e.g. 3 Months, 120 Hours" {...register('duration')} />
                  {errors.duration && <p className="text-[11px] text-destructive">{errors.duration.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="font-medium">Course Fee (NPR)</label>
                  <Input type="number" placeholder="15000" {...register('fee')} />
                  {errors.fee && <p className="text-[11px] text-destructive">{errors.fee.message}</p>}
                </div>
              </div>

              {/* Dynamic Batches Section */}
              <div className="space-y-3 border-t pt-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold flex items-center text-xs uppercase tracking-wider text-muted-foreground">
                    <Layers className="h-3.5 w-3.5 mr-1.5 text-primary" /> Active Batches Schedules
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() =>
                      append({
                        name: `Batch ${String.fromCharCode(65 + fields.length)}`,
                        startDate: new Date().toISOString().split('T')[0],
                        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        startTime: '08:00 AM',
                        endTime: '10:00 AM',
                      })
                    }
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Batch Schedule
                  </Button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {fields.map((field, idx) => (
                    <div key={field.id} className="p-3 border rounded-lg bg-muted/20 space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-primary">Batch #{idx + 1}</span>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => remove(idx)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="space-y-0.5">
                          <label className="text-[11px] text-muted-foreground">Batch Name</label>
                          <Input placeholder="Morning Batch A" {...register(`batches.${idx}.name`)} className="h-8 text-xs" />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[11px] text-muted-foreground">Start Date</label>
                          <Input type="date" {...register(`batches.${idx}.startDate`)} className="h-8 text-xs" />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[11px] text-muted-foreground">End Date</label>
                          <Input type="date" {...register(`batches.${idx}.endDate`)} className="h-8 text-xs" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <label className="text-[11px] text-muted-foreground">Class Start Time</label>
                          <Input placeholder="08:00 AM" {...register(`batches.${idx}.startTime`)} className="h-8 text-xs" />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[11px] text-muted-foreground">Class End Time</label>
                          <Input placeholder="10:00 AM" {...register(`batches.${idx}.endTime`)} className="h-8 text-xs" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  Create Course Program
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* 🌟 EDIT COURSE MODAL 🌟 */}
      {editingCourse && (
        <EditCourseModal
          course={editingCourse}
          teachers={teachers}
          onClose={() => setEditingCourse(null)}
          onSave={(data) => updateMutation.mutate({ id: editingCourse._id, data })}
          isPending={updateMutation.isPending}
        />
      )}

      {/* COURSE DETAILS & ENROLLED STUDENTS MODAL */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-2xl shadow-2xl border my-6 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-5 border-b sticky top-0 bg-card z-10">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs font-bold text-primary border-primary/30">
                    {selectedCourse.code}
                  </Badge>
                  <Badge variant={selectedCourse.status === 'active' ? 'success' : 'secondary'} className="capitalize text-[10px]">
                    {selectedCourse.status}
                  </Badge>
                </div>
                <h3 className="text-xl font-bold mt-1 text-foreground">{selectedCourse.name}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-medium"
                  onClick={() => setEditingCourse(selectedCourse)}
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1 text-primary" /> Edit Course
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setSelectedCourse(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 space-y-5 overflow-y-auto text-xs sm:text-sm">
              {/* Course Overview Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-muted/40 rounded-xl border">
                <div>
                  <span className="text-muted-foreground text-[11px] block">Course Fee</span>
                  <span className="font-bold text-base text-primary">{formatCurrency(selectedCourse.fee)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px] block">Course Duration</span>
                  <span className="font-semibold text-sm text-foreground">{selectedCourse.duration}</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-muted-foreground text-[11px] block">Total Batches</span>
                  <span className="font-semibold text-sm text-foreground">{selectedCourse.batches?.length || 0} Batches</span>
                </div>
              </div>

              {selectedCourse.description && (
                <div className="space-y-1">
                  <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Description & Syllabus</span>
                  <p className="text-xs text-foreground/90 leading-relaxed bg-card p-3 rounded-lg border">
                    {selectedCourse.description}
                  </p>
                </div>
              )}

              {/* 🌟 DISTINCT STYLED TEACHER / INSTRUCTOR CARD (With Assign/Change) 🌟 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center">
                    <User className="h-3.5 w-3.5 mr-1.5 text-primary" /> Assigned Instructor
                  </span>
                  {!isAssignTeacherOpen && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-primary hover:bg-primary/10"
                      onClick={() => {
                        const existingTeacher = getTeacherForCourse(selectedCourse);
                        setSelectedTeacherToAssign(existingTeacher?._id || '');
                        setIsAssignTeacherOpen(true);
                      }}
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      {getTeacherForCourse(selectedCourse) ? 'Change Teacher' : 'Assign Teacher'}
                    </Button>
                  )}
                </div>

                {isAssignTeacherOpen ? (
                  <div className="p-4 rounded-xl border-2 border-primary/30 bg-primary/5 space-y-3">
                    <label className="text-xs font-semibold block">Select Instructor for {selectedCourse.name}</label>
                    <select
                      value={selectedTeacherToAssign}
                      onChange={(e) => setSelectedTeacherToAssign(e.target.value)}
                      className="w-full h-9 rounded-md border bg-background px-3 text-xs sm:text-sm"
                    >
                      <option value="">Select Teacher...</option>
                      {teachers.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name} ({t.email})
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setIsAssignTeacherOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={!selectedTeacherToAssign || assignTeacherMutation.isPending}
                        onClick={() =>
                          assignTeacherMutation.mutate({
                            courseId: selectedCourse._id,
                            teacherId: selectedTeacherToAssign,
                          })
                        }
                      >
                        {assignTeacherMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                        Save Assignment
                      </Button>
                    </div>
                  </div>
                ) : (() => {
                  const resolvedTeacher = getTeacherForCourse(selectedCourse);
                  return (
                  <div className="p-4 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-primary/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3.5">
                      <div className="h-11 w-11 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm shadow-md ring-2 ring-primary/20">
                        {getInitials(resolvedTeacher?.name || 'Instructor')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{resolvedTeacher?.name || 'Unassigned'}</span>
                          <Badge variant="warning" className="text-[10px] py-0 px-1.5 font-medium">
                            <ShieldCheck className="h-3 w-3 mr-0.5" /> Instructor
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{resolvedTeacher?.email || 'No email registered'}</p>
                      </div>
                    </div>
                    {resolvedTeacher?._id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs self-start sm:self-auto bg-card hover:bg-primary hover:text-primary-foreground transition-all"
                        onClick={() => navigate(`/admin/users/${resolvedTeacher._id}`)}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> View Profile
                      </Button>
                    )}
                  </div>
                  );
                })()}
              </div>

              {/* ACTIVE BATCHES */}
              <div className="space-y-2">
                <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center">
                  <Layers className="h-3.5 w-3.5 mr-1.5 text-primary" /> Batch Schedules ({selectedCourse.batches?.length || 0})
                </span>
                {(!selectedCourse.batches || selectedCourse.batches.length === 0) ? (
                  <p className="text-xs text-muted-foreground p-3 border rounded-lg bg-card">No batches configured for this course yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedCourse.batches.map((b) => (
                      <div key={b._id} className="p-3 rounded-lg border bg-card hover:border-primary/30 transition-all flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-foreground">{b.name}</span>
                          <Badge variant="secondary" className="text-[10px] font-mono">{b.startTime} - {b.endTime}</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground flex items-center mt-2">
                          <Calendar className="h-3 w-3 mr-1 text-primary" /> {formatDate(b.startDate)} → {formatDate(b.endDate)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ENROLLED STUDENTS LIST */}
              <div className="space-y-2 pt-1">
                {(() => {
                  const courseStudents = allEnrollments.filter(
                    (e) => (e.courseId?._id || e.courseId) === selectedCourse._id
                  );
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center">
                          <UserCheck className="h-3.5 w-3.5 mr-1.5 text-primary" /> Enrolled Students ({courseStudents.length})
                        </span>
                      </div>

                      {courseStudents.length === 0 ? (
                        <div className="p-6 text-center rounded-xl border border-dashed text-muted-foreground text-xs bg-muted/20">
                          No students are currently enrolled in this course program.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {courseStudents.map((enr) => {
                            const student = enr.studentId;
                            const batchName =
                              enr.batch?.name ||
                              selectedCourse.batches?.find((b) => String(b._id) === String(enr.batchId || enr.batch?._id || enr.batch))?.name ||
                              'Batch';
                            return (
                              <div
                                key={enr._id}
                                className="p-3 rounded-lg border bg-card hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                              >
                                <div className="flex items-center space-x-3">
                                  <UserAvatar
                                    user={student}
                                    size="sm"
                                    onClick={() => student?._id && navigate(`/admin/users/${student._id}`)}
                                  />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="font-bold text-xs hover:text-primary hover:underline cursor-pointer transition-colors"
                                        onClick={() => student?._id && navigate(`/admin/users/${student._id}`)}
                                      >
                                        {student?.name || 'Enrolled Student'}
                                      </span>
                                      <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">
                                        {batchName}
                                      </Badge>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">{student?.email}</p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2 self-end sm:self-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs px-2.5 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                                    onClick={() => {
                                      if (student) {
                                        setNoticeStudent(student);
                                        setNoticeSubject(`Notice regarding ${selectedCourse.name}`);
                                        setNoticeMessage('');
                                      }
                                    }}
                                  >
                                    <Mail className="h-3 w-3 mr-1" /> Send Notice
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                                    onClick={() => student?._id && navigate(`/admin/users/${student._id}`)}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t flex justify-end bg-card rounded-b-xl">
              <Button variant="outline" size="sm" onClick={() => setSelectedCourse(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* QUICK SEND NOTICE MODAL TO STUDENT */}
      {noticeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl border p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-primary" /> Send Notice to Student
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  To: <span className="font-semibold text-foreground">{noticeStudent.name}</span> ({noticeStudent.email})
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setNoticeStudent(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!noticeSubject.trim() || !noticeMessage.trim()) {
                  notify.error('Please provide both subject and announcement message');
                  return;
                }
                sendNoticeMutation.mutate({
                  studentIds: [noticeStudent._id],
                  subject: noticeSubject,
                  message: noticeMessage,
                });
              }}
              className="space-y-3.5 text-xs sm:text-sm"
            >
              <div className="space-y-1">
                <label className="font-medium">Notice Subject</label>
                <Input
                  placeholder="Important Notice..."
                  value={noticeSubject}
                  onChange={(e) => setNoticeSubject(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium">Message Body</label>
                <textarea
                  rows={4}
                  placeholder="Write your announcement or notice here..."
                  value={noticeMessage}
                  onChange={(e) => setNoticeMessage(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setNoticeStudent(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={sendNoticeMutation.isPending}>
                  {sendNoticeMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Send Notice
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deletingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-sm shadow-2xl border p-6 space-y-4 text-center">
            <Trash2 className="h-10 w-10 text-destructive mx-auto" />
            <div>
              <h3 className="text-base font-bold">Delete Course Program?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Are you sure you want to delete <span className="font-semibold text-foreground">{deletingCourse.name}</span> ({deletingCourse.code})?
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeletingCourse(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deletingCourse._id)}
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

// ═══════════════════════════════════════════════════════════════
// 🌟 EDIT COURSE MODAL COMPONENT 🌟
// ═══════════════════════════════════════════════════════════════
function EditCourseModal({ course, teachers, onClose, onSave, isPending }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      name: course.name || '',
      code: course.code || '',
      description: course.description || '',
      teacher: course.teacher?._id || course.teacher || '',
      duration: course.duration || '3 Months',
      fee: course.fee || 15000,
      status: course.status || 'active',
      batches:
        course.batches && course.batches.length > 0
          ? course.batches.map((b) => ({
              name: b.name || '',
              startDate: b.startDate ? b.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
              endDate: b.endDate
                ? b.endDate.split('T')[0]
                : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              startTime: b.startTime || '08:00 AM',
              endTime: b.endTime || '10:00 AM',
            }))
          : [
              {
                name: 'Morning Batch A',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                startTime: '08:00 AM',
                endTime: '10:00 AM',
              },
            ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'batches',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
      <Card className="w-full max-w-2xl shadow-2xl border my-8">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-base font-bold flex items-center">
            <Edit2 className="h-4 w-4 mr-2 text-primary" /> Edit Course Program ({course.code})
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="p-4 space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-medium">Course Name</label>
              <Input placeholder="Course Name" {...register('name')} />
              {errors.name && <p className="text-[11px] text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="font-medium">Course Code</label>
              <Input placeholder="Course Code" {...register('code')} />
              {errors.code && <p className="text-[11px] text-destructive">{errors.code.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium">Description & Syllabus</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Overview of curriculum, learning objectives, and skills covered..."
              className="w-full rounded-md border border-input bg-background p-2.5 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-medium">Assigned Teacher</label>
              <select {...register('teacher')} className="w-full h-10 rounded-md border bg-background px-3">
                <option value="">Select Instructor</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.email})
                  </option>
                ))}
              </select>
              {errors.teacher && <p className="text-[11px] text-destructive">{errors.teacher.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="font-medium">Duration</label>
              <Input placeholder="e.g. 3 Months, 120 Hours" {...register('duration')} />
              {errors.duration && <p className="text-[11px] text-destructive">{errors.duration.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="font-medium">Course Fee (NPR)</label>
              <Input type="number" placeholder="15000" {...register('fee')} />
              {errors.fee && <p className="text-[11px] text-destructive">{errors.fee.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium">Status</label>
            <select {...register('status')} className="w-full h-10 rounded-md border bg-background px-3">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Dynamic Batches Section */}
          <div className="space-y-3 border-t pt-3">
            <div className="flex items-center justify-between">
              <label className="font-bold flex items-center text-xs uppercase tracking-wider text-muted-foreground">
                <Layers className="h-3.5 w-3.5 mr-1.5 text-primary" /> Active Batches Schedules
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() =>
                  append({
                    name: `Batch ${String.fromCharCode(65 + fields.length)}`,
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    startTime: '08:00 AM',
                    endTime: '10:00 AM',
                  })
                }
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Batch Schedule
              </Button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {fields.map((field, idx) => (
                <div key={field.id} className="p-3 border rounded-lg bg-muted/20 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-primary">Batch #{idx + 1}</span>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => remove(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="space-y-0.5">
                      <label className="text-[11px] text-muted-foreground">Batch Name</label>
                      <Input placeholder="Morning Batch A" {...register(`batches.${idx}.name`)} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[11px] text-muted-foreground">Start Date</label>
                      <Input type="date" {...register(`batches.${idx}.startDate`)} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[11px] text-muted-foreground">End Date</label>
                      <Input type="date" {...register(`batches.${idx}.endDate`)} className="h-8 text-xs" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                      <label className="text-[11px] text-muted-foreground">Class Start Time</label>
                      <Input placeholder="08:00 AM" {...register(`batches.${idx}.startTime`)} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[11px] text-muted-foreground">Class End Time</label>
                      <Input placeholder="10:00 AM" {...register(`batches.${idx}.endTime`)} className="h-8 text-xs" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default Courses;
