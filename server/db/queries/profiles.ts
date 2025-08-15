import { uuidv7 } from 'uuidv7';
import { query, queryWithRowCount } from '../connection.js';
import type { Profile, CreateProfile, UpdateProfile, ProfilePublic } from '../../../shared/schemas/profile.js';

export interface ProfileWithPassword extends Profile {
  password_hash: string;
}

export async function createProfile(data: CreateProfile & { password_hash: string }): Promise<Profile> {
  const id = uuidv7();
  
  const rows = await query<Profile>(
    `INSERT INTO profiles (id, username, display_name, bio, avatar_url, email, password_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, username, display_name, bio, avatar_url, email, created_at, updated_at`,
    [id, data.username, data.display_name, data.bio || '', data.avatar_url || '', data.email, data.password_hash]
  );
  
  return rows[0];
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const rows = await query<Profile>(
    `SELECT id, username, display_name, bio, avatar_url, email, created_at, updated_at
     FROM profiles WHERE id = $1`,
    [id]
  );
  
  return rows[0] || null;
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const rows = await query<Profile>(
    `SELECT id, username, display_name, bio, avatar_url, email, created_at, updated_at
     FROM profiles WHERE username = $1`,
    [username]
  );
  
  return rows[0] || null;
}

export async function getProfileByEmail(email: string): Promise<ProfileWithPassword | null> {
  const rows = await query<ProfileWithPassword>(
    `SELECT id, username, display_name, bio, avatar_url, email, password_hash, created_at, updated_at
     FROM profiles WHERE email = $1`,
    [email]
  );
  
  return rows[0] || null;
}

export async function getPublicProfileById(id: string): Promise<ProfilePublic | null> {
  const rows = await query<ProfilePublic>(
    `SELECT id, username, display_name, bio, avatar_url, created_at, updated_at
     FROM profiles WHERE id = $1`,
    [id]
  );
  
  return rows[0] || null;
}

export async function getPublicProfileByUsername(username: string): Promise<ProfilePublic | null> {
  const rows = await query<ProfilePublic>(
    `SELECT id, username, display_name, bio, avatar_url, created_at, updated_at
     FROM profiles WHERE username = $1`,
    [username]
  );
  
  return rows[0] || null;
}

export async function updateProfile(id: string, data: UpdateProfile): Promise<Profile | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;
  
  if (data.username !== undefined) {
    fields.push(`username = $${paramIndex++}`);
    values.push(data.username);
  }
  
  if (data.display_name !== undefined) {
    fields.push(`display_name = $${paramIndex++}`);
    values.push(data.display_name);
  }
  
  if (data.bio !== undefined) {
    fields.push(`bio = $${paramIndex++}`);
    values.push(data.bio);
  }
  
  if (data.avatar_url !== undefined) {
    fields.push(`avatar_url = $${paramIndex++}`);
    values.push(data.avatar_url);
  }
  
  if (fields.length === 0) {
    return getProfileById(id);
  }
  
  values.push(id);
  
  const rows = await query<Profile>(
    `UPDATE profiles SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${paramIndex}
     RETURNING id, username, display_name, bio, avatar_url, email, created_at, updated_at`,
    values
  );
  
  return rows[0] || null;
}

export async function deleteProfile(id: string): Promise<boolean> {
  const result = await queryWithRowCount(
    'DELETE FROM profiles WHERE id = $1',
    [id]
  );
  
  return result.rowCount > 0;
}

export async function checkUsernameExists(username: string): Promise<boolean> {
  const rows = await query<{ exists: boolean }>(
    'SELECT EXISTS(SELECT 1 FROM profiles WHERE username = $1) as exists',
    [username]
  );
  
  return rows[0]?.exists || false;
}

export async function checkEmailExists(email: string): Promise<boolean> {
  const rows = await query<{ exists: boolean }>(
    'SELECT EXISTS(SELECT 1 FROM profiles WHERE email = $1) as exists',
    [email]
  );
  
  return rows[0]?.exists || false;
}