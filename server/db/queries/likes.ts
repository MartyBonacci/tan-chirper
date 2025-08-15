import { uuidv7 } from 'uuidv7';
import { query, queryWithRowCount } from '../connection.js';
import type { Like, LikeStats, LikeResponse } from '../../../shared/schemas/like.js';

export async function createLike(profileId: string, chirpId: string): Promise<Like> {
  const id = uuidv7();
  
  const rows = await query<Like>(
    `INSERT INTO likes (id, profile_id, chirp_id)
     VALUES ($1, $2, $3)
     RETURNING id, profile_id, chirp_id, created_at`,
    [id, profileId, chirpId]
  );
  
  return rows[0];
}

export async function deleteLike(profileId: string, chirpId: string): Promise<boolean> {
  const result = await queryWithRowCount(
    'DELETE FROM likes WHERE profile_id = $1 AND chirp_id = $2',
    [profileId, chirpId]
  );
  
  return result.rowCount > 0;
}

export async function getLike(profileId: string, chirpId: string): Promise<Like | null> {
  const rows = await query<Like>(
    `SELECT id, profile_id, chirp_id, created_at
     FROM likes 
     WHERE profile_id = $1 AND chirp_id = $2`,
    [profileId, chirpId]
  );
  
  return rows[0] || null;
}

export async function getLikeStats(chirpId: string, currentUserId?: string): Promise<LikeStats> {
  const rows = await query<{ like_count: string; is_liked: boolean }>(
    `SELECT 
       COUNT(l.id) as like_count,
       CASE 
         WHEN $2 IS NOT NULL AND user_likes.profile_id IS NOT NULL THEN true
         ELSE false
       END as is_liked
     FROM chirps c
     LEFT JOIN likes l ON c.id = l.chirp_id
     LEFT JOIN likes user_likes ON c.id = user_likes.chirp_id AND user_likes.profile_id = $2
     WHERE c.id = $1
     GROUP BY c.id, user_likes.profile_id`,
    [chirpId, currentUserId || null]
  );
  
  const result = rows[0];
  return {
    chirp_id: chirpId,
    like_count: parseInt(result?.like_count || '0', 10),
    is_liked: result?.is_liked || false,
  };
}

export async function toggleLike(profileId: string, chirpId: string): Promise<LikeResponse> {
  const existingLike = await getLike(profileId, chirpId);
  
  if (existingLike) {
    await deleteLike(profileId, chirpId);
    const stats = await getLikeStats(chirpId, profileId);
    return {
      success: true,
      like_count: stats.like_count,
      is_liked: false,
    };
  } else {
    await createLike(profileId, chirpId);
    const stats = await getLikeStats(chirpId, profileId);
    return {
      success: true,
      like_count: stats.like_count,
      is_liked: true,
    };
  }
}

export async function getLikesByProfileId(profileId: string, limit = 20, offset = 0): Promise<Like[]> {
  const rows = await query<Like>(
    `SELECT id, profile_id, chirp_id, created_at
     FROM likes 
     WHERE profile_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [profileId, limit, offset]
  );
  
  return rows;
}

export async function getLikesByChirpId(chirpId: string, limit = 20, offset = 0): Promise<Like[]> {
  const rows = await query<Like>(
    `SELECT id, profile_id, chirp_id, created_at
     FROM likes 
     WHERE chirp_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [chirpId, limit, offset]
  );
  
  return rows;
}

export async function getLikeCount(chirpId?: string, profileId?: string): Promise<number> {
  if (chirpId) {
    const rows = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM likes WHERE chirp_id = $1',
      [chirpId]
    );
    return parseInt(rows[0]?.count || '0', 10);
  }
  
  if (profileId) {
    const rows = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM likes WHERE profile_id = $1',
      [profileId]
    );
    return parseInt(rows[0]?.count || '0', 10);
  }
  
  const rows = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM likes'
  );
  return parseInt(rows[0]?.count || '0', 10);
}