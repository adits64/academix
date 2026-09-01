import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { enrollmentsApi } from '@/api/enrollments';
import { formatCurrency, formatDate } from '@/utils/format';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

import {
  BookOpen,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  DollarSign,
  Layers,
  Sparkles,
} from 'lucide-react';

export function StudentCourses() {
  const { data: enrollmentsData, isLoading, isError, error } = useQuery({
    queryKey: ['enrollments', 'my'],
    queryFn: enrollmentsApi.getMyEnrollments,
  });

  const enrollments = Array.isArray(enrollmentsData) ? enrollmentsData : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Enrolled Courses</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            View your active academic enrollments, class schedules, and assigned teachers.
          </p>
        </div>
        <Badge variant="outline" className="w-fit text-xs font-semibold px-3 py-1 bg-primary/10 text-primary border-primary/20">
          <BookOpen className="h-3.5 w-3.5 mr-1" /> {enrollments.length} Active {enrollments.length === 1 ? 'Course' : 'Courses'}
        </Badge>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner text="Fetching your enrolled courses..." />
      ) : isError ? (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error.message || 'Failed to load your course enrollments'}
        </div>
      ) : enrollments.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Active Enrollments"
          description="You are not currently enrolled in any academic courses. Please contact your administrator."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {enrollments.map((enrollment) => {
            const course = enrollment.courseId || {};
            const batch = enrollment.batch || {};
            const teacher = course.teacher || {};

            return (
              <Card key={enrollment._id} className="border hover:border-primary/40 transition-all flex flex-col justify-between shadow-sm">
                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/30">
                        {course.code || 'COURSE'}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold mt-2">{course.name || 'Course Title'}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {course.description || 'Comprehensive curriculum with practical coursework and sessions.'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3.5 text-xs text-muted-foreground pb-4">
                    {/* Batch Schedule Box */}
                    <div className="p-3 rounded-lg bg-muted/40 border space-y-2">
                      <div className="flex items-center justify-between text-foreground font-semibold">
                        <span className="flex items-center">
                          <Layers className="h-3.5 w-3.5 mr-1.5 text-primary" /> Batch
                        </span>
                        <span>{batch.name || 'Assigned Batch'}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t text-[11px]">
                        <div className="flex items-center text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1 text-primary" />
                          <span>{batch.startTime && batch.endTime ? `${batch.startTime} - ${batch.endTime}` : 'Time TBA'}</span>
                        </div>
                        <div className="flex items-center text-muted-foreground justify-end">
                          <Calendar className="h-3 w-3 mr-1 text-primary" />
                          <span>{batch.startDate ? formatDate(batch.startDate) : 'Date TBA'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Teacher & Course Details */}
                    <div className="space-y-2 pt-1">
                      {teacher.name && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center"><User className="h-3.5 w-3.5 mr-1 text-primary" /> Instructor</span>
                          <span className="font-semibold text-foreground">{teacher.name}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="flex items-center"><Calendar className="h-3.5 w-3.5 mr-1 text-primary" /> Duration</span>
                        <span className="font-medium text-foreground">{course.duration ? `${course.duration} Months` : 'N/A'}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center"><DollarSign className="h-3.5 w-3.5 mr-1 text-primary" /> Program Fee</span>
                        <span className="font-semibold text-foreground">{formatCurrency(course.fee || 0)}</span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                <div className="px-6 py-3 bg-muted/20 border-t text-[11px] text-muted-foreground flex items-center justify-between mt-auto">
                  <span>Enrolled: {formatDate(enrollment.createdAt)}</span>
                  <span className="text-primary font-medium flex items-center">
                    <Sparkles className="h-3 w-3 mr-1" /> Student Roster Active
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StudentCourses;
