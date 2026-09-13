import { z } from 'zod';

export const UserValidation = z.object({
  name: z.string().min(5),
  email: z.email(),
});

export const CreateUserValidation = UserValidation;

export const UpdateUserValidation = UserValidation.partial();
