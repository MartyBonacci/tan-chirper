# Development Plan for tan-chirper

## Phase 1: Project Foundation & Setup
1. **Initialize Node.js project** with TypeScript configuration
2. **Setup package.json** with all required dependencies (TanStack Start, Express, Zod v4, etc.)
3. **Configure build tools** (Vite, TypeScript, ESLint, Tailwind CSS)
4. **Create project structure** following the specified architecture:
   - `/app` (TanStack Start frontend)
   - `/server` (Express backend) 
   - `/shared` (shared schemas/types)
   - `/database` (migrations/seeds)
   - `/config` (environment config)

## Phase 2: Database & Backend Foundation
1. **Setup Neon PostgreSQL connection** and environment configuration
2. **Create database schema** with UUIDv7 primary keys:
   - `profiles` table (id, username, display_name, bio, avatar_url, created_at)
   - `chirps` table (id, profile_id, content, created_at)
   - `likes` table (id, profile_id, chirp_id, created_at)
3. **Implement database migrations** and seeding system
4. **Create shared Zod schemas** for validation across frontend/backend

## Phase 3: Backend API Development
1. **Setup Express server** with middleware (CORS, JSON parsing, error handling)
2. **Implement authentication endpoints**: POST `/api/auth/login`, `/api/auth/register`
3. **Build profile management**: GET/POST `/api/profiles`
4. **Create chirp endpoints**: GET/POST `/api/chirps` with 141-character validation
5. **Implement like system**: POST/DELETE `/api/likes`, GET `/api/chirps/:id/likes`

## Phase 4: Frontend Application
1. **Setup TanStack Start** with routing and SSR configuration
2. **Create shared UI components** (Layout, Forms, Buttons, etc.)
3. **Build authentication flow** (Login/Register pages with TanStack Forms + Zod)
4. **Implement profile pages** with editing capabilities
5. **Create chirp feed** with real-time updates using TanStack Query
6. **Add chirp creation form** with character counter and validation
7. **Implement like/unlike functionality** with optimistic updates

## Phase 5: Integration & Polish
1. **Connect frontend to backend APIs** with proper error handling
2. **Add responsive styling** with Tailwind CSS
3. **Implement development scripts** (dev, build, type-check, lint)
4. **Test core user flows** and fix any issues
5. **Add basic error boundaries** and loading states

## Current Status
- [x] Project planning complete
- [x] Phase 1: Project foundation
- [x] Phase 2: Database setup
- [ ] Phase 3: Backend API
- [ ] Phase 4: Frontend app
- [ ] Phase 5: Integration

This plan prioritizes getting the MVP features working end-to-end, following the modern TypeScript patterns specified in CLAUDE.md.