import { z } from 'zod';

export const MatchedEntityValidation = z.object({
  id: z.number().nullable().optional(),
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
});

export const ModelResultValidation = z.object({
  email_addresses: z.array(z.string()).default([]),
  matched_user: MatchedEntityValidation.nullable().optional(),
  matched_candidate: MatchedEntityValidation.nullable().optional(),
  job: z
    .object({
      id: z.number().nullable().optional(),
      title: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  new_status: z.string().nullable().optional(),
  reasoning: z.string().default(''),
});
