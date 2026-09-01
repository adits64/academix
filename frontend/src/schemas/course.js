import * as z from 'zod';

export const batchSchema = z.object({
  name: z.string().min(1, 'Batch name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
});

export const createCourseSchema = z.object({
  name: z.string().min(2, 'Course name must be at least 2 characters'),
  code: z.string().min(1, 'Course code is required'),
  description: z.string().optional(),
  teacher: z.string().min(1, 'Teacher ID is required'),
  duration: z.string().min(1, 'Course duration is required'),
  fee: z.coerce.number().min(0, 'Fee must be a positive number'),
  status: z.enum(['active', 'inactive']).default('active'),
  batches: z.array(batchSchema).optional().default([]),
});

export const updateCourseSchema = createCourseSchema.partial();
