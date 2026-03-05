# Technology Stack

## Runtime & Language
- **Node.js**: 22 (specified in `.nvmrc`)
- **TypeScript**: 5.x (strict mode enabled)
  - Target: ES2017
  - Module: ESNext with bundler resolution
  - Path aliases configured: `@/*` → `./src/*`
- **Module system**: ESM via Next.js and bundler resolution

## Framework
- **Next.js**: 16.1.6
  - App Router with nested layouts and route groups
  - Turbopack enabled for faster development builds (`pnpm dev --turbopack`)
  - Server/Client component split with RSC (React Server Components) by default
  - Output mode: `standalone` for containerization
  - TypeScript integration via Next.js plugin

## Dependencies

### Core Framework & UI
- **react**: 19.2.3 (latest stable)
- **react-dom**: 19.2.3
- **next**: 16.1.6
- **next-themes**: 0.4.6 (theme switching support)

### Forms & Validation
- **react-hook-form**: 7.71.2 (form state management)
- **@hookform/resolvers**: 5.2.2 (Zod integration)
- **zod**: 4.3.6 (schema validation and type inference)

### UI Components
- **@radix-ui**: 1.4.3 (headless component library)
- **lucide-react**: 0.575.0 (icon library)
- **sonner**: 2.0.7 (toast notifications)
- **class-variance-authority**: 0.7.1 (class name utilities)
- **clsx**: 2.1.1 (conditional className helper)
- **tailwind-merge**: 3.5.0 (Tailwind CSS class merging)
- **react-day-picker**: 9.13.2 (date picker component)

### State Management & Date Handling
- **date-fns**: 4.1.0 (date manipulation)
- **ulid**: 3.0.2 (sortable unique IDs)

### Database & ORM
- **drizzle-orm**: 0.45.1 (TypeScript ORM)
- **better-sqlite3**: 12.6.2 (embedded SQLite database)
  - Configured as server-external package in Next.js

### Authentication & Security
- **bcryptjs**: 3.0.3 (password hashing)
- Custom session management using HMAC-SHA256 signing with HTTP-only cookies

### External Services & APIs
- **resend**: 6.9.3 (email delivery service)
- **@upstash/redis**: 1.36.3 (distributed Redis cache)
- **@upstash/ratelimit**: 2.0.8 (rate limiting with Redis fallback)
- **@sentry/nextjs**: 10.40.0 (error monitoring and observability)

## Dev Dependencies

### Build Tools & Testing
- **drizzle-kit**: 0.31.9 (database schema migrations and CLI)
- **tsx**: 4.21.0 (TypeScript execution for scripts)
- **@playwright/test**: 1.58.2 (E2E testing)

### Styling
- **@tailwindcss/postcss**: 4 (Tailwind CSS engine)
- **tailwindcss**: 4 (Tailwind CSS framework)

### Linting & Type Checking
- **eslint**: 9 (code quality)
- **eslint-config-next**: 16.1.6 (Next.js linting rules)
- **@types/node**: 20.x (Node.js type definitions)
- **@types/react**: 19.x (React type definitions)
- **@types/react-dom**: 19.x (React DOM type definitions)
- **@types/better-sqlite3**: 7.6.13 (better-sqlite3 type definitions)

## Configuration

### Build & Server Config
- **`next.config.ts`**: Next.js configuration with Sentry integration
  - Server-external packages: `better-sqlite3`
  - Output: `standalone` for Docker/production deployment
  - Dev indicators disabled
  - Powered-by header removed for security

### TypeScript Config
- **`tsconfig.json`**: Strict TypeScript configuration
  - Path aliases for clean imports
  - Incremental builds enabled
  - JSX: React 17+ (react-jsx)

### Database Config
- **`drizzle.config.ts`**: Drizzle ORM configuration
  - Dialect: SQLite
  - Schema location: `./src/lib/db/schema.ts`
  - Migrations output: `./drizzle/`
  - Database path: `./quicksupply.db` or `DATABASE_URL` env var

### Styling & UI Config
- **`postcss.config.mjs`**: PostCSS configuration with Tailwind CSS 4
- **`components.json`**: shadcn/ui configuration
  - Style: New York
  - Tailwind config with CSS variables
  - Icon library: Lucide
  - Base color: Neutral
  - RSC mode enabled

### Testing Config
- **`playwright.config.ts`**: E2E test configuration
  - Test directory: `./e2e/`
  - Browser: Chromium (Desktop)
  - Base URL: `http://localhost:3000` or `BASE_URL` env var
  - Reporter: HTML
  - CI: 2 retries with 1 worker

### Linting
- **`eslint.config.mjs`**: ESLint configuration using flat config
  - Extends: Next.js core web vitals + TypeScript rules
  - Ignores: `.next/`, test artifacts, build outputs

### Environment Config
- **`.env.example`**: Template for environment variables
  - Database configuration
  - Authentication secrets
  - Email service (Resend)
  - Rate limiting (Upstash Redis)
  - Error monitoring (Sentry)
  - Application URLs

### Package Manager
- **`pnpm`**: Package manager with workspace support
  - `pnpm-workspace.yaml`: Workspace configuration
  - `pnpm-lock.yaml`: Dependency lock file
  - Built-in dependencies: `better-sqlite3`, `esbuild`

## Scripts

### Development & Build
- `pnpm dev`: Start development server with Turbopack
- `pnpm build`: Production build
- `pnpm start`: Start production server

### Database
- `pnpm db:generate`: Generate drizzle migrations from schema
- `pnpm db:migrate`: Apply pending migrations
- `pnpm db:seed`: Populate database with seed data
- `pnpm db:reset`: Reset database and reseed
- `pnpm db:clear-requests`: Clear supply requests
- `pnpm db:seed-demo`: Seed demo teacher data
- `pnpm db:studio`: Open Drizzle Studio GUI

### Testing & Quality
- `pnpm lint`: Run ESLint
- `pnpm e2e`: Run Playwright E2E tests
- `pnpm e2e:ui`: Run Playwright tests in UI mode
- `pnpm e2e:routes`: Check route availability

### Setup
- `pnpm setup`: Run migrations and seed in one command
