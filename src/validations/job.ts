import { z } from 'zod';

export const CreateJobValidation = z.object({
  user_id: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
});

export const UpdateJobValidation = CreateJobValidation.partial();
