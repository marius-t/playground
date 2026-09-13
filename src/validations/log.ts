import { z } from 'zod';

import { CandidateStatusValidation } from './candidate';

export const CreateLogValidation = z.object({
  candidate_id: z.number().int().positive().optional(),
  payload: z.json(),
  response: z.json(),
  new_status: CandidateStatusValidation.optional(),
});

export const UpdateLogValidation = CreateLogValidation.partial();
