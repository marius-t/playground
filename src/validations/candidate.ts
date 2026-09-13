import { z } from 'zod';

export const CreateCandidateValidation = z.object({
  name: z.string().min(5),
  email: z.email(),
});
