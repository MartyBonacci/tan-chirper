# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

tan-chirper is a Twitter-like social media application with 141 character limit for posts. This is a modern, type-safe full-stack TypeScript application.

## Tech Stack

**Frontend (TanStack Start)**
- TanStack Start - Full-stack React framework with SSR
- TanStack Router - Type-safe routing with search param validation
- TanStack Forms + Zod v4 - Type-safe form handling with validation
- TanStack Query - Server state management and API synchronization
- Tailwind CSS - Utility-first styling
- TypeScript - Type safety throughout

**Backend (Express)**
- Express.js - REST API server
- Zod v4 schemas - Shared validation between frontend/backend
- TypeScript - End-to-end type safety
- UUIDv7 - Time-sortable unique identifiers for all entities

**Database**
- Neon PostgreSQL - Serverless PostgreSQL with branching and autoscaling
- UUIDv7 primary keys - Chronologically sortable for efficient feeds

## Project Structure

```
tan-chirper/
├── app/                    # TanStack Start frontend
│   ├── routes/            # File-based routing
│   ├── components/        # React components
│   ├── hooks/            # TanStack Query hooks
│   ├── lib/              # Utilities, API clients
│   └── styles/           # Tailwind config and globals
├── server/               # Express API backend
│   ├── routes/           # API endpoints
│   ├── middleware/       # Auth, validation, error handling
│   ├── db/               # Database queries and connection
│   └── types/            # Backend-specific types
├── shared/               # Shared between frontend/backend
│   ├── schemas/          # Zod schemas for validation
│   └── types/            # Shared TypeScript types
├── database/
│   ├── migrations/       # Database migrations
│   ├── seeds/           # Development data
│   └── schema.sql       # Database schema definitions
└── config/              # Environment and build config
```

## Development Commands

- `npm run dev` - Start development servers (frontend + backend)
- `npm run build` - Production build
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed development data
- `npm run type-check` - TypeScript validation
- `npm run lint` - ESLint checking

## Architecture Patterns

**Shared Validation**
- Zod schemas in `/shared/schemas/` used by both frontend forms and backend API validation
- TypeScript types generated from schemas for end-to-end type safety

**API Integration**
- Express REST endpoints: `/api/profiles`, `/api/chirps`, `/api/likes`, `/api/auth`
- TanStack Query for data fetching with caching and optimistic updates
- Shared error handling patterns

**MVP API Endpoints**
- `GET/POST /api/profiles` - Profile management
- `GET/POST /api/chirps` - Chirp CRUD operations
- `POST/DELETE /api/likes` - Like/unlike chirps
- `GET /api/chirps/:id/likes` - Get like count and user's like status
- `POST /api/auth/login` - Authentication
- `POST /api/auth/register` - User registration

**Form Handling**
- TanStack Forms with Zod validation for real-time feedback
- Same schemas used for client and server validation

**Database Schema (MVP)**
- `profiles` table: id (UUIDv7), username, display_name, bio, avatar_url, created_at
- `chirps` table: id (UUIDv7), profile_id, content, created_at
- `likes` table: id (UUIDv7), profile_id, chirp_id, created_at
- UUIDv7 primary keys provide chronological sorting for feeds
- Simple foreign key relationships with CASCADE deletes
- Unique constraint on (profile_id, chirp_id) in likes table
- Consider query builder like Drizzle ORM for type safety
- Connection pooling with Neon

## MVP Features

**Core Functionality**
- User profiles (username, display name, bio, avatar)
- Chirp creation and display (141 character limit)
- Like/unlike chirps
- Basic feed showing recent chirps
- Simple profile pages

**Authentication**
- User registration and login
- Profile management

## UUIDv7 Implementation

**Benefits**
- Time-sortable: Natural chronological ordering without separate timestamp columns
- Efficient indexing: Better database performance for time-based queries
- Global uniqueness: No collision concerns across distributed systems

**Usage Pattern**
```typescript
import { uuidv7 } from 'uuidv7';

// Creating new entities
const newChirp = {
  id: uuidv7(),
  profile_id: profileId,
  content: chirpContent,
  created_at: new Date()
};
```