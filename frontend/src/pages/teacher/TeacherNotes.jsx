import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { notesApi } from '@/api/notes';
import { coursesApi } from '@/api/courses';
import { createNoteSchema } from '@/schemas/note';
import { uploadFileToCloudinary } from '@/utils/upload';
import { toast } from 'sonner';
import { formatDate } from '@/utils/format';
import { downloadNoteFile } from '@/utils/download';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

import {
  FileText,
  Plus,
  Trash2,
  Download,
  BookOpen,
  Layers,
  X,
  Loader2,
  UploadCloud,
  FileCode,
  FileCheck,
} from 'lucide-react';

export function TeacherNotes() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingNote, setDeletingNote] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownload = async (note) => {
    if (downloadingId) return;
    setDownloadingId(note._id);
    try {
      await downloadNoteFile(note);
    } finally {
      setDownloadingId(null);
    }
  };

  // Fetch Teacher's Assigned Courses for dropdown
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses', 'teacher'],
    queryFn: coursesApi.getMyCourses,
  });

  // Fetch Teacher's Uploaded Notes from database
  const { data: notesData, isLoading, isError, error } = useQuery({
    queryKey: ['notes', 'teacher'],
    queryFn: notesApi.getTeacherNotes,
  });

  const courseList = Array.isArray(courses) ? courses : [];
  const notes = Array.isArray(notesData) ? notesData : [];

  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createNoteSchema),
    defaultValues: { title: '', description: '', courseId: '', batchId: '' },
  });

  const selectedCourseId = watch('courseId');
  const selectedCourse = courseList.find((c) => c._id === selectedCourseId);
  const availableBatches = selectedCourse?.batches || [];

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: notesApi.deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Study note deleted successfully');
      setDeletingNote(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete note');
    },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileError('');
    }
  };

  const handleFormSubmit = async (formData) => {
    if (!selectedFile) {
      setFileError('Please choose a file to upload');
      return;
    }

    try {
      setIsUploading(true);

      // Step 1: Upload file to Cloudinary (or fallback architecture)
      const uploadResult = await uploadFileToCloudinary(selectedFile);

      // Step 2: Send metadata to Academix Backend
      const notePayload = {
        title: formData.title,
        description: formData.description || '',
        courseId: formData.courseId,
        batchId: formData.batchId,
        fileUrl: uploadResult.fileUrl,
        fileName: uploadResult.fileName,
        fileType: uploadResult.fileType,
      };

      await notesApi.createNote(notePayload);

      // Invalidate and refresh query cache
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Material uploaded successfully');
      setIsCreateOpen(false);
      reset();
      setSelectedFile(null);
      setFileError('');
    } catch (err) {
      toast.error(err.message || 'Failed to upload study note');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teacher Study Notes</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Upload PDF materials, lecture notes, and study resources for your course batches.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto font-medium shadow-sm">
          <Plus className="h-4 w-4 mr-2" /> Upload Study Material
        </Button>
      </div>

      {/* Content State */}
      {isLoading ? (
        <LoadingSpinner text="Fetching your study notes..." />
      ) : isError ? (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error.message || 'Failed to load your study notes'}
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Study Notes Uploaded"
          description="You haven't uploaded any study materials for your courses yet."
          action={
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              Upload First Note
            </Button>
          }
        />
      ) : (
        /* Notes Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((n) => (
            <Card key={n._id} className="flex flex-col justify-between border hover:border-primary/40 transition-all">
              <CardHeader className="pb-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-semibold border-primary/30 text-primary">
                    {n.courseId?.code || 'COURSE'}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{formatDate(n.createdAt)}</span>
                </div>
                <CardTitle className="text-base font-bold leading-snug">{n.title}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">{n.description || 'No description provided.'}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 text-xs text-muted-foreground pb-4">
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="flex items-center"><BookOpen className="h-3.5 w-3.5 mr-1 text-primary" /> Course</span>
                  <span className="font-semibold text-foreground truncate max-w-[150px]">{n.courseId?.name || 'N/A'}</span>
                </div>

                {n.fileName && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center"><FileCode className="h-3.5 w-3.5 mr-1 text-primary" /> File</span>
                    <span className="font-medium text-foreground truncate max-w-[150px]" title={n.fileName}>{n.fileName}</span>
                  </div>
                )}
              </CardContent>

              <div className="p-4 pt-0 flex items-center justify-between border-t mt-auto pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-medium"
                  disabled={downloadingId === n._id}
                  onClick={() => handleDownload(n)}
                >
                  {downloadingId === n._id ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5 mr-1.5 text-primary" /> Download Note
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={() => setDeletingNote(n)}
                  title="Delete Note"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* UPLOAD NOTE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-md shadow-2xl border p-5 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold flex items-center">
                <Plus className="h-4 w-4 mr-2 text-primary" /> Upload Study Material
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (!isUploading) {
                    setIsCreateOpen(false);
                    setSelectedFile(null);
                    setFileError('');
                  }
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3.5 text-xs sm:text-sm">
              {/* 1. Title */}
              <div className="space-y-1">
                <label className="font-medium">Material Title *</label>
                <Input
                  placeholder="e.g. Chapter 1: Introduction to React & JSX"
                  {...register('title')}
                  disabled={isUploading}
                />
                {errors.title && <p className="text-[11px] text-destructive">{errors.title.message}</p>}
              </div>

              {/* 2. Target Course */}
              <div className="space-y-1">
                <label className="font-medium">Target Course *</label>
                <select
                  {...register('courseId')}
                  disabled={isUploading}
                  className="w-full h-10 rounded-md border bg-background px-3"
                >
                  <option value="">Select Course Program</option>
                  {courseList.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
                {errors.courseId && <p className="text-[11px] text-destructive">{errors.courseId.message}</p>}
              </div>

              {/* 3. Target Batch */}
              <div className="space-y-1">
                <label className="font-medium">Target Batch *</label>
                <select
                  {...register('batchId')}
                  disabled={isUploading || !selectedCourseId}
                  className="w-full h-10 rounded-md border bg-background px-3 disabled:opacity-50"
                >
                  <option value="">Select Batch</option>
                  {availableBatches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.startTime} - {b.endTime})
                    </option>
                  ))}
                </select>
                {errors.batchId && <p className="text-[11px] text-destructive">{errors.batchId.message}</p>}
              </div>

              {/* 4. Local File Picker */}
              <div className="space-y-1">
                <label className="font-medium">Choose File from Local Computer *</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/20"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center space-x-2 text-primary font-medium">
                      <FileCheck className="h-5 w-5 text-emerald-500" />
                      <span className="truncate max-w-[200px] text-xs text-foreground font-semibold">
                        {selectedFile.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ({Math.round(selectedFile.size / 1024)} KB)
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <UploadCloud className="h-6 w-6 text-muted-foreground mx-auto" />
                      <p className="text-xs font-semibold text-foreground">Click to select a file from your computer</p>
                      <p className="text-[10px] text-muted-foreground">PDF, Word, PPT, ZIP, or Image documents</p>
                    </div>
                  )}
                </div>
                {fileError && <p className="text-[11px] text-destructive">{fileError}</p>}
              </div>

              {/* 5. Description */}
              <div className="space-y-1">
                <label className="font-medium">Description (Optional)</label>
                <textarea
                  {...register('description')}
                  rows={2}
                  disabled={isUploading}
                  className="w-full rounded-md border border-input bg-background p-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Summary of topics or instructions covered in this note..."
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploading}
                  onClick={() => {
                    setIsCreateOpen(false);
                    setSelectedFile(null);
                    setFileError('');
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading} className="font-semibold">
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading & Publishing...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4 mr-2" /> Publish Note
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deletingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-sm shadow-2xl border p-6 space-y-4 text-center">
            <Trash2 className="h-10 w-10 text-destructive mx-auto" />
            <div>
              <h3 className="text-base font-bold">Delete Study Material?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Are you sure you want to delete <span className="font-semibold text-foreground">{deletingNote.title}</span>?
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeletingNote(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deletingNote._id)}
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

export default TeacherNotes;

