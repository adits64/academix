import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Users,
  UserCheck,
  Calendar,
  FileText,
  CreditCard,
  Mail,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROLES, ROLE_LABELS } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';
import ThemeToggle from '@/components/common/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getInitials } from '@/utils/format';

export function DashboardLayout() {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  
  const getNavItems = () => {
    switch (role) {
      case ROLES.ADMIN:
        return [
          { label: 'Dashboard', icon: LayoutDashboard, path: ROUTES.ADMIN.DASHBOARD },
          { label: 'Courses & Batches', icon: BookOpen, path: ROUTES.ADMIN.COURSES },
          { label: 'Users', icon: Users, path: ROUTES.ADMIN.USERS || ROUTES.ADMIN.STUDENTS },
          { label: 'Enrollments', icon: UserCheck, path: ROUTES.ADMIN.ENROLLMENTS },
          { label: 'Attendance', icon: Calendar, path: ROUTES.ADMIN.ATTENDANCE },
          { label: 'Study Notes', icon: FileText, path: ROUTES.ADMIN.NOTES },
          { label: 'Fee Records', icon: CreditCard, path: ROUTES.ADMIN.FEES },
          { label: 'Send Notices', icon: Mail, path: ROUTES.ADMIN.EMAIL },
        ];
      case ROLES.TEACHER:
        return [
          { label: 'Dashboard', icon: LayoutDashboard, path: ROUTES.TEACHER.DASHBOARD },
          { label: 'My Courses', icon: BookOpen, path: ROUTES.TEACHER.COURSES },
          { label: 'Mark Attendance', icon: Calendar, path: ROUTES.TEACHER.ATTENDANCE },
          { label: 'Study Notes', icon: FileText, path: ROUTES.TEACHER.NOTES },
          { label: 'Send Notices', icon: Mail, path: ROUTES.TEACHER.EMAIL },
        ];
      case ROLES.STUDENT:
        return [
          { label: 'Dashboard', icon: LayoutDashboard, path: ROUTES.STUDENT.DASHBOARD },
          { label: 'My Courses', icon: BookOpen, path: ROUTES.STUDENT.COURSES },
          { label: 'Attendance', icon: Calendar, path: ROUTES.STUDENT.ATTENDANCE },
          { label: 'Study Notes', icon: FileText, path: ROUTES.STUDENT.NOTES },
          { label: 'Fees & Status', icon: CreditCard, path: ROUTES.STUDENT.FEES },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const dashboardPath =
    role === ROLES.ADMIN
      ? ROUTES.ADMIN.DASHBOARD
      : role === ROLES.TEACHER
      ? ROUTES.TEACHER.DASHBOARD
      : ROUTES.STUDENT.DASHBOARD;

  const profilePath =
    role === ROLES.ADMIN
      ? ROUTES.ADMIN.PROFILE
      : role === ROLES.TEACHER
      ? ROUTES.TEACHER.PROFILE
      : ROUTES.STUDENT.PROFILE;

  const settingsPath =
    role === ROLES.ADMIN
      ? ROUTES.ADMIN.SETTINGS
      : role === ROLES.TEACHER
      ? ROUTES.TEACHER.SETTINGS
      : ROUTES.STUDENT.SETTINGS;

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-200">
      {}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card/60 backdrop-blur-sm sticky top-0 h-screen z-30">
        {}
        <div className="flex h-16 items-center px-6 border-b">
          <Link to={dashboardPath} className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-md">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight leading-none text-foreground">Academix</span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wide">INSTITUTE SYSTEM</span>
            </div>
          </Link>
        </div>

        {}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-primary-foreground' : 'text-muted-foreground')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Account / Role Card */}
        <div className="p-4 border-t bg-card/40">
          <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/40">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20 overflow-hidden shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name || 'Avatar'} className="h-full w-full object-cover" />
              ) : (
                getInitials(user?.name || user?.email || role)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-foreground">{user?.name || user?.email || 'User'}</p>
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 capitalize font-medium">
                {ROLE_LABELS[role] || role}
              </Badge>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-md h-16 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-base font-semibold tracking-tight hidden sm:block">
              {navItems.find((i) => i.path === location.pathname)?.label || 'Academix'}
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <ThemeToggle />

            {/* Profile Link */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(profilePath)}
              className="flex items-center space-x-2 text-xs font-medium"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="h-5 w-5 rounded-full object-cover border border-primary/30" />
              ) : (
                <User className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{user?.name || 'Profile'}</span>
            </Button>

            {/* Settings Link */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(settingsPath)}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>

            {/* Logout Button */}
            <Button variant="outline" size="sm" onClick={logout} className="text-xs text-destructive hover:bg-destructive/10">
              <LogOut className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        {/* Mobile Navigation Sheet Drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <div className="relative flex flex-col w-64 max-w-xs bg-card border-r shadow-xl z-50 p-4">
              <div className="flex items-center justify-between pb-4 border-b">
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center space-x-2"
                >
                  <GraduationCap className="h-6 w-6 text-primary" />
                  <span className="font-bold text-lg text-foreground">Academix</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                        isActive ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-accent'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full justify-start text-destructive" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" /> Log out
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
