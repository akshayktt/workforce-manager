# WorkForce

## Overview

WorkForce is a labor management application built with Expo (React Native) on the frontend and Express.js on the backend. It enables organizations to manage workforce allocation across projects through a role-based system with three user types: **admins** (approve/reject labor requests), **supervisors** (create projects and request laborers), and **labor** workers (view their assignments). The app runs as a cross-platform mobile/web application with a PostgreSQL-backed API server.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)
- **Framework**: Expo SDK 54 with expo-router for file-based routing
- **Navigation**: File-based routing via `app/` directory. Routes include login (`index.tsx`), role-specific dashboards (`admin.tsx`, `supervisor.tsx`, `labor.tsx`), and modal screens (`add-project.tsx`, `request-labor.tsx`)
- **State Management**: TanStack React Query for server state; React Context (`AuthProvider`) for authentication state
- **Fonts**: Inter font family loaded via `@expo-google-fonts/inter`
- **Platform Support**: iOS, Android, and Web. Platform-specific adjustments (e.g., safe area insets) are handled inline
- **API Communication**: Custom `apiRequest` helper in `lib/query-client.ts` that constructs URLs using `EXPO_PUBLIC_DOMAIN` environment variable and uses `expo/fetch` with credentials

### Backend (Express.js)
- **Runtime**: Node.js with TypeScript (compiled via `tsx` in dev, `esbuild` for production)
- **API Server**: Express 5 running on port 5000, serving REST API endpoints under `/api/`
- **Authentication**: Session-based auth using `express-session` with `connect-pg-simple` for PostgreSQL session storage. Sessions track `userId` and `role`
- **Password Hashing**: bcryptjs
- **CORS**: Dynamic origin handling supporting Replit domains and localhost for development
- **Role-Based Access Control**: Middleware functions `requireAuth` and `requireRole` protect API endpoints
- **Production Serving**: In production, serves static Expo web build; in development, proxies to Expo dev server

### Database (PostgreSQL + Drizzle ORM)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema validation
- **Schema** (`shared/schema.ts`):
  - `users` — id (UUID), username, password (hashed), fullName, role (enum: admin/supervisor/labor), skills (text array)
  - `projects` — id (UUID), name, description, supervisorId (FK to users), createdAt
  - `laborRequests` — id (UUID), projectId (FK), laborId (FK), supervisorId (FK), startDate, endDate, status (enum: pending/approved/rejected), createdAt
- **Migrations**: Managed via `drizzle-kit push` (push-based, no migration files needed)
- **Storage Layer**: `server/storage.ts` implements `IStorage` interface with `DatabaseStorage` class, includes labor availability checking and search by username/skill
- **Seeding**: `seedDatabase` function exists for initial data population

### Shared Code
- `shared/schema.ts` contains database schema and Zod validation schemas, shared between frontend and backend via TypeScript path aliases (`@shared/*`)

### Build & Deployment
- **Dev Mode**: Two processes — `expo:dev` for the frontend dev server and `server:dev` for the Express API
- **Production Build**: Expo static web build (`expo:static:build`) + esbuild for server (`server:build`), run with `server:prod`
- **Environment**: Relies on Replit environment variables (`REPLIT_DEV_DOMAIN`, `DATABASE_URL`, `SESSION_SECRET`)

## External Dependencies

### Database
- **PostgreSQL** — Primary data store. Required via `DATABASE_URL` environment variable. Used for both application data (users, projects, labor requests) and session storage (`connect-pg-simple`)

### Key NPM Packages
- **drizzle-orm** + **drizzle-kit** — Database ORM and migration tooling
- **express** v5 — HTTP server framework
- **express-session** + **connect-pg-simple** — Session management with PostgreSQL backing
- **bcryptjs** — Password hashing
- **@tanstack/react-query** — Server state management on the client
- **expo-router** — File-based navigation
- **expo-haptics** — Haptic feedback for native platforms
- **expo-image-picker**, **expo-location** — Native device capabilities (installed but usage may be partial)
- **zod** + **drizzle-zod** — Runtime schema validation

### Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (required)
- `SESSION_SECRET` — Secret for session signing (falls back to default)
- `EXPO_PUBLIC_DOMAIN` — Domain for API requests from the frontend
- `REPLIT_DEV_DOMAIN` — Replit development domain for CORS and proxy configuration