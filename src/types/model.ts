import { CandidateStatus } from '@prisma/client';
import { z } from 'zod';

import { ModelResultValidation } from '../validations/webhook';

export type ModelResult = z.infer<typeof ModelResultValidation>;
export type CandidateContext = {
  id: number;
  name: string;
  email: string;
  job_id: number | null;
  status: CandidateStatus;
};
export type UserContext = { id: number; name: string; email: string };
export type ChatCompletionResponse = {
  choices?: { message?: { content?: string | null } }[];
};
