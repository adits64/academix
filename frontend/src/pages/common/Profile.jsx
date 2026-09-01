import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { usersApi } from '@/api/users';
import { uploadFileToCloudinary } from '@/utils/upload';
import { getInitials } from '@/utils/format';
import { ROLE_LABELS } from '@/constants/roles';
import { toast } from 'sonner';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import {
  Edit2,
  Save,
  X,
  Mail,
  Shield,
  User as UserIcon,
  Camera,
  Loader2,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Validation schemas
// ─────────────────────────────────────────────────────────────────────────────
const profileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name must contain only letters'),
  email: z.string().email('Valid email address required'),
});

const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// ─────────────────────────────────────────────────────────────────────────────
// Small reusable password field with show/hide toggle
// ─────────────────────────────────────────────────────────────────────────────
function PasswordInput({ label, register, name, error, disabled }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1">
      <label className="font-medium flex items-center gap-1.5">
        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
      </label>
      <div className="relative">
        <Input
          type={show ? 'text' : 'password'}
          placeholder="••••••••"
          autoComplete="off"
          disabled={disabled}
          {...register(name)}
          className="pr-10"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-[11px] text-destructive">{error.message}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Profile Component — shared by Student / Teacher / Admin
// ─────────────────────────────────────────────────────────────────────────────
export function Profile() {
  const { user, updateUser } = useAuth();
  const avatarInputRef = useRef(null);

  // UI state — page ALWAYS opens in VIEW mode
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // ── Profile form ──────────────────────────────────────────────────────────
  const {
    register: regProfile,
    handleSubmit: submitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', email: user?.email || '' },
  });

  // ── Password form ─────────────────────────────────────────────────────────
  const {
    register: regPassword,
    handleSubmit: submitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  // ── Enter edit mode ───────────────────────────────────────────────────────
  const enterEdit = () => {
    resetProfile({ name: user?.name || '', email: user?.email || '' });
    resetPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsEditing(true);
  };

  // ── Cancel edit mode ──────────────────────────────────────────────────────
  const cancelEdit = () => {
    resetProfile({ name: user?.name || '', email: user?.email || '' });
    resetPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsEditing(false);
  };

  // ── Avatar upload ─────────────────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPG, PNG, WebP…)');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const toastId = 'avatar-upload';
      toast.loading('Uploading profile picture…', { id: toastId });

      const { fileUrl } = await uploadFileToCloudinary(file);

      await usersApi.updateUser(user._id, { avatar: fileUrl });
      updateUser({ avatar: fileUrl });

      toast.success('Profile picture updated successfully', { id: toastId });
    } catch (err) {
      toast.error(err.message || 'Failed to upload profile picture', {
        id: 'avatar-upload',
      });
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  // ── Save profile changes ──────────────────────────────────────────────────
  const onProfileSave = async (data) => {
    setIsSaving(true);
    try {
      const payload = { name: data.name.trim() };
      // All roles may edit their own email; backend enforces uniqueness
      if (data.email && data.email !== user?.email) {
        payload.email = data.email.trim().toLowerCase();
      }
      await usersApi.updateUser(user._id, payload);
      updateUser(payload);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Change password ───────────────────────────────────────────────────────
  const onPasswordSave = async (data) => {
    setIsChangingPassword(true);
    try {
      // Backend validates the old password internally via its auth service.
      // We send both fields; backend returns 400 if currentPassword is wrong.
      await usersApi.updateUser(user._id, {
        password: data.newPassword,
        currentPassword: data.currentPassword,
      });
      toast.success('Password changed successfully');
      resetPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      // Surface backend message (e.g., "Current password is incorrect")
      toast.error(err.message || 'Failed to change password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Hidden file input for avatar */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
        disabled={isUploadingAvatar}
      />

      {/* ── Page header ── */}
      <div className="border-b pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account Profile</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your personal credentials and account details.
          </p>
        </div>

        {/* Pen icon — only visible in VIEW mode */}
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={enterEdit}
            className="text-xs"
          >
            <Edit2 className="h-3.5 w-3.5 mr-1.5 text-primary" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* ── Profile card ── */}
      <Card className="shadow-lg border overflow-hidden">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-primary/80 to-primary/40" />

        <CardContent className="px-6 pb-6 relative pt-0">
          {/* Avatar row */}
          <div className="relative -top-12 flex flex-col sm:flex-row items-center sm:items-end justify-between border-b pb-6 gap-4">
            <div className="relative group">
              {/* Avatar circle */}
              <div className="h-24 w-24 rounded-full bg-card border-4 border-card shadow-xl ring-2 ring-primary/20 overflow-hidden flex items-center justify-center font-bold text-2xl text-primary">
                {isUploadingAvatar ? (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-full">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user?.name || 'Profile'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(user?.name || user?.email)
                )}
              </div>

              {/* Camera button — only visible in EDIT mode */}
              {isEditing && (
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
                  title="Upload new profile picture"
                >
                  <Camera className="h-4 w-4" />
                </button>
              )}

              {/* Pen button in VIEW mode — shortcut to edit */}
              {!isEditing && (
                <button
                  type="button"
                  onClick={enterEdit}
                  className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
                  title="Edit profile"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="text-center sm:text-left flex-1 sm:ml-4">
              <h2 className="text-xl font-bold text-foreground">
                {user?.name || 'Academix User'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
            </div>

            <Badge
              variant="outline"
              className="text-xs font-semibold px-3 py-1 bg-primary/10 text-primary border-primary/20 capitalize"
            >
              <Shield className="h-3 w-3 mr-1" />
              {ROLE_LABELS[user?.role] || user?.role}
            </Badge>
          </div>

          {/* ── VIEW MODE ── */}
          {!isEditing && (
            <div className="space-y-4 pt-2 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border bg-muted/20">
                  <span className="text-muted-foreground text-xs flex items-center mb-1">
                    <UserIcon className="h-3.5 w-3.5 mr-1 text-primary" /> Full Name
                  </span>
                  <p className="font-semibold text-foreground">{user?.name || '—'}</p>
                </div>

                <div className="p-3 rounded-lg border bg-muted/20">
                  <span className="text-muted-foreground text-xs flex items-center mb-1">
                    <Mail className="h-3.5 w-3.5 mr-1 text-primary" /> Email Address
                  </span>
                  <p className="font-semibold text-foreground">{user?.email || '—'}</p>
                </div>
              </div>

              <div className="p-3 rounded-lg border bg-muted/20">
                <span className="text-muted-foreground text-xs flex items-center mb-1">
                  <Shield className="h-3.5 w-3.5 mr-1 text-primary" /> Assigned System Role
                </span>
                <p className="font-semibold text-foreground capitalize">
                  {ROLE_LABELS[user?.role] || user?.role}
                </p>
              </div>
            </div>
          )}

          {/* ── EDIT MODE — Profile fields ── */}
          {isEditing && (
            <form
              id="profile-form"
              onSubmit={submitProfile(onProfileSave)}
              className="space-y-4 pt-2 text-xs sm:text-sm"
            >
              <div className="space-y-1">
                <label className="font-medium flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5 text-muted-foreground" /> Full Name
                </label>
                <Input
                  placeholder="Your full name"
                  disabled={isSaving}
                  {...regProfile('name')}
                />
                {profileErrors.name && (
                  <p className="text-[11px] text-destructive">
                    {profileErrors.name.message}
                  </p>
                )}
              </div>

              {user?.role === 'student' ? (
                <div className="space-y-1">
                  <label className="font-medium flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" /> Email Address (Managed by Administrator)
                  </label>
                  <Input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="opacity-60 cursor-not-allowed bg-muted/30"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Students cannot edit their registered email address. Contact an administrator for changes.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="font-medium flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    disabled={isSaving}
                    {...regProfile('email')}
                  />
                  {profileErrors.email && (
                    <p className="text-[11px] text-destructive">
                      {profileErrors.email.message}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEdit}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button type="submit" form="profile-form" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* ── Security & Password card — only visible in EDIT MODE ── */}
      {isEditing && (
        <Card className="shadow-lg border">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold flex items-center">
              <KeyRound className="h-4 w-4 mr-2 text-primary" /> Security &amp; Password
            </CardTitle>
            <CardDescription className="text-xs">
              Leave password fields empty if you do not want to change your password.
            </CardDescription>
          </CardHeader>

          <form onSubmit={submitPassword(onPasswordSave)}>
            <CardContent className="space-y-4 pt-4 text-xs sm:text-sm">
              <PasswordInput
                label="Current Password"
                register={regPassword}
                name="currentPassword"
                error={passwordErrors.currentPassword}
                disabled={isChangingPassword}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PasswordInput
                  label="New Password"
                  register={regPassword}
                  name="newPassword"
                  error={passwordErrors.newPassword}
                  disabled={isChangingPassword}
                />
                <PasswordInput
                  label="Confirm New Password"
                  register={regPassword}
                  name="confirmPassword"
                  error={passwordErrors.confirmPassword}
                  disabled={isChangingPassword}
                />
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-end space-x-2 pb-4 px-6 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={cancelEdit}
                disabled={isChangingPassword}
              >
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button
                type="submit"
                disabled={isChangingPassword}
                className="font-semibold"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" /> Change Password
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
}

export default Profile;
