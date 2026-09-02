import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { mailApi } from '@/api/mail';
import { coursesApi } from '@/api/courses';
import { enrollmentsApi } from '@/api/enrollments';
import { usersApi } from '@/api/users';
import { useNotification } from '@/hooks/useNotification';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { Mail, Send, Loader2, BookOpen, Layers, User, Users as UsersIcon, CheckCircle2 } from 'lucide-react';

export function SendNotice() {
  const notify = useNotification();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialStudentId = searchParams.get('studentId') || '';

  
  const [recipientMode, setRecipientMode] = useState(initialStudentId ? 'individual' : 'course');
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  
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
  const enrollments = (Array.isArray(enrollmentsData) ? enrollmentsData : []).filter((e) => {
    const cid = String(e.courseId?._id || e.courseId || '');
    return cid && (existingCourseIds.size === 0 || existingCourseIds.has(cid)) && e.studentId;
  });

  
  const enrolledStudentsMap = new Map();
  enrollments.forEach((e) => {
    if (e.studentId?._id && !enrolledStudentsMap.has(e.studentId._id)) {
      enrolledStudentsMap.set(e.studentId._id, {
        ...e.studentId,
        courseName: e.courseId?.name || 'Course',
        batchName: e.batch?.name || 'Batch',
      });
    }
  });
  const enrolledStudents = Array.from(enrolledStudentsMap.values());

  const selectedCourse = courses.find((c) => c._id === selectedCourseId);
  const availableBatches = selectedCourse?.batches || [];

  
  const courseEnrolledStudents = enrollments.filter(
    (e) => (e.courseId?._id || e.courseId) === selectedCourseId && (!selectedBatchId || String(e.batchId || e.batch?._id || e.batch) === String(selectedBatchId))
  );

  
  const sendMutation = useMutation({
    mutationFn: mailApi.sendNotice,
    onSuccess: () => {
      notify.success('Notice email sent successfully');
      setSubject('');
      setMessage('');
      if (!initialStudentId) setSelectedStudentId('');
    },
    onError: (err) => {
      notify.error(err.message || 'Failed to send notice email');
    },
  });

  const handleSendNotice = (e) => {
    e.preventDefault();

    if (!subject.trim()) {
      notify.error('Please enter a notice subject');
      return;
    }
    if (!message.trim()) {
      notify.error('Please enter an announcement message');
      return;
    }

    let payload = { subject, message };

    if (recipientMode === 'individual') {
      if (!selectedStudentId) {
        notify.error('Please select an individual student recipient');
        return;
      }
      payload.studentIds = [selectedStudentId];
    } else if (recipientMode === 'course') {
      if (!selectedCourseId) {
        notify.error('Please select a course');
        return;
      }
      if (selectedBatchId) {
        payload.courseId = selectedCourseId;
        payload.batchId = selectedBatchId;
      } else {
        const studentIds = courseEnrolledStudents
          .map((enr) => enr.studentId?._id || enr.studentId)
          .filter(Boolean);
        if (studentIds.length === 0) {
          notify.error('No students are enrolled in this course');
          return;
        }
        payload.studentIds = Array.from(new Set(studentIds));
      }
    } else if (recipientMode === 'all') {
      const allStudentIds = enrollments
        .map((enr) => enr.studentId?._id || enr.studentId)
        .filter(Boolean);
      if (allStudentIds.length === 0) {
        notify.error('No active student enrollments found');
        return;
      }
      payload.studentIds = Array.from(new Set(allStudentIds));
    }

    sendMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Send Institute Email Notice</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Broadcast official announcements, exam updates, or notices to individual students, specific courses, or all enrolled students.
        </p>
      </div>

      <Card className="shadow-lg border">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg font-bold flex items-center">
            <Mail className="h-5 w-5 mr-2 text-primary" /> Notice Composer
          </CardTitle>
          <CardDescription className="text-xs">
            Choose your target audience mode and compose your announcement.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSendNotice}>
          <CardContent className="space-y-5 text-xs sm:text-sm">
            {/* 🌟 3-WAY RECIPIENT MODE SELECTOR 🌟 */}
            <div className="space-y-2">
              <label className="font-semibold block text-xs uppercase tracking-wider text-muted-foreground">
                Select Recipient Target
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {}
                <button
                  type="button"
                  onClick={() => setRecipientMode('individual')}
                  className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all ${
                    recipientMode === 'individual'
                      ? 'border-primary bg-primary/10 text-primary shadow-sm font-semibold'
                      : 'border-input bg-card hover:bg-accent text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <User className="h-4 w-4" />
                    {recipientMode === 'individual' && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-bold block">Individual Student</span>
                    <span className="text-[10px] text-muted-foreground">Send to 1 specific student</span>
                  </div>
                </button>

                {/* 2. Whole Course Students */}
                <button
                  type="button"
                  onClick={() => setRecipientMode('course')}
                  className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all ${
                    recipientMode === 'course'
                      ? 'border-primary bg-primary/10 text-primary shadow-sm font-semibold'
                      : 'border-input bg-card hover:bg-accent text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <BookOpen className="h-4 w-4" />
                    {recipientMode === 'course' && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-bold block">Whole Course</span>
                    <span className="text-[10px] text-muted-foreground">All students in course/batch</span>
                  </div>
                </button>

                {/* 3. All Enrolled Students */}
                <button
                  type="button"
                  onClick={() => setRecipientMode('all')}
                  className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all ${
                    recipientMode === 'all'
                      ? 'border-primary bg-primary/10 text-primary shadow-sm font-semibold'
                      : 'border-input bg-card hover:bg-accent text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <UsersIcon className="h-4 w-4" />
                    {recipientMode === 'all' && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-bold block">All Enrolled Students</span>
                    <span className="text-[10px] text-muted-foreground">Broadcast to institute</span>
                  </div>
                </button>
              </div>
            </div>

            {/* DYNAMIC RECIPIENT FIELDS BASED ON MODE */}

            {/* 1. INDIVIDUAL STUDENT SELECTOR */}
            {recipientMode === 'individual' && (
              <div className="space-y-1.5 p-3.5 rounded-lg border bg-muted/20">
                <label className="font-medium flex items-center">
                  <User className="h-3.5 w-3.5 mr-1 text-primary" /> Choose Enrolled Student
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full h-10 rounded-md border bg-background px-3 text-xs sm:text-sm"
                  required
                >
                  <option value="">Select a student...</option>
                  {enrolledStudents.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.email}) — {s.courseName}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Notice will be delivered directly to the selected student's email inbox.
                </p>
              </div>
            )}

            {}
            {recipientMode === 'course' && (
              <div className="p-3.5 rounded-lg border bg-muted/20 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium flex items-center">
                      <BookOpen className="h-3.5 w-3.5 mr-1 text-primary" /> Target Course Program
                    </label>
                    <select
                      value={selectedCourseId}
                      onChange={(e) => {
                        setSelectedCourseId(e.target.value);
                        setSelectedBatchId('');
                      }}
                      className="w-full h-10 rounded-md border bg-background px-3 text-xs sm:text-sm"
                      required
                    >
                      <option value="">Select Course...</option>
                      {courses.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium flex items-center">
                      <Layers className="h-3.5 w-3.5 mr-1 text-primary" /> Target Batch (Optional)
                    </label>
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      className="w-full h-10 rounded-md border bg-background px-3 text-xs sm:text-sm"
                    >
                      <option value="">All Batches in Course</option>
                      {availableBatches.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name} ({b.startTime} - {b.endTime})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedCourseId && (
                  <p className="text-[11px] text-muted-foreground flex items-center">
                    <UsersIcon className="h-3 w-3 mr-1 text-primary" />
                    Targeting <strong className="text-foreground mx-1">{courseEnrolledStudents.length}</strong> students enrolled in this {selectedBatchId ? 'batch' : 'course'}.
                  </p>
                )}
              </div>
            )}

            {/* 3. ALL ENROLLED STUDENTS BANNER */}
            {recipientMode === 'all' && (
              <div className="p-3.5 rounded-lg border-2 border-primary/20 bg-primary/5 space-y-1">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs font-semibold bg-primary/10 text-primary border-primary/30">
                    Institute-Wide Broadcast
                  </Badge>
                  <span className="text-xs font-bold text-foreground">
                    {enrolledStudents.length} Active Students
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  This announcement will be emailed to all active students enrolled across all courses and batches in the institute.
                </p>
              </div>
            )}

            {/* NOTICE SUBJECT */}
            <div className="space-y-1.5">
              <label className="font-medium">Notice Subject</label>
              <Input
                placeholder="Important: Upcoming Mid-Term Examination Schedule"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            {/* NOTICE MESSAGE BODY */}
            <div className="space-y-1.5">
              <label className="font-medium">Announcement Message</label>
              <textarea
                rows={6}
                placeholder="Write your announcement details, instructions, or holiday information here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-md border border-input bg-background p-3 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-end space-x-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSubject('');
                setMessage('');
              }}
            >
              Reset
            </Button>
            <Button type="submit" disabled={sendMutation.isPending} className="font-semibold shadow-md">
              {sendMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Broadcasting Notice...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" /> Send Notice
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default SendNotice;

