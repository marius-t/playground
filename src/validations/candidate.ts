import { z } from 'zod';

export const CandidateStatusValidation = z.enum([
  'NEW',
  'PENDING_INTERNAL_REVIEW',
  'REJECTED_INTERNAL',
  'PENDING_EMPLOYER_REVIEW',
  'ACCEPTED_FOR_INTERVIEW',
  'REJECTED_FOR_INTERVIEW',
  'OFFER_MADE',
  'OFFER_DECLINED',
  'ACCEPTED_EMPLOYER',
  'REJECTED_EMPLOYER',
  'CANDIDATE_WITHDREW',
]);

export const CreateCandidateValidation = z.object({
  job_id: z.number().int().positive().optional(),
  name: z.string().min(5),
  email: z.email(),
  status: CandidateStatusValidation.optional(),
});

export const UpdateCandidateValidation = CreateCandidateValidation.partial();
