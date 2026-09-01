import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api/users';
import { coursesApi } from '@/api/courses';
import { enrollmentsApi } from '@/api/enrollments';
import { attendanceApi } from '@/api/attendance';
import { notesApi } from '@/api/notes';
import { uploadFileToCloudinary } from '@/utils/upload';
import { downloadNoteFile } from '@/utils/download';
import { useNotification } from '@/hooks/useNotification';
import { formatDate, getInitials } from '@/utils/format';
import { ROLE_LABELS } from '@/constants/roles';
import { toast } from 'sonner';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

import {
  ArrowLeft,
  Mail,
  Shield,
  Calendar,
  BookOpen,
  FileText,
  UserCheck,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  User as UserIcon,
  Plus,
  Trash2,
  Ban,
  RotateCcw,
  Loader2,
  X,
  Edit2,
  Save,
  Camera,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Download,
} from 'lucide-react';

export function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useNotification();
  const queryClient = useQueryClient();

  // Edit user state
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('student');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [downloadingNoteId, setDownloadingNoteId] = useState(null);
  const avatarInputRef = useRef(null);

  const handleDownloadNote = async (note) => {
    if (downloadingNoteId) return;
    setDownloadingNoteId(note._id);
    try {
      await downloadNoteFile(note);
    } finally {
      setDownloadingNoteId(null);
    }
  };

  // Enroll modal state (for students)
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [enrollCourseId, setEnrollCourseId] = useState('');
  const [enrollBatchId, setEnrollBatchId] = useState('');
  const [deletingEnrollment, setDeletingEnrollment] = useState(null);

  // Assign course to teacher state (for teachers)
  const [isAssignCourseOpen, setIsAssignCourseOpen] = useState(false);
  const [selectedCourseToAssign, setSelectedCourseToAssign] = useState('');
  const [unassigningCourse, setUnassigningCourse] = useState(null);
  const [reassignTeacherId, setReassignTeacherId] = useState('');

  // Fetch user profile
  const { data: userData, isLoading: userLoading, isError, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getUserById(id),
    enabled: Boolean(id),
  });

  const user = userData?.user;
  const role = user?.role;

  // Fetch all users for other teachers list
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAllUsers,
    enabled: role === 'teacher',
  });
  const allOtherTeachers = (usersData?.users || []).filter((u) => u.role === 'teacher' && u._id !== id);

  // Fetch courses (for teacher: assigned courses, for cross-referencing)
  const { data: allCoursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.getAllCourses,
    enabled: Boolean(user),
  });
  const allCourses = allCoursesData?.courses || [];

  // Fetch enrollments (for student: their enrollments)
  const { data: allEnrollments } = useQuery({
    queryKey: ['enrollments'],
    queryFn: enrollmentsApi.getAllEnrollments,
    enabled: role === 'student',
  });

  // Fetch attendance (admin-level access)
  const { data: allAttendance } = useQuery({
    queryKey: ['attendance', 'admin'],
    queryFn: attendanceApi.getAllAttendance,
    enabled: Boolean(user),
  });

  // Fetch notes (admin-level access)
  const { data: allNotes } = useQuery({
    queryKey: ['notes', 'admin'],
    queryFn: notesApi.getAllNotes,
    enabled: Boolean(user),
  });

  // Assign Course to Teacher Mutation
  const assignCourseToTeacherMutation = useMutation({
    mutationFn: (courseId) => coursesApi.updateCourse(courseId, { teacher: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      notify.success('Course assigned to instructor successfully');
      setIsAssignCourseOpen(false);
      setSelectedCourseToAssign('');
    },
    onError: (err) => {
      notify.error(err.message || 'Failed to assign course to teacher');
    },
  });

  // Unassign Course from Teacher Mutation
  const unassignCourseFromTeacherMutation = useMutation({
    mutationFn: ({ courseId, replacementTeacherId }) =>
      coursesApi.updateCourse(courseId, { teacher: replacementTeacherId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      notify.success('Course unassigned from instructor');
      setUnassigningCourse(null);
      setReassignTeacherId('');
    },
    onError: (err) => {
      notify.error(err.message || 'Failed to unassign course');
    },
  });

  const existingCourseIds = new Set(allCourses.map((c) => String(c._id)));

  // Derive role-specific data
  const teacherCourses = role === 'teacher'
    ? allCourses.filter((c) => c.teacher?._id === id || c.teacher === id)
    : [];

  const assignableCourses = allCourses.filter((c) => c.teacher?._id !== id && c.teacher !== id);

  const studentEnrollments = role === 'student'
    ? (Array.isArray(allEnrollments) ? allEnrollments : []).filter((e) => {
        const isStudent = e.studentId?._id === id || e.studentId === id;
        const courseId = String(e.courseId?._id || e.courseId || '');
        const hasValidCourse = courseId && existingCourseIds.has(courseId);
        return isStudent && hasValidCourse && e.courseId;
      })
    : [];

  const userAttendance = (Array.isArray(allAttendance) ? allAttendance : []).filter((a) => {
    const courseId = String(a.courseId?._id || a.courseId || '');
    const hasValidCourse = courseId && existingCourseIds.has(courseId);
    if (!hasValidCourse) return false;
    if (role === 'student') return a.studentId?._id === id || a.studentId === id;
    if (role === 'teacher') return a.markedBy?._id === id || a.markedBy === id;
    return false;
  });

  const userNotes = (Array.isArray(allNotes) ? allNotes : []).filter((n) => {
    const courseId = String(n.courseId?._id || n.courseId || '');
    const hasValidCourse = courseId && existingCourseIds.has(courseId);
    if (!hasValidCourse) return false;
    if (role === 'teacher') return n.uploadedBy?._id === id || n.uploadedBy === id;
    return false;
  });

  // Enroll in Course Mutation
  const enrollMutation = useMutation({
    mutationFn: enrollmentsApi.createEnrollment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      notify.success('Student enrolled in course successfully');
      setIsEnrollOpen(false);
      setEnrollCourseId('');
      setEnrollBatchId('');
    },
    onError: (err) => {
      notify.error(err.message || 'Failed to enroll student');
    },
  });

  // Update Status Mutation (Cancel or Re-activate)
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }) => enrollmentsApi.updateEnrollment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      notify.success('Enrollment status updated');
    },
    onError: (err) => {
      notify.error(err.message || 'Failed to update enrollment status');
    },
  });

  // Delete Enrollment Mutation (Remove from course)
  const deleteEnrollmentMutation = useMutation({
    mutationFn: enrollmentsApi.deleteEnrollment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      notify.success('Student removed from course');
      setDeletingEnrollment(null);
    },
    onError: (err) => {
      notify.error(err.message || 'Failed to remove enrollment');
    },
  });

  // Update User Mutation (Admin editing user)
  const updateUserMutation = useMutation({
    mutationFn: (data) => usersApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('User profile updated successfully');
      setIsEditingUser(false);
      setEditNewPassword('');
      setEditConfirmPassword('');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update user');
    },
  });

  const handleStartEdit = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditRole(user?.role || 'student');
    setEditNewPassword('');
    setEditConfirmPassword('');
    setIsEditingUser(true);
  };

  const handleCancelEdit = () => {
    setIsEditingUser(false);
    setEditNewPassword('');
    setEditConfirmPassword('');
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPG, PNG, WebP)');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      toast.loading('Uploading profile picture...', { id: 'admin-avatar-upload' });
      const result = await uploadFileToCloudinary(file);
      await usersApi.updateUser(id, { avatar: result.fileUrl });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Profile picture updated successfully', { id: 'admin-avatar-upload' });
    } catch (err) {
      toast.error(err.message || 'Failed to upload profile picture', { id: 'admin-avatar-upload' });
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    if (!editEmail.trim()) {
      toast.error('Valid email address required');
      return;
    }
    if (editNewPassword) {
      if (editNewPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      if (editNewPassword !== editConfirmPassword) {
        toast.error("Passwords don't match");
        return;
      }
    }

    const payload = {
      name: editName.trim(),
      email: editEmail.trim().toLowerCase(),
      role: editRole,
    };
    if (editNewPassword) {
      payload.password = editNewPassword;
    }

    updateUserMutation.mutate(payload);
  };

  const selectedEnrollCourse = allCourses.find((c) => c._id === enrollCourseId);
  const availableEnrollBatches = selectedEnrollCourse?.batches || [];

  // Attendance stats for students
  const totalAtt = userAttendance.length;
  const presentCount = userAttendance.filter((a) => a.status === 'present').length;
  const absentCount = userAttendance.filter((a) => a.status === 'absent').length;
  const attendanceRate = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 0;

  const getRoleBadgeVariant = (r) => {
    switch (r) {
      case 'admin': return 'destructive';
      case 'teacher': return 'warning';
      case 'student': return 'success';
      default: return 'secondary';
    }
  };

  if (userLoading) {
    return <LoadingSpinner size="lg" text="Loading user profile..." />;
  }

  if (isError || !user) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="p-6 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20 text-center">
          {error?.message || 'User not found or access denied.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden Avatar Input */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
        disabled={isUploadingAvatar}
      />

      {/* Back Button & Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">User Profile</h1>
            <p className="text-xs text-muted-foreground">Detailed view of user account and role-specific information.</p>
          </div>
        </div>

        {!isEditingUser && (
          <Button variant="outline" size="sm" onClick={handleStartEdit} className="text-xs">
            <Edit2 className="h-3.5 w-3.5 mr-1.5 text-primary" /> Edit User
          </Button>
        )}
      </div>

      {/* Profile Card */}
      <Card className="overflow-hidden shadow-lg border">
        <div className="h-24 bg-gradient-to-r from-primary/70 to-primary/30" />
        <CardContent className="relative px-6 pb-6 pt-0">
          {/* Avatar and Primary Header */}
          <div className="relative -top-10 flex flex-col sm:flex-row items-center sm:items-end gap-4 border-b pb-6">
            <div className="relative group">
              <div className="h-20 w-20 rounded-full bg-card border-4 border-card flex items-center justify-center font-bold text-2xl text-primary shadow-xl ring-2 ring-primary/20 overflow-hidden relative">
                {isUploadingAvatar ? (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  getInitials(user.name)
                )}
              </div>

              {/* Camera Button in Edit Mode */}
              {isEditingUser ? (
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
                  title="Upload profile picture"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
                  title="Edit user"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="text-center sm:text-left flex-1 sm:ml-2">
              <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
              <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                <Mail className="h-3 w-3" /> {user.email}
              </p>
            </div>

            <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize text-xs font-semibold px-3 py-1">
              <Shield className="h-3 w-3 mr-1" /> {ROLE_LABELS[user.role] || user.role}
            </Badge>
          </div>

          {/* VIEW MODE */}
          {!isEditingUser ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3 rounded-lg border bg-muted/20">
                <span className="text-muted-foreground text-[11px] flex items-center mb-1">
                  <UserIcon className="h-3 w-3 mr-1 text-primary" /> Full Name
                </span>
                <p className="font-semibold text-sm text-foreground">{user.name}</p>
              </div>
              <div className="p-3 rounded-lg border bg-muted/20">
                <span className="text-muted-foreground text-[11px] flex items-center mb-1">
                  <Mail className="h-3 w-3 mr-1 text-primary" /> Email Address
                </span>
                <p className="font-semibold text-sm text-foreground">{user.email}</p>
              </div>
              <div className="p-3 rounded-lg border bg-muted/20">
                <span className="text-muted-foreground text-[11px] flex items-center mb-1">
                  <Calendar className="h-3 w-3 mr-1 text-primary" /> Account Created
                </span>
                <p className="font-semibold text-sm text-foreground">{formatDate(user.createdAt)}</p>
              </div>
            </div>
          ) : (
            /* EDIT MODE */
            <form onSubmit={handleSaveUser} className="space-y-4 pt-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-medium flex items-center gap-1">
                    <UserIcon className="h-3.5 w-3.5 text-muted-foreground" /> Full Name
                  </label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Full name"
                    disabled={updateUserMutation.isPending}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email Address
                  </label>
                  <Input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="email@example.com"
                    disabled={updateUserMutation.isPending}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" /> System Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    disabled={updateUserMutation.isPending}
                    className="w-full h-10 rounded-md border bg-background px-3 text-xs sm:text-sm"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher / Instructor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              {/* Password Reset Section */}
              <div className="p-4 rounded-lg border bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-primary" /> Reset User Password (Optional)
                  </span>
                  <span className="text-[11px] text-muted-foreground">Leave blank to keep current password</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium flex items-center gap-1">
                      <Lock className="h-3 w-3 text-muted-foreground" /> New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={editNewPassword}
                        onChange={(e) => setEditNewPassword(e.target.value)}
                        disabled={updateUserMutation.isPending}
                        className="pr-10 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium flex items-center gap-1">
                      <Lock className="h-3 w-3 text-muted-foreground" /> Confirm Password
                    </label>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={editConfirmPassword}
                      onChange={(e) => setEditConfirmPassword(e.target.value)}
                      disabled={updateUserMutation.isPending}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={updateUserMutation.isPending}
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Cancel
                </Button>
                <Button type="submit" size="sm" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Save User Changes
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════ */}
      {/* TEACHER-SPECIFIC SECTIONS                      */}
      {/* ═══════════════════════════════════════════════ */}
      {role === 'teacher' && (
        <>
          {/* Teacher: Assigned Courses */}
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-primary" /> Assigned Courses ({teacherCourses.length})
                </CardTitle>
                <CardDescription className="text-xs">Courses and training programs assigned to this instructor.</CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsAssignCourseOpen(true)} className="h-8 text-xs font-semibold">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Assign Course
              </Button>
            </CardHeader>
            <CardContent>
              {teacherCourses.length === 0 ? (
                <div className="p-6 text-center rounded-xl border border-dashed text-muted-foreground text-xs bg-muted/20">
                  No courses currently assigned to this instructor.
                </div>
              ) : (
                <div className="space-y-3">
                  {teacherCourses.map((c) => (
                    <div
                      key={c._id}
                      className="p-3.5 rounded-lg border bg-card hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[10px] font-bold text-primary">{c.code}</Badge>
                          <span className="font-bold text-sm text-foreground">{c.name}</span>
                          <Badge variant={c.status === 'active' ? 'success' : 'secondary'} className="capitalize text-[10px]">
                            {c.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Duration: {c.duration} · Fee: Rs. {c.fee} · Batches: <strong className="text-foreground">{c.batches?.length || 0}</strong>
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 self-end sm:self-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setUnassigningCourse(c);
                            setReassignTeacherId(allOtherTeachers[0]?._id || '');
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Unassign Course
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Teacher: Uploaded Notes */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center">
                <FileText className="h-4 w-4 mr-2 text-primary" /> Uploaded Study Notes ({userNotes.length})
              </CardTitle>
              <CardDescription className="text-xs">Study materials published by this teacher.</CardDescription>
            </CardHeader>
            <CardContent>
              {userNotes.length === 0 ? (
                <p className="text-xs text-muted-foreground">No study notes uploaded yet.</p>
              ) : (
                <div className="space-y-2">
                  {userNotes.map((n) => (
                    <div key={n._id} className="p-3 rounded-lg border bg-card flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{n.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {n.courseId?.name || 'Course'} · {formatDate(n.createdAt)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[11px] h-7"
                        disabled={downloadingNoteId === n._id}
                        onClick={() => handleDownloadNote(n)}
                      >
                        {downloadingNoteId === n._id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Download className="h-3 w-3 mr-1 text-primary" />
                        )}
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Teacher: Attendance Sessions Marked */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-primary" /> Attendance Sessions Recorded ({userAttendance.length})
              </CardTitle>
              <CardDescription className="text-xs">Total attendance entries marked by this instructor.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold">{userAttendance.length} attendance records marked across all assigned batches.</p>
            </CardContent>
          </Card>
        </>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* STUDENT-SPECIFIC SECTIONS                      */}
      {/* ═══════════════════════════════════════════════ */}
      {role === 'student' && (
        <>
          {/* Student: Attendance Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{attendanceRate}%</div>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">Attendance Rate</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" /> {presentCount}
              </div>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">Present Sessions</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold flex items-center justify-center gap-1 text-destructive">
                <XCircle className="h-5 w-5 text-destructive" /> {absentCount}
              </div>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">Absent Sessions</p>
            </Card>
          </div>

          {/* 🌟 Student: Enrolled Courses (With Add, Cancel, and Remove Actions) 🌟 */}
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center">
                  <UserCheck className="h-4 w-4 mr-2 text-primary" /> Enrolled Courses ({studentEnrollments.length})
                </CardTitle>
                <CardDescription className="text-xs">Manage courses and batch assignments for this student.</CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsEnrollOpen(true)} className="h-8 text-xs font-semibold">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Enroll in Course
              </Button>
            </CardHeader>
            <CardContent>
              {studentEnrollments.length === 0 ? (
                <div className="p-6 text-center rounded-xl border border-dashed text-muted-foreground text-xs bg-muted/20">
                  This student is not currently enrolled in any course programs.
                </div>
              ) : (
                <div className="space-y-3">
                  {studentEnrollments.map((e) => {
                    const course = allCourses.find((c) => c._id === (e.courseId?._id || e.courseId));
                    const batch =
                      e.batch?.name ||
                      course?.batches?.find((b) => String(b._id) === String(e.batchId || e.batch?._id || e.batch))?.name ||
                      'Morning Batch A';

                    const isActive = e.status === 'active';
                    const isCancelled = e.status === 'cancelled';

                    return (
                      <div
                        key={e._id}
                        className="p-3.5 rounded-lg border bg-card hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-[10px] font-bold text-primary">
                              {course?.code || 'N/A'}
                            </Badge>
                            <span className="font-bold text-sm text-foreground">
                              {e.courseId?.name || course?.name || 'Course Program'}
                            </span>
                            <Badge
                              variant={isActive ? 'success' : isCancelled ? 'destructive' : 'secondary'}
                              className="capitalize text-[10px]"
                            >
                              {e.status}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Batch: <strong className="text-foreground">{batch}</strong> · Enrolled:{' '}
                            {formatDate(e.enrollmentDate)}
                          </p>
                          {course?.teacher && (
                            <p className="text-[11px] text-muted-foreground">
                              Instructor: {course.teacher.name || 'Assigned Instructor'}
                            </p>
                          )}
                        </div>

                        {/* Action Buttons: Cancel/Reactivate & Remove */}
                        <div className="flex items-center space-x-2 self-end sm:self-center">
                          {isActive ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 border-amber-300"
                              disabled={updateStatusMutation.isPending}
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: e._id,
                                  data: { status: 'cancelled' },
                                })
                              }
                            >
                              <Ban className="h-3.5 w-3.5 mr-1" /> Cancel Enrollment
                            </Button>
                          ) : isCancelled ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-300"
                              disabled={updateStatusMutation.isPending}
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: e._id,
                                  data: { status: 'active' },
                                })
                              }
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Re-activate
                            </Button>
                          ) : null}

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-destructive hover:bg-destructive/10"
                            onClick={() => setDeletingEnrollment(e)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Student: Recent Attendance Logs */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-primary" /> Recent Attendance ({userAttendance.length} total records)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userAttendance.length === 0 ? (
                <p className="text-xs text-muted-foreground">No attendance records available yet.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {userAttendance.slice(0, 20).map((a) => (
                    <div key={a._id} className="p-2.5 rounded-lg border bg-card flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold">{a.courseId?.name || 'Course'}</p>
                        <p className="text-[11px] text-muted-foreground">{formatDate(a.date)}</p>
                      </div>
                      <Badge
                        variant={a.status === 'present' ? 'success' : 'destructive'}
                        className="capitalize text-[10px]"
                      >
                        {a.status === 'present' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {a.status === 'absent' && <XCircle className="h-3 w-3 mr-1" />}
                        {a.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ADMIN ROLE - Simple Info */}
      {role === 'admin' && (
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center">
              <Shield className="h-4 w-4 mr-2 text-primary" /> Administrator Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This user has full administrative privileges including user management, course configuration, enrollment control, attendance oversight, and notice broadcasting.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* 🌟 ENROLL STUDENT MODAL                         */}
      {/* ═══════════════════════════════════════════════ */}
      {isEnrollOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl border p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold flex items-center">
                <UserCheck className="h-4 w-4 mr-2 text-primary" /> Enroll {user.name} into Course
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setIsEnrollOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!enrollCourseId || !enrollBatchId) {
                  notify.error('Please select both a course and a batch schedule');
                  return;
                }
                enrollMutation.mutate({
                  studentId: id,
                  courseId: enrollCourseId,
                  batchId: enrollBatchId,
                  status: 'active',
                });
              }}
              className="space-y-4 text-xs sm:text-sm"
            >
              <div className="space-y-1.5">
                <label className="font-medium">Select Course Program</label>
                <select
                  value={enrollCourseId}
                  onChange={(e) => {
                    setEnrollCourseId(e.target.value);
                    const c = allCourses.find((x) => x._id === e.target.value);
                    setEnrollBatchId(c?.batches?.[0]?._id || '');
                  }}
                  className="w-full h-10 rounded-md border bg-background px-3"
                  required
                >
                  <option value="">Choose Course...</option>
                  {allCourses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium">Select Batch Schedule</label>
                <select
                  value={enrollBatchId}
                  onChange={(e) => setEnrollBatchId(e.target.value)}
                  className="w-full h-10 rounded-md border bg-background px-3"
                  required
                >
                  <option value="">Choose Batch...</option>
                  {availableEnrollBatches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.startTime} - {b.endTime})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEnrollOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={enrollMutation.isPending}>
                  {enrollMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  Confirm Enrollment
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* 🌟 REMOVE ENROLLMENT CONFIRMATION MODAL         */}
      {/* ═══════════════════════════════════════════════ */}
      {deletingEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-sm shadow-2xl border p-6 space-y-4 text-center">
            <Trash2 className="h-10 w-10 text-destructive mx-auto" />
            <div>
              <h3 className="text-base font-bold">Remove Course Enrollment?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Are you sure you want to remove <span className="font-semibold text-foreground">{user.name}</span> from this course? This enrollment record will be deleted.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeletingEnrollment(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteEnrollmentMutation.isPending}
                onClick={() => deleteEnrollmentMutation.mutate(deletingEnrollment._id)}
              >
                {deleteEnrollmentMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Confirm Remove
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* 🌟 ASSIGN COURSE TO TEACHER MODAL               */}
      {/* ═══════════════════════════════════════════════ */}
      {isAssignCourseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl border p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-primary" /> Assign Course to {user.name}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setIsAssignCourseOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedCourseToAssign) {
                  notify.error('Please select a course to assign');
                  return;
                }
                assignCourseToTeacherMutation.mutate(selectedCourseToAssign);
              }}
              className="space-y-4 text-xs sm:text-sm"
            >
              <div className="space-y-1.5">
                <label className="font-medium">Select Course Program</label>
                <select
                  value={selectedCourseToAssign}
                  onChange={(e) => setSelectedCourseToAssign(e.target.value)}
                  className="w-full h-10 rounded-md border bg-background px-3"
                  required
                >
                  <option value="">Choose Course...</option>
                  {assignableCourses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.code}) — {c.teacher ? `Current: ${c.teacher.name}` : 'Unassigned'}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Assigning this course will make {user.name} the primary instructor.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAssignCourseOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={assignCourseToTeacherMutation.isPending}>
                  {assignCourseToTeacherMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  Confirm Assignment
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* 🌟 UNASSIGN COURSE FROM TEACHER MODAL           */}
      {/* ═══════════════════════════════════════════════ */}
      {unassigningCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl border p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-destructive flex items-center">
                <Trash2 className="h-4 w-4 mr-2" /> Unassign Course
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setUnassigningCourse(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!reassignTeacherId) {
                  notify.error('Please select a replacement instructor or another teacher');
                  return;
                }
                unassignCourseFromTeacherMutation.mutate({
                  courseId: unassigningCourse._id,
                  replacementTeacherId: reassignTeacherId,
                });
              }}
              className="space-y-4 text-xs sm:text-sm"
            >
              <p className="text-xs text-foreground">
                You are unassigning <strong>{unassigningCourse.name}</strong> ({unassigningCourse.code}) from <strong>{user.name}</strong>.
              </p>

              <div className="space-y-1.5">
                <label className="font-medium">Reassign Course To Instructor</label>
                <select
                  value={reassignTeacherId}
                  onChange={(e) => setReassignTeacherId(e.target.value)}
                  className="w-full h-10 rounded-md border bg-background px-3"
                  required
                >
                  <option value="">Select Replacement Instructor...</option>
                  {allOtherTeachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Select an active teacher who will take over teaching this course program.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setUnassigningCourse(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={unassignCourseFromTeacherMutation.isPending}
                >
                  {unassignCourseFromTeacherMutation.isPending && (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  )}
                  Confirm & Reassign
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

export default UserDetail;
