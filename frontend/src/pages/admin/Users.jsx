import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usersApi } from '@/api/users';
import { createUserSchema, updateUserSchema } from '@/schemas/user';
import { useNotification } from '@/hooks/useNotification';
import { useAuth } from '@/hooks/useAuth';
import { getInitials, formatDate } from '@/utils/format';
import { ROLES, ROLE_LABELS } from '@/constants/roles';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  UserCheck,
  Shield,
  GraduationCap,
  X,
  Loader2,
  Eye,
} from 'lucide-react';

export function Users() {
  const queryClient = useQueryClient();
  const notify = useNotification();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [editCurrentPassword, setEditCurrentPassword] = useState('');

  
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAllUsers,
  });

  const users = data?.users || [];

  
  const createMutation = useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notify.success('User created successfully');
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: (err) => {
      notify.error(err.message || 'Failed to create user');
    },
  });

  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => usersApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notify.success('User updated successfully');
      setEditingUser(null);
    },
    onError: (err) => {
      notify.error(err.message || 'Failed to update user');
    },
  });

  
  const deleteMutation = useMutation({
    mutationFn: usersApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notify.success('User deleted successfully');
      setDeletingUser(null);
    },
    onError: (err) => {
      notify.error(err.message || 'Failed to delete user');
    },
  });

  
  const createForm = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '', password: '', role: 'student' },
  });

  const editForm = useForm({
    resolver: zodResolver(updateUserSchema),
  });

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditCurrentPassword('');
    editForm.reset({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
    });
  };

  
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'destructive';
      case ROLES.TEACHER:
        return 'warning';
      case ROLES.STUDENT:
        return 'success';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage administrators, teachers, and student accounts for the institute.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto font-medium shadow-sm">
          <UserPlus className="h-4 w-4 mr-2" /> Add New User
        </Button>
      </div>

      {}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs sm:text-sm h-9"
          />
        </div>

        {/* Role Pills */}
        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['all', ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT].map((role) => (
            <Button
              key={role}
              variant={roleFilter === role ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter(role)}
              className="text-xs h-8 capitalize whitespace-nowrap"
            >
              {role === 'all' ? 'All Roles' : ROLE_LABELS[role] || role}
            </Button>
          ))}
        </div>
      </div>

      {}
      {isLoading ? (
        <LoadingSpinner text="Fetching institute users..." />
      ) : isError ? (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error.message || 'Error loading users list'}
        </div>
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No Users Found"
          description={search ? `No accounts match "${search}"` : 'No users match the selected role filter.'}
          action={
            <Button size="sm" variant="outline" onClick={() => { setSearch(''); setRoleFilter('all'); }}>
              Reset Filters
            </Button>
          }
        />
      ) : (
        
        <Card className="overflow-hidden border shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-medium flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                        {getInitials(u.name)}
                      </div>
                      <span
                        className="font-semibold text-foreground hover:text-primary hover:underline cursor-pointer transition-colors"
                        onClick={() => navigate(`/admin/users/${u._id}`)}
                      >
                        {u.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant={getRoleBadgeVariant(u.role)} className="capitalize font-medium text-[11px]">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{formatDate(u.createdAt)}</td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary hover:bg-primary/10"
                        title="View Profile"
                        onClick={() => navigate(`/admin/users/${u._id}`)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(u)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => setDeletingUser(u)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* CREATE USER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl border">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-base font-bold flex items-center">
                <UserPlus className="h-4 w-4 mr-2 text-primary" /> Create New User
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setIsCreateOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))} className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Full Name</label>
                <Input placeholder="Aditya Singh" {...createForm.register('name')} />
                {createForm.formState.errors.name && (
                  <p className="text-[11px] text-destructive">{createForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Email Address</label>
                <Input type="email" placeholder="user@institute.com" {...createForm.register('email')} />
                {createForm.formState.errors.email && (
                  <p className="text-[11px] text-destructive">{createForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Password</label>
                <Input type="password" placeholder="••••••••" {...createForm.register('password')} />
                {createForm.formState.errors.password && (
                  <p className="text-[11px] text-destructive">{createForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">System Role</label>
                <select
                  {...createForm.register('role')}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
                {createForm.formState.errors.role && (
                  <p className="text-[11px] text-destructive">{createForm.formState.errors.role.message}</p>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create User
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl border">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-base font-bold flex items-center">
                <Edit2 className="h-4 w-4 mr-2 text-primary" /> Edit User ({editingUser.name})
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setEditingUser(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form
              onSubmit={editForm.handleSubmit((data) => {
                const isSelf = String(authUser?._id) === String(editingUser._id);
                const payload = { ...data };
                if (!payload.password) {
                  delete payload.password;
                } else if (isSelf) {
                  if (!editCurrentPassword) {
                    notify.error('Current password is required to change your password');
                    return;
                  }
                  payload.currentPassword = editCurrentPassword;
                }
                updateMutation.mutate({ id: editingUser._id, data: payload });
              })}
              className="p-4 space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Full Name</label>
                <Input {...editForm.register('name')} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Email Address</label>
                <Input type="email" {...editForm.register('email')} />
              </div>

              {editingUser && String(authUser?._id) === String(editingUser._id) && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Current Password (Required for changing password)</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={editCurrentPassword}
                    onChange={(e) => setEditCurrentPassword(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium">New Password (leave blank to keep current)</label>
                <Input type="password" placeholder="••••••••" {...editForm.register('password')} />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-sm shadow-2xl border p-6 space-y-4 text-center">
            <Trash2 className="h-10 w-10 text-destructive mx-auto" />
            <div>
              <h3 className="text-base font-bold">Delete User Account?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Are you sure you want to delete <span className="font-semibold text-foreground">{deletingUser.name}</span> ({deletingUser.email})? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeletingUser(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deletingUser._id)}
              >
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default Users;
