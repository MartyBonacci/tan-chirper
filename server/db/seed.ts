import { uuidv7 } from 'uuidv7';
import { query } from './connection.js';

interface SeedProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  email: string;
  password_hash: string;
}

interface SeedChirp {
  id: string;
  profile_id: string;
  content: string;
}

async function clearData(): Promise<void> {
  console.log('Clearing existing data...');
  await query('DELETE FROM likes');
  await query('DELETE FROM chirps');
  await query('DELETE FROM profiles');
}

async function seedProfiles(): Promise<SeedProfile[]> {
  console.log('Seeding profiles...');
  
  const profiles: SeedProfile[] = [
    {
      id: uuidv7(),
      username: 'alice_dev',
      display_name: 'Alice Developer',
      bio: 'Full-stack developer who loves TypeScript and coffee ☕',
      email: 'alice@example.com',
      password_hash: 'dev_password_hash_1' // In real app, this would be properly hashed
    },
    {
      id: uuidv7(),
      username: 'bob_codes',
      display_name: 'Bob the Builder',
      bio: 'Building the future, one commit at a time 🚀',
      email: 'bob@example.com',
      password_hash: 'dev_password_hash_2'
    },
    {
      id: uuidv7(),
      username: 'charlie_design',
      display_name: 'Charlie Designer',
      bio: 'UI/UX enthusiast. Making apps beautiful and intuitive ✨',
      email: 'charlie@example.com',
      password_hash: 'dev_password_hash_3'
    },
    {
      id: uuidv7(),
      username: 'diana_data',
      display_name: 'Diana Analytics',
      bio: 'Data scientist turning numbers into insights 📊',
      email: 'diana@example.com',
      password_hash: 'dev_password_hash_4'
    }
  ];

  for (const profile of profiles) {
    await query(
      `INSERT INTO profiles (id, username, display_name, bio, email, password_hash) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [profile.id, profile.username, profile.display_name, profile.bio, profile.email, profile.password_hash]
    );
  }

  console.log(`✓ Created ${profiles.length} profiles`);
  return profiles;
}

async function seedChirps(profiles: SeedProfile[]): Promise<SeedChirp[]> {
  console.log('Seeding chirps...');
  
  const chirps: SeedChirp[] = [
    {
      id: uuidv7(),
      profile_id: profiles[0].id,
      content: 'Just deployed our new TypeScript stack! 🎉 The type safety is incredible. #typescript #webdev'
    },
    {
      id: uuidv7(),
      profile_id: profiles[1].id,
      content: 'Working on a new feature branch. Git flow is life! 💻 #git #development'
    },
    {
      id: uuidv7(),
      profile_id: profiles[2].id,
      content: 'Figma → Code is such a satisfying workflow. Clean designs make clean code! ✨ #design #frontend'
    },
    {
      id: uuidv7(),
      profile_id: profiles[3].id,
      content: 'Data visualization update: User engagement is up 23% this quarter! 📈 #analytics #data'
    },
    {
      id: uuidv7(),
      profile_id: profiles[0].id,
      content: 'Hot take: Code reviews are the best form of knowledge sharing. Change my mind! 🤔'
    },
    {
      id: uuidv7(),
      profile_id: profiles[1].id,
      content: 'Why do we call it "debugging"? Because "de-featuring" doesn\'t sound as nice 😄 #debugging #humor'
    },
    {
      id: uuidv7(),
      profile_id: profiles[2].id,
      content: 'New icon set just dropped! Minimal, clean, and perfectly aligned. Designer happiness level: 💯'
    },
    {
      id: uuidv7(),
      profile_id: profiles[3].id,
      content: 'SQL query performance optimization complete. Went from 2s to 150ms! 🚀 #database #performance'
    }
  ];

  for (const chirp of chirps) {
    await query(
      `INSERT INTO chirps (id, profile_id, content) VALUES ($1, $2, $3)`,
      [chirp.id, chirp.profile_id, chirp.content]
    );
  }

  console.log(`✓ Created ${chirps.length} chirps`);
  return chirps;
}

async function seedLikes(profiles: SeedProfile[], chirps: SeedChirp[]): Promise<void> {
  console.log('Seeding likes...');
  
  const likes = [
    { profile_id: profiles[1].id, chirp_id: chirps[0].id }, // Bob likes Alice's chirp
    { profile_id: profiles[2].id, chirp_id: chirps[0].id }, // Charlie likes Alice's chirp
    { profile_id: profiles[3].id, chirp_id: chirps[0].id }, // Diana likes Alice's chirp
    { profile_id: profiles[0].id, chirp_id: chirps[1].id }, // Alice likes Bob's chirp
    { profile_id: profiles[2].id, chirp_id: chirps[1].id }, // Charlie likes Bob's chirp
    { profile_id: profiles[0].id, chirp_id: chirps[2].id }, // Alice likes Charlie's chirp
    { profile_id: profiles[1].id, chirp_id: chirps[2].id }, // Bob likes Charlie's chirp
    { profile_id: profiles[0].id, chirp_id: chirps[3].id }, // Alice likes Diana's chirp
    { profile_id: profiles[2].id, chirp_id: chirps[4].id }, // Charlie likes Alice's second chirp
    { profile_id: profiles[3].id, chirp_id: chirps[5].id }, // Diana likes Bob's humor chirp
  ];

  let likeCount = 0;
  for (const like of likes) {
    await query(
      `INSERT INTO likes (id, profile_id, chirp_id) VALUES ($1, $2, $3)`,
      [uuidv7(), like.profile_id, like.chirp_id]
    );
    likeCount++;
  }

  console.log(`✓ Created ${likeCount} likes`);
}

export async function runSeeding(): Promise<void> {
  try {
    console.log('Starting database seeding...');
    
    await clearData();
    const profiles = await seedProfiles();
    const chirps = await seedChirps(profiles);
    await seedLikes(profiles, chirps);
    
    console.log('Database seeding completed successfully! 🌱');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSeeding()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}