import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { coursesApi } from '@/api/courses';
import { mailApi } from '@/api/mail';
import { formatCurrency, formatDate } from '@/utils/format';
import { toast } from 'sonner';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import UserAvatar from '@/components/common/UserAvatar';

import {
  BookOpen,
  Layers,
  Users,
  Calendar,
  Clock,
  X,
  Mail,
  Send,
  Loader2,
  DollarSign,
  Phone,
} from 'lucide-react';

export function MyCourses() {
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  
  const { data: courses, isLoading, isError, error } = useQuery({
    queryKey: ['courses', 'teacher'],
    queryFn: coursesApi.getMyCourses,
  });

  
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['batchStudents', selectedBatch?.courseId, selectedBatch?.batchId],
    queryFn: () => coursesApi.getBatchStudents(selectedBatch.courseId, selectedBatch.batchId),
    enabled: Boolean(selectedBatch?.courseId && selectedBatch?.batchId),
  });

  
  const emailMutation = useMutation({
    mutationFn: (payload) => mailApi.sendNotice(payload),
    onSuccess: () => {
      toast.success('Email sent successfully');
      setEmailSubject('');
      setEmailMessage('');
      setIsEmailModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to send email to class');
    },
  });

  const handleSendEmail = (e) => {
    e.preventDefault();
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast.error('Subject and message are required');
      return;
    }

    emailMutation.mutate({
      courseId: selectedBatch.courseId,
      batchId: selectedBatch.batchId,
      subject: emailSubject.trim(),
      message: emailMessage.trim(),
    });
  };

  const courseList = Array.isArray(courses) ? courses : [];
  const studentsList = Array.isArray(studentsData) ? studentsData : [];

  return (
    <div className="space-y-6">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Assigned Courses</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            View training programs assigned to you, active batches, and enrolled student rosters.
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading assigned courses..." />
      ) : isError ? (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error.message || 'Failed to load assigned courses'}
        </div>
      ) : courseList.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Courses Assigned"
          description="You are currently not assigned to any active course programs."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courseList.map((c) => (
            <Card key={c._id} className="flex flex-col justify-between border hover:border-primary/40 transition-all">
              <CardHeader className="pb-3 space-y-2">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="font-mono text-xs font-bold border-primary/30 text-primary">
                    {c.code}
                  </Badge>
                  <Badge variant={c.status === 'active' ? 'default' : 'secondary'} className="capitalize text-[11px]">
                    {c.status}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{c.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">{c.description || 'No description provided.'}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 text-xs text-muted-foreground pb-4">
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="flex items-center"><Clock className="h-3.5 w-3.5 mr-1 text-primary" /> Duration</span>
                  <span className="font-medium text-foreground">{c.duration}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center"><DollarSign className="h-3.5 w-3.5 mr-1 text-primary" /> Course Fee</span>
                  <span className="font-semibold text-foreground">{formatCurrency(c.fee)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center"><Layers className="h-3.5 w-3.5 mr-1 text-primary" /> Active Batches</span>
                  <Badge variant="outline" className="text-[11px]">{c.batches?.length || 0} Batches</Badge>
                </div>
              </CardContent>

              <div className="p-4 pt-0 space-y-2 border-t mt-auto pt-3">
                <h4 className="font-bold text-xs text-foreground">Select Batch Schedule:</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {(!c.batches || c.batches.length === 0) ? (
                    <p className="text-xs text-muted-foreground italic py-1">No batches configured.</p>
                  ) : (
                    c.batches.map((b) => (
                      <Button
                        key={b._id}
                        variant="outline"
                        size="sm"
                        className="w-full justify-between text-xs h-auto py-2"
                        onClick={() => setSelectedBatch({
                          courseId: c._id,
                          courseName: c.name,
                          courseCode: c.code,
                          batchId: b._id,
                          batchName: b.name,
                          startDate: b.startDate,
                          endDate: b.endDate,
                          startTime: b.startTime,
                          endTime: b.endTime,
                        })}
                      >
                        <div className="text-left min-w-0 flex-1">
                          <p className="font-semibold truncate">{b.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatDate(b.startDate)} - {formatDate(b.endDate)}
                          </p>
                        </div>
                        <span className="text-[10px] text-primary font-medium ml-2 shrink-0">
                          {b.startTime} - {b.endTime}
                        </span>
                      </Button>
                    ))
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* STUDENT ROSTER MODAL */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-2xl shadow-2xl border p-6 space-y-4 my-8">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold">{selectedBatch.courseName}</h3>
                  <Badge variant="outline" className="text-xs font-mono">{selectedBatch.courseCode}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Batch: <span className="font-semibold text-primary">{selectedBatch.batchName}</span>
                  {selectedBatch.startTime && selectedBatch.endTime && (
                    <span className="ml-2 font-medium text-foreground">
                      ({selectedBatch.startTime} - {selectedBatch.endTime})
                    </span>
                  )}
                </p>
                {selectedBatch.startDate && selectedBatch.endDate && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center">
                    <Calendar className="h-3 w-3 mr-1 inline" />
                    {formatDate(selectedBatch.startDate)} to {formatDate(selectedBatch.endDate)}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setSelectedBatch(null); setIsEmailModalOpen(false); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* ACTION BAR: Send Email to Class */}
            <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg border">
              <div className="text-xs">
                <span className="font-semibold text-foreground">Enrolled Students: </span>
                <span className="text-muted-foreground">{studentsList.length} total</span>
              </div>
              <Button
                size="sm"
                variant={isEmailModalOpen ? 'secondary' : 'default'}
                onClick={() => setIsEmailModalOpen(!isEmailModalOpen)}
                className="text-xs font-medium"
              >
                <Mail className="h-3.5 w-3.5 mr-1.5" />
                {isEmailModalOpen ? 'View Student List' : 'Send Email to Class'}
              </Button>
            </div>

            {/* EMAIL COMPOSER FORM (Inside Batch Context) */}
            {isEmailModalOpen ? (
              <form onSubmit={handleSendEmail} className="space-y-3 bg-card p-4 rounded-lg border">
                <div className="flex items-center justify-between pb-2 border-b">
                  <h4 className="font-bold text-sm flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-primary" /> Compose Email to {selectedBatch.batchName} Students
                  </h4>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Subject</label>
                  <Input
                    placeholder="e.g. Schedule update for upcoming lab session"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Message Body</label>
                  <textarea
                    rows={4}
                    placeholder="Write your announcement or notice to the class..."
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    className="w-full rounded-md border border-input bg-background p-2.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEmailModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={emailMutation.isPending}
                    className="font-semibold"
                  >
                    {emailMutation.isPending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5 mr-1.5" /> Send Email
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              /* STUDENT ROSTER LIST */
              <div>
                {studentsLoading ? (
                  <LoadingSpinner text="Fetching student roster from database..." />
                ) : studentsList.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No Enrolled Students"
                    description="No students are currently enrolled in this batch."
                  />
                ) : (
                  <div className="max-h-72 overflow-y-auto border rounded-lg divide-y">
                    {studentsList.map((s, idx) => {
                      const student = s.studentId || s;
                      return (
                        <div key={s._id || student._id || idx} className="p-3 flex items-center justify-between text-xs hover:bg-muted/20 transition-colors">
                          <div className="flex items-center space-x-2.5">
                            <UserAvatar user={student} size="sm" />
                            <div className="space-y-0.5">
                              <p className="font-semibold text-foreground">{student.name || 'Student'}</p>
                              <p className="text-muted-foreground flex items-center">
                                <Mail className="h-3 w-3 mr-1 inline" /> {student.email}
                              </p>
                              {student.phone && (
                                <p className="text-[11px] text-muted-foreground flex items-center">
                                  <Phone className="h-2.5 w-2.5 mr-1 inline" /> {student.phone}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-200">
                              Active
                            </Badge>
                            {s.enrollmentDate && (
                              <p className="text-[10px] text-muted-foreground">
                                Enrolled {formatDate(s.enrollmentDate)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

export default MyCourses;

