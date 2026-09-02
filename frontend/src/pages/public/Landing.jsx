import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  Users,
  CalendarCheck,
  FileText,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants/roles';

export function Landing() {
  const { role, isAuthenticated } = useAuth();

  const dashboardPath =
    role === ROLES.ADMIN
      ? ROUTES.ADMIN.DASHBOARD
      : role === ROLES.TEACHER
      ? ROUTES.TEACHER.DASHBOARD
      : ROUTES.STUDENT.DASHBOARD;

  return (
    <div className="flex flex-col space-y-16 py-10 md:py-16">
      {}
      <section className="container mx-auto px-4 text-center space-y-6">
        <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-semibold border-primary/30 text-primary bg-primary/5">
          <Sparkles className="h-3.5 w-3.5 mr-1 text-primary inline" /> Modern Institute & Course Management System
        </Badge>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight text-foreground">
          Empower Your Training Institute with <span className="text-primary underline decoration-primary/30">Academix</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto font-normal">
          The all-in-one class management platform for institute administrators, instructors, and students. Streamline courses, attendance, enrollments, and study materials in one unified workspace.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button asChild size="lg" className="w-full sm:w-auto text-base shadow-lg hover:shadow-primary/25 transition-all">
            <Link to={isAuthenticated ? dashboardPath : ROUTES.PUBLIC.LOGIN}>
              {isAuthenticated ? 'Go to Dashboard' : 'Access Portal'} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-base">
            <a href="#features">Explore Features</a>
          </Button>
        </div>
      </section>

      {/* Highlights Banner */}
      <section className="border-y bg-card/50 py-10">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl font-extrabold text-primary">3 Roles</p>
            <p className="text-xs text-muted-foreground mt-1">Admin, Teacher, Student</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-primary">100%</p>
            <p className="text-xs text-muted-foreground mt-1">Real-Time Attendance</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-primary">Instant</p>
            <p className="text-xs text-muted-foreground mt-1">Notice & Study Notes Access</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-primary">SaaS</p>
            <p className="text-xs text-muted-foreground mt-1">Institute Management UI</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="container mx-auto px-4 space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight">Tailored for Training Institutes</h2>
          <p className="text-sm text-muted-foreground">
            Built specifically to support course offerings, batch scheduling, student attendance, and instructor communication.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border shadow-sm hover:border-primary/40 transition-all">
            <CardHeader className="space-y-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl">Courses & Batches</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Define specialized course offerings, configure start/end dates, assign dedicated teachers, and manage active student batches seamlessly.
            </CardContent>
          </Card>

          <Card className="border shadow-sm hover:border-primary/40 transition-all">
            <CardHeader className="space-y-2">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl">Interactive Attendance</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Teachers can mark daily present/absent/late status per batch. Students track their monthly attendance directly on an interactive calendar.
            </CardContent>
          </Card>

          <Card className="border shadow-sm hover:border-primary/40 transition-all">
            <CardHeader className="space-y-2">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <FileText className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl">Digital Study Materials</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Teachers upload course materials and notes. Students access downloadable study resources organized by course and batch.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Role-based Breakdown */}
      <section className="container mx-auto px-4 bg-muted/40 py-12 rounded-2xl border space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl font-bold">Role-Aware Workspace</h2>
          <p className="text-xs text-muted-foreground">Every user gets a clean dashboard tailored to their responsibilities.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-card rounded-xl border space-y-3">
            <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-0">Administrator</Badge>
            <h3 className="font-semibold text-lg">Full Control</h3>
            <ul className="text-xs space-y-2 text-muted-foreground">
              <li className="flex items-center"><CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> User & Role Management</li>
              <li className="flex items-center"><CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Course & Batch Creation</li>
              <li className="flex items-center"><CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Student Enrollment Control</li>
              <li className="flex items-center"><CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Institute Notice Broadcasts</li>
            </ul>
          </div>

          <div className="p-6 bg-card rounded-xl border space-y-3">
            <Badge className="bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/30 border-0">Teacher</Badge>
            <h3 className="font-semibold text-lg">Teaching Tools</h3>
            <ul className="text-xs space-y-2 text-muted-foreground">
              <li className="flex items-center"><CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Batch Roster Access</li>
              <li className="flex items-center"><CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Daily Attendance Marking</li>
              <li className="flex items-center"><CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Note & Resource Uploads</li>
              <li className="flex items-center"><CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Batch Email Notices</li>
            </ul>
          </div>

          <div className="p-6 bg-card rounded-xl border space-y-3">
            <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 border-0">Student</Badge>
            <h3 className="font-semibold text-lg">Learning Hub</h3>
            <ul className="text-xs space-y-2 text-muted-foreground">
              <li className="flex items-center"><CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Enrolled Course Overview</li>
              <li className="flex items-center"><CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Monthly Attendance Calendar</li>
              <li className="flex items-center"><CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Download Study Notes</li>
              <li className="flex items-center"><CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Fee Balance Tracking</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="container mx-auto px-4 text-center py-10">
        <div className="p-8 sm:p-12 rounded-3xl bg-primary text-primary-foreground space-y-4 shadow-xl">
          <h2 className="text-3xl font-extrabold">Ready to access Academix?</h2>
          <p className="text-sm opacity-90 max-w-xl mx-auto">
            Log in with your administrator, teacher, or student credentials to access your dashboard.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-4 font-semibold">
            <Link to={isAuthenticated ? dashboardPath : ROUTES.PUBLIC.LOGIN}>
              {isAuthenticated ? 'Go to Dashboard' : 'Sign In Now'}
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

export default Landing;
