import * as z from 'zod';

export const sendNoticeSchema = z.object({
  recipientType: z.enum(['single', 'batch', 'all']).default('batch'),
  studentId: z.string().optional(),
  courseId: z.string().optional(),
  batchId: z.string().optional(),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(5, 'Message must be at least 5 characters'),
});
