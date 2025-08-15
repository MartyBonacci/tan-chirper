import { uuidv7 } from 'uuidv7';
import { query, queryWithRowCount } from '../connection.js';
import type { Chirp, CreateChirp, UpdateChirp, ChirpWithProfile, ChirpFeedItem } from '../../../shared/schemas/chirp.js';

export async function createChirp(profileId: string, data: CreateChirp): Promise<Chirp> {
  const id = uuidv7();
  
  const rows = await query<Chirp>(
    `INSERT INTO chirps (id, profile_id, content)
     VALUES ($1, $2, $3)
     RETURNING id, profile_id, content, created_at, updated_at`,
    [id, profileId, data.content]
  );
  
  return rows[0];
}

export async function getChirpById(id: string): Promise<Chirp | null> {
  const rows = await query<Chirp>(
    `SELECT id, profile_id, content, created_at, updated_at
     FROM chirps WHERE id = $1`,
    [id]
  );
  
  return rows[0] || null;
}

export async function getChirpWithProfile(id: string, currentUserId?: string): Promise<ChirpWithProfile | null> {
  const rows = await query<ChirpWithProfile>(
    `SELECT 
       c.id,
       c.profile_id,
       c.content,
       c.created_at,
       c.updated_at,
       json_build_object(
         'id', p.id,
         'username', p.username,
         'display_name', p.display_name,
         'avatar_url', p.avatar_url
       ) as profile,
       COALESCE(like_counts.like_count, 0) as like_count,
       CASE 
         WHEN $2 IS NOT NULL AND user_likes.profile_id IS NOT NULL THEN true
         ELSE false
       END as is_liked
     FROM chirps c
     JOIN profiles p ON c.profile_id = p.id
     LEFT JOIN (
       SELECT chirp_id, COUNT(*) as like_count
       FROM likes
       GROUP BY chirp_id
     ) like_counts ON c.id = like_counts.chirp_id
     LEFT JOIN likes user_likes ON c.id = user_likes.chirp_id AND user_likes.profile_id = $2
     WHERE c.id = $1`,
    [id, currentUserId || null]
  );
  
  return rows[0] || null;
}

export async function getChirpsByProfileId(profileId: string, limit = 20, offset = 0): Promise<Chirp[]> {
  const rows = await query<Chirp>(
    `SELECT id, profile_id, content, created_at, updated_at
     FROM chirps 
     WHERE profile_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [profileId, limit, offset]
  );
  
  return rows;
}

export async function getFeedChirps(currentUserId?: string, limit = 20, offset = 0): Promise<ChirpFeedItem[]> {
  const rows = await query<ChirpFeedItem>(
    `SELECT 
       c.id,
       c.profile_id,
       c.content,
       c.created_at,
       c.updated_at,
       json_build_object(
         'id', p.id,
         'username', p.username,
         'display_name', p.display_name,
         'avatar_url', p.avatar_url
       ) as profile,
       COALESCE(like_counts.like_count, 0) as like_count,
       CASE 
         WHEN $1 IS NOT NULL AND user_likes.profile_id IS NOT NULL THEN true
         ELSE false
       END as is_liked
     FROM chirps c
     JOIN profiles p ON c.profile_id = p.id
     LEFT JOIN (
       SELECT chirp_id, COUNT(*) as like_count
       FROM likes
       GROUP BY chirp_id
     ) like_counts ON c.id = like_counts.chirp_id
     LEFT JOIN likes user_likes ON c.id = user_likes.chirp_id AND user_likes.profile_id = $1
     ORDER BY c.created_at DESC
     LIMIT $2 OFFSET $3`,
    [currentUserId || null, limit, offset]
  );
  
  return rows;
}

export async function updateChirp(id: string, profileId: string, data: UpdateChirp): Promise<Chirp | null> {
  const rows = await query<Chirp>(
    `UPDATE chirps 
     SET content = $1, updated_at = NOW()
     WHERE id = $2 AND profile_id = $3
     RETURNING id, profile_id, content, created_at, updated_at`,
    [data.content, id, profileId]
  );
  
  return rows[0] || null;
}

export async function deleteChirp(id: string, profileId: string): Promise<boolean> {
  const result = await queryWithRowCount(
    'DELETE FROM chirps WHERE id = $1 AND profile_id = $2',
    [id, profileId]
  );
  
  return result.rowCount > 0;
}

export async function getChirpCount(profileId?: string): Promise<number> {
  if (profileId) {
    const rows = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM chirps WHERE profile_id = $1',
      [profileId]
    );
    return parseInt(rows[0]?.count || '0', 10);
  }
  
  const rows = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM chirps'
  );
  return parseInt(rows[0]?.count || '0', 10);
}