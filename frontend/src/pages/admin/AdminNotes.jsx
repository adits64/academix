import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi } from '@/api/notes';
import { coursesApi } from '@/api/courses';
import { useNotification } from '@/hooks/useNotification';
import { formatDate } from '@/utils/format';
import { downloadNoteFile } from '@/utils/download';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

import {
  FileText,
  Download,
  Trash2,
  Search,
  BookOpen,
  User,
  X,
  Loader2,
} from 'lucide-react';

export function AdminNotes() {
  const queryClient = useQueryClient();
  const notify = useNotification();

  const [search, setSearch] = useState('');
  const [deletingNote, setDeletingNote] = useState(null);
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

  
  const { data: notesData, isLoading, isError, error } = useQuery({
    queryKey: ['notes', 'admin'],
    queryFn: notesApi.getAllNotes,
  });

  
  const { data: coursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.getAllCourses,
  });

  const courses = coursesData?.courses || [];
  const existingCourseIds = new Set(courses.map((c) => String(c._id)));

  const rawNotes = Array.isArray(notesData) ? notesData : [];
  const notes = rawNotes.filter((n) => {
    const cid = String(n.courseId?._id || n.courseId || '');
    return cid && (existingCourseIds.size === 0 || existingCourseIds.has(cid));
  });

  
  const deleteMutation = useMutation({
    mutationFn: notesApi.deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      notify.success('Study note deleted');
      setDeletingNote(null);
    },
    onError: (err) => {
      notify.error(err.message || 'Failed to delete note');
    },
  });

  const filteredNotes = notes.filter((n) => {
    const titleMatch = n.title?.toLowerCase().includes(search.toLowerCase());
    const courseMatch = n.courseId?.name?.toLowerCase().includes(search.toLowerCase());
    return titleMatch || courseMatch;
  });

  return (
    <div className="space-y-6">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Study Notes & Materials</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Overview of uploaded course materials, PDF notes, and digital study resources.
          </p>
        </div>
      </div>

      {}
      <div className="flex items-center justify-between bg-card p-3 rounded-xl border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search notes title or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 h-9 text-xs sm:text-sm rounded-md border bg-background px-3"
          />
        </div>
      </div>

      {}
      {isLoading ? (
        <LoadingSpinner text="Fetching study materials..." />
      ) : isError ? (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error.message || 'Failed to load study notes'}
        </div>
      ) : filteredNotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Study Notes Available"
          description={search ? `No materials match "${search}"` : 'No study notes have been uploaded yet.'}
        />
      ) : (
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((n) => (
            <Card key={n._id} className="flex flex-col justify-between border hover:border-primary/40 transition-all">
              <CardHeader className="pb-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-semibold border-primary/30 text-primary">
                    {n.courseId?.code || 'COURSE'}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{formatDate(n.createdAt)}</span>
                </div>
                <CardTitle className="text-base font-bold leading-snug">{n.title}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">{n.description || 'No detailed description.'}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 text-xs text-muted-foreground pb-4">
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="flex items-center"><BookOpen className="h-3.5 w-3.5 mr-1 text-primary" /> Course</span>
                  <span className="font-semibold text-foreground truncate max-w-[150px]">{n.courseId?.name || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center"><User className="h-3.5 w-3.5 mr-1 text-primary" /> Uploaded By</span>
                  <span className="font-medium text-foreground">{n.uploadedBy?.name || 'Instructor'}</span>
                </div>
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

      {/* DELETE CONFIRMATION */}
      {deletingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-sm shadow-2xl border p-6 space-y-4 text-center">
            <Trash2 className="h-10 w-10 text-destructive mx-auto" />
            <div>
              <h3 className="text-base font-bold">Delete Study Resource?</h3>
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

export default AdminNotes;
