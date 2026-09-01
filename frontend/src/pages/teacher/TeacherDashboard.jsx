import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '@/api/courses';
import { notesApi } from '@/api/notes';
import { attendanceApi } from '@/api/attendance';
import { ROUTES } from '@/constants/routes';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, FileText, Mail, ArrowRight, Layers, Users } from 'lucide-react';

export function TeacherDashboard() {
  const navigate = useNavigate();

  // Real backend queries
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses', 'teacher'],
    queryFn: coursesApi.getMyCourses,
  });

  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ['notes', 'teacher'],
    queryFn: notesApi.getTeacherNotes,
  });

  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance', 'teacher'],
    queryFn: attendanceApi.getTeacherAttendance,
  });

  const coursesList = Array.isArray(courses) ? courses : [];
  const notesList = Array.isArray(notes) ? notes : [];
  const attendanceList = Array.isArray(attendance) ? attendance : [];

  const coursesCount = coursesList.length;
  const totalBatches = coursesList.reduce((acc, curr) => acc + (curr.batches?.length || 0), 0);
  const notesCount = notesList.length;
  const attendanceCount = attendanceList.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teacher Workspace</h1>
          <p className="text-sm text-muted-foreground">Assigned courses, batch attendance, study notes, and student rosters.</p>
        </div>
        <Badge variant="outline" className="w-fit text-xs font-semibold px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200">
          Instructor Portal
        </Badge>
      </div>

      {/* Interactive Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* CLICKABLE ASSIGNED COURSES CARD */}
        <Card
          onClick={() => navigate(ROUTES.TEACHER.COURSES)}
          className="cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all group"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">My Assigned Courses</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
              <BookOpen className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coursesLoading ? '--' : coursesCount}</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">{totalBatches} active {totalBatches === 1 ? 'batch' : 'batches'}</p>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </CardContent>
        </Card>

        {/* CLICKABLE NOTES CARD */}
        <Card
          onClick={() => navigate(ROUTES.TEACHER.NOTES)}
          className="cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all group"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">Uploaded Notes</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <FileText className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notesLoading ? '--' : notesCount}</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">Study resources published</p>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </CardContent>
        </Card>

        {/* CLICKABLE ATTENDANCE CARD */}
        <Card
          onClick={() => navigate(ROUTES.TEACHER.ATTENDANCE)}
          className="cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all group"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">Attendance Records</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceLoading ? '--' : attendanceCount}</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">Student logs recorded</p>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <Card className="border p-6 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Mark Batch Attendance</h3>
              <p className="text-xs text-muted-foreground">Record daily attendance status, view session summaries, and edit student records.</p>
            </div>
          </div>
          <Button size="sm" onClick={() => navigate(ROUTES.TEACHER.ATTENDANCE)} className="w-full mt-2">
            Record Attendance <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Card>

        <Card className="border p-6 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Study Materials & Notes</h3>
              <p className="text-xs text-muted-foreground">Upload and distribute course notes, PDF documents, and lecture references.</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate(ROUTES.TEACHER.NOTES)} className="w-full mt-2">
            Manage Study Notes <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Card>

        <Card className="border p-6 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-bold">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Send Class Notice</h3>
              <p className="text-xs text-muted-foreground">Broadcast emails to an entire batch or active course enrollments with one click.</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate(ROUTES.TEACHER.EMAIL)} className="w-full mt-2">
            Compose Notice <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Card>
      </div>
    </div>
  );
}

export default TeacherDashboard;

