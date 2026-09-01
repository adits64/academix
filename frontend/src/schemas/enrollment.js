import * as z from 'zod';

export const createEnrollmentSchema = z.object({
  studentId: z.string().min(1, 'Student selection is required'),
  courseId: z.string().min(1, 'Course selection is required'),
  batchId: z.string().min(1, 'Batch selection is required'),
  enrollmentDate: z.string().optional(),
  status: z.enum(['active', 'completed', 'cancelled']).default('active'),
});

export const updateEnrollmentSchema = z.object({
  status: z.enum(['active', 'completed', 'cancelled']),
  batchId: z.string().optional(),
});
