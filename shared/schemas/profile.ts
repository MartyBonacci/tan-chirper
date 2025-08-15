import { z } from 'zod';

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  display_name: z.string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be less than 100 characters'),
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .default(''),
  avatar_url: z.string().url().optional().or(z.literal('')),
  email: z.string().email('Invalid email address'),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreateProfileSchema = ProfileSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
});

export const UpdateProfileSchema = ProfileSchema.omit({
  id: true,
  email: true,
  created_at: true,
  updated_at: true,
}).partial();

export const ProfilePublicSchema = ProfileSchema.omit({
  email: true,
});

export const ChangePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string()
    .min(8, 'New password must be at least 8 characters')
    .max(100, 'New password must be less than 100 characters'),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type CreateProfile = z.infer<typeof CreateProfileSchema>;
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;
export type ProfilePublic = z.infer<typeof ProfilePublicSchema>;
export type ChangePassword = z.infer<typeof ChangePasswordSchema>;