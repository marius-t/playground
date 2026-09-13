import { CandidateStatus, Log, Prisma } from '@prisma/client';
import axios from 'axios';

import { config } from '../config';
import CandidateProvider from '../providers/candidate';
import LogProvider from '../providers/log';
import UserProvider from '../providers/user';
import {
  CandidateContext,
  ChatCompletionResponse,
  ModelResult,
  UserContext,
} from '../types/model';
import { EmailPayload } from '../validations/email';
import { ModelResultValidation } from '../validations/webhook';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const STATUS_VALUES = Object.values(CandidateStatus);

const SYSTEM_PROMPT = `You are the inbound-email triage engine of an applicant-tracking system.
You receive one raw email plus the current candidates and users in the database.

Return ONLY a minified JSON object (no prose, no markdown fences) with exactly these keys:
{
  "email_addresses": string[],
  "matched_user": { "id": number|null, "name": string|null, "email": string|null } | null,
  "matched_candidate": { "id": number|null, "name": string|null, "email": string|null } | null,
  "job": { "id": number|null, "title": string|null } | null,
  "new_status": string | null,
  "reasoning": string
}

Rules:
- "email_addresses": EVERY email address found anywhere in the email (from, to, cc, and inside the body).
- "matched_candidate": the candidate the email is about. Match the provided candidates by email
  address first, then by name.
- "matched_user": the internal user (recruiter/owner) the email is addressed to or concerns.
- Only ever use candidate/user ids that exist in the provided context. Never invent ids; if you
  cannot match, set the id (or the whole object) to null.
- "new_status" MUST be one of the values below, or null when the email implies no status change:
  ${STATUS_VALUES.join(', ')}
- Status guidance: internal review -> PENDING_INTERNAL_REVIEW; internal rejection -> REJECTED_INTERNAL;
  sent to employer -> PENDING_EMPLOYER_REVIEW; employer grants interview -> ACCEPTED_FOR_INTERVIEW;
  employer declines interview -> REJECTED_FOR_INTERVIEW; offer extended -> OFFER_MADE;
  offer declined -> OFFER_DECLINED; employer hires -> ACCEPTED_EMPLOYER; employer rejects -> REJECTED_EMPLOYER;
  candidate withdraws -> CANDIDATE_WITHDREW.
- Keep "reasoning" under 2 sentences.`;

const toJson = (value: unknown): Prisma.InputJsonValue =>
  value as Prisma.InputJsonValue;

const toCandidateStatus = (
  value: string | null | undefined,
): CandidateStatus | null =>
  value && STATUS_VALUES.includes(value as CandidateStatus)
    ? (value as CandidateStatus)
    : null;

export default class WebhookService {
  private readonly candidateProvider = new CandidateProvider();
  private readonly userProvider = new UserProvider();
  private readonly logProvider = new LogProvider();

  public async processEmail(data: EmailPayload): Promise<Log> {
    const [candidates, users] = await Promise.all([
      this.candidateProvider.getCandidates(),
      this.userProvider.getUsers(),
    ]);

    const candidateContext: CandidateContext[] = candidates.map(
      (candidate) => ({
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        job_id: candidate.job_id,
        status: candidate.status,
      }),
    );
    const userContext: UserContext[] = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
    }));

    let raw: unknown = null;
    let error: string | null = null;
    try {
      raw = await this.askModel(data, candidateContext, userContext);
    } catch (caught) {
      error =
        caught instanceof Error
          ? caught.message
          : 'Unknown error calling the model';
    }

    const parsed = raw === null ? null : ModelResultValidation.safeParse(raw);
    const result: ModelResult | null = parsed?.success ? parsed.data : null;

    let candidateId: number | null = result?.matched_candidate?.id ?? null;
    let newStatus: CandidateStatus | null = null;

    if (result) {
      if (candidateId === null && result.matched_candidate?.email) {
        const wanted = result.matched_candidate.email.toLowerCase();
        const matched = candidates.find(
          (c) => c.email.toLowerCase() === wanted,
        );
        candidateId = matched ? matched.id : null;
      }

      const status = toCandidateStatus(result.new_status);
      if (candidateId !== null && status !== null) {
        await this.candidateProvider.updateCandidate(candidateId, { status });
        newStatus = status;
      }
    }

    return this.logProvider.createLog({
      candidate_id: candidateId,
      payload: toJson(data),
      response: toJson({
        model: config.OPENROUTER_MODEL,
        email_addresses: result?.email_addresses ?? [],
        matched_user: result?.matched_user ?? null,
        matched_candidate: result?.matched_candidate ?? null,
        job: result?.job ?? null,
        new_status: result?.new_status ?? null,
        reasoning: result?.reasoning ?? null,
        error,
        raw,
      }),
      new_status: newStatus,
    });
  }

  private async askModel(
    email: EmailPayload,
    candidates: CandidateContext[],
    users: UserContext[],
  ): Promise<unknown> {
    const response = await axios.post<ChatCompletionResponse>(
      OPENROUTER_URL,
      {
        model: config.OPENROUTER_MODEL,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: JSON.stringify({ email, candidates, users }),
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${config.OPENROUTER_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      },
    );

    return WebhookService.parseJson(
      response.data.choices?.[0]?.message?.content,
    );
  }

  private static parseJson(content: string | null | undefined): unknown {
    if (!content) {
      return null;
    }
    const cleaned = content
      .trim()
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/, '')
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
}
