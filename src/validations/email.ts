import { z } from 'zod';

/** One Outlook-style recipient entry. */
const EmailAddressValidation = z.object({
  emailAddress: z.object({
    name: z.string().optional(),
    address: z.email(),
  }),
});

/**
 * Shape of the inbound email dropped on `/webhook/process`.
 * Uses a loose object so unknown fields survive and get stored in the Log.
 */
export const EmailValidation = z.looseObject({
  id: z.string(),
  subject: z.string().optional(),
  from: EmailAddressValidation.optional(),
  toRecipients: z.array(EmailAddressValidation).optional(),
  receivedDateTime: z.string().optional(),
  bodyPreview: z.string().optional(),
  hasAttachments: z.boolean().optional(),
});

export type EmailPayload = z.infer<typeof EmailValidation>;
