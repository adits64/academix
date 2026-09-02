import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GraduationCap, Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ROLES } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export function Login() {
  const { user, role, login, isLoading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  React.useEffect(() => {
    if (isAuthenticated && role) {
      if (role === ROLES.ADMIN) navigate(ROUTES.ADMIN.DASHBOARD, { replace: true });
      else if (role === ROLES.TEACHER) navigate(ROUTES.TEACHER.DASHBOARD, { replace: true });
      else if (role === ROLES.STUDENT) navigate(ROUTES.STUDENT.DASHBOARD, { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const user = await login(data);
      const targetRole = user?.role;

      
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
        return;
      }

      if (targetRole === ROLES.ADMIN) navigate(ROUTES.ADMIN.DASHBOARD, { replace: true });
      else if (targetRole === ROLES.TEACHER) navigate(ROUTES.TEACHER.DASHBOARD, { replace: true });
      else if (targetRole === ROLES.STUDENT) navigate(ROUTES.STUDENT.DASHBOARD, { replace: true });
      else navigate('/', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Failed to authenticate. Check email and password.');
    }
  };

  const loading = isSubmitting || authLoading;

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-xl border-border/80">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-md">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">Sign in to Academix</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Enter your credentials to access your portal
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {serverError && (
              <div className="p-3 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                {serverError}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center">
                <Mail className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> Email Address
              </label>
              <Input
                type="email"
                placeholder="name@institute.com"
                autoComplete="email"
                disabled={loading}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-[11px] text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center">
                <Lock className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-destructive">{errors.password.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button type="submit" className="w-full h-10 font-semibold" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <p className="text-[11px] text-center text-muted-foreground">
              Contact your institute administrator if you need login assistance.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default Login;
