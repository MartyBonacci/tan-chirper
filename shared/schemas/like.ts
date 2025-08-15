import { z } from 'zod';

export const LikeSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  chirp_id: z.string().uuid(),
  created_at: z.date(),
});

export const CreateLikeSchema = z.object({
  chirp_id: z.string().uuid('Invalid chirp ID'),
});

export const DeleteLikeSchema = z.object({
  chirp_id: z.string().uuid('Invalid chirp ID'),
});

export const LikeStatsSchema = z.object({
  chirp_id: z.string().uuid(),
  like_count: z.number().int().min(0),
  is_liked: z.boolean(),
});

export const LikeResponseSchema = z.object({
  success: z.boolean(),
  like_count: z.number().int().min(0),
  is_liked: z.boolean(),
});

export type Like = z.infer<typeof LikeSchema>;
export type CreateLike = z.infer<typeof CreateLikeSchema>;
export type DeleteLike = z.infer<typeof DeleteLikeSchema>;
export type LikeStats = z.infer<typeof LikeStatsSchema>;
export type LikeResponse = z.infer<typeof LikeResponseSchema>;