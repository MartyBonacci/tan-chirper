import { z } from 'zod';

export const ChirpSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  content: z.string()
    .min(1, 'Chirp content cannot be empty')
    .max(141, 'Chirp content must be 141 characters or less'),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreateChirpSchema = ChirpSchema.omit({
  id: true,
  profile_id: true,
  created_at: true,
  updated_at: true,
});

export const UpdateChirpSchema = z.object({
  content: z.string()
    .min(1, 'Chirp content cannot be empty')
    .max(141, 'Chirp content must be 141 characters or less'),
});

export const ChirpWithProfileSchema = ChirpSchema.extend({
  profile: z.object({
    id: z.string().uuid(),
    username: z.string(),
    display_name: z.string(),
    avatar_url: z.string().optional(),
  }),
  like_count: z.number().int().min(0).default(0),
  is_liked: z.boolean().default(false),
});

export const ChirpFeedItemSchema = ChirpWithProfileSchema;

export type Chirp = z.infer<typeof ChirpSchema>;
export type CreateChirp = z.infer<typeof CreateChirpSchema>;
export type UpdateChirp = z.infer<typeof UpdateChirpSchema>;
export type ChirpWithProfile = z.infer<typeof ChirpWithProfileSchema>;
export type ChirpFeedItem = z.infer<typeof ChirpFeedItemSchema>;