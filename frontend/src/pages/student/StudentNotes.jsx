import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notesApi } from '@/api/notes';
import { enrollmentsApi } from '@/api/enrollments';
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
  Search,
  BookOpen,
  User,
  FileCode,
  Download,
  Loader2,
} from 'lucide-react';

export function StudentNotes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
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
    queryKey: ['notes', 'my'],
    queryFn: notesApi.getMyNotes,
  });

  
  const { data: enrollmentsData } = useQuery({
    queryKey: ['enrollments', 'my'],
    queryFn: enrollmentsApi.getMyEnrollments,
  });

  const notes = Array.isArray(notesData) ? notesData : [];
  const enrollments = Array.isArray(enrollmentsData) ? enrollmentsData : [];

  
  const filteredNotes = notes.filter((n) => {
    const matchesCourse =
      selectedCourseFilter === 'all' ||
      n.courseId?._id === selectedCourseFilter ||
      n.courseId === selectedCourseFilter;

    const matchesSearch =
      searchTerm.trim() === '' ||
      n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.courseId?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCourse && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Study Materials & Notes</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Access lecture slides, PDF notes, and learning resources published by your teachers.
          </p>
        </div>
        <Badge variant="outline" className="w-fit text-xs font-semibold px-3 py-1 bg-primary/10 text-primary border-primary/20">
          <FileText className="h-3.5 w-3.5 mr-1" /> {notes.length} Available {notes.length === 1 ? 'Resource' : 'Resources'}
        </Badge>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search study notes by topic or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs sm:text-sm"
          />
        </div>

        {enrollments.length > 0 && (
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="h-10 text-xs sm:text-sm rounded-md border bg-background px-3"
          >
            <option value="all">All Enrolled Courses</option>
            {enrollments.map((enr) => (
              <option key={enr._id} value={enr.courseId?._id}>
                {enr.courseId?.name} ({enr.courseId?.code})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Content State */}
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
          description="Your instructors have not published any study materials for your enrolled courses yet."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <Card key={note._id} className="flex flex-col justify-between border hover:border-primary/40 transition-all shadow-sm">
              <CardHeader className="pb-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-semibold border-primary/30 text-primary">
                    {note.courseId?.code || 'COURSE'}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{formatDate(note.createdAt)}</span>
                </div>
                <CardTitle className="text-base font-bold leading-snug">{note.title}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">
                  {note.description || 'Lecture material and learning resource document.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 text-xs text-muted-foreground pb-4">
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="flex items-center">
                    <BookOpen className="h-3.5 w-3.5 mr-1 text-primary" /> Course
                  </span>
                  <span className="font-semibold text-foreground truncate max-w-[150px]">
                    {note.courseId?.name || 'Academic Course'}
                  </span>
                </div>

                {note.fileName && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <FileCode className="h-3.5 w-3.5 mr-1 text-primary" /> Document
                    </span>
                    <span className="font-medium text-foreground truncate max-w-[150px]" title={note.fileName}>
                      {note.fileName}
                    </span>
                  </div>
                )}

                {note.uploadedBy?.name && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <User className="h-3.5 w-3.5 mr-1 text-primary" /> Teacher
                    </span>
                    <span className="font-medium text-foreground truncate max-w-[150px]">
                      {note.uploadedBy.name}
                    </span>
                  </div>
                )}
              </CardContent>

              <div className="p-4 pt-0 border-t mt-auto pt-3">
                <Button
                  className="w-full text-xs font-semibold"
                  size="sm"
                  disabled={downloadingId === note._id}
                  onClick={() => handleDownload(note)}
                >
                  {downloadingId === note._id ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5 mr-1.5" /> Download Note
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentNotes;
