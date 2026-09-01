import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants/roles';
import ThemeToggle from '@/components/common/ThemeToggle';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export function PublicLayout() {
  const { role, isAuthenticated } = useAuth();

  const dashboardPath =
    role === ROLES.ADMIN
      ? ROUTES.ADMIN.DASHBOARD
      : role === ROLES.TEACHER
      ? ROUTES.TEACHER.DASHBOARD
      : ROUTES.STUDENT.DASHBOARD;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* Public Navbar */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link to={isAuthenticated ? dashboardPath : ROUTES.PUBLIC.HOME} className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-md">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">Academix</span>
          </Link>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {isAuthenticated ? (
              <Button asChild size="sm">
                <Link to={dashboardPath}>Go to Dashboard</Link>
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link to={ROUTES.PUBLIC.LOGIN}>Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground bg-card">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} Academix Institute Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;
