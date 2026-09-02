import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mailApi } from '@/api/mail';
import { coursesApi } from '@/api/courses';
import { sendNoticeSchema } from '@/schemas/mail';
import { toast } from 'sonner';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Mail, Send, Loader2, BookOpen, Layers } from 'lucide-react';

export function TeacherSendNotice() {
  
  const { data: courses } = useQuery({
    queryKey: ['courses', 'teacher'],
    queryFn: coursesApi.getMyCourses,
  });

  const courseList = Array.isArray(courses) ? courses : [];

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(sendNoticeSchema),
    defaultValues: {
      recipientType: 'batch',
      courseId: '',
      batchId: '',
      subject: '',
      message: '',
    },
  });

  const selectedCourseId = watch('courseId');
  const selectedCourse = courseList.find((c) => c._id === selectedCourseId);
  const availableBatches = selectedCourse?.batches || [];

  
  const sendMutation = useMutation({
    mutationFn: (data) => {
      if (!data.courseId || !data.batchId) {
        throw new Error('Please select both a course and a target batch schedule');
      }
      return mailApi.sendNotice({
        courseId: data.courseId,
        batchId: data.batchId,
        subject: data.subject.trim(),
        message: data.message.trim(),
      });
    },
    onSuccess: () => {
      toast.success('Email sent successfully');
      reset({
        recipientType: 'batch',
        courseId: '',
        batchId: '',
        subject: '',
        message: '',
      });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to send notice email');
    },
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Send Batch Notice</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Send course announcements, assignment reminders, or class updates to your batch students via email.
        </p>
      </div>

      <Card className="shadow-lg border">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg font-bold flex items-center">
            <Mail className="h-5 w-5 mr-2 text-primary" /> Notice Composer
          </CardTitle>
          <CardDescription className="text-xs">
            Messages are sent directly to the email addresses of all students enrolled in the target batch.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit((d) => sendMutation.mutate(d))}>
          <CardContent className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-medium flex items-center">
                  <BookOpen className="h-3.5 w-3.5 mr-1 text-primary" /> My Course
                </label>
                <select {...register('courseId')} className="w-full h-10 rounded-md border bg-background px-3">
                  <option value="">Select Course</option>
                  {courseList.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium flex items-center">
                  <Layers className="h-3.5 w-3.5 mr-1 text-primary" /> Target Batch
                </label>
                <select {...register('batchId')} className="w-full h-10 rounded-md border bg-background px-3">
                  <option value="">Select Batch</option>
                  {availableBatches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.startTime} - {b.endTime})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium">Subject</label>
              <Input placeholder="Reminder: Project Submission Deadline" {...register('subject')} />
              {errors.subject && <p className="text-[11px] text-destructive">{errors.subject.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="font-medium">Message Body</label>
              <textarea
                {...register('message')}
                rows={6}
                placeholder="Write your announcement details..."
                className="w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {errors.message && <p className="text-[11px] text-destructive">{errors.message.message}</p>}
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-end space-x-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => reset()}>
              Reset
            </Button>
            <Button type="submit" disabled={sendMutation.isPending} className="font-semibold shadow-md">
              {sendMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Broadcasting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" /> Send Batch Email
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default TeacherSendNotice;
