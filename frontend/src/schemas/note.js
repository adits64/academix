import * as z from 'zod';

export const createNoteSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(150, 'Title must not exceed 150 characters'),
  description: z.string().optional(),
  courseId: z.string().min(1, 'Target course selection is required'),
  batchId: z.string().min(1, 'Target batch selection is required'),
  fileUrl: z.string().min(1, 'File URL is required').optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
});

export const updateNoteSchema = createNoteSchema.partial();
