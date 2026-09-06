# Streakside Architecture

Streakside is a playful habit tracker built with TanStack Start, React 19, Netlify Identity, and Netlify Database. The public home route doubles as a polished interactive demo; authenticated players receive persistent habits, check-ins, XP, and friend connections.

## Key Directories

- `src/routes/` contains file-based TanStack Router pages and the root document.
- `src/server/` contains TanStack Start server functions. Database access stays here and must never move into browser components.
- `src/middleware/` contains reusable Netlify Identity middleware for server functions.
- `src/lib/` contains shared types and browser-side Identity state.
- `src/components/` contains cross-route UI infrastructure such as auth callback handling.
- `db/` contains the Drizzle schema and Netlify Database client.
- `netlify/database/migrations/` contains generated migrations that Netlify applies during deploys.
- `public/` contains static assets such as the product favicon.

## Data Model

- `profiles` mirrors a Netlify Identity user and stores social/game metadata.
- `habits` belongs to a profile and defines a weekly target, icon, and color.
- `checkins` records one completion per habit per calendar date.
- `friendships` stores accepted two-way connections created with friend codes.

## Conventions

- Use strict TypeScript and type-only imports where applicable.
- Keep route UI in React components and persistent mutations in `createServerFn` handlers.
- Every schema change in `db/schema.ts` requires `pnpm exec drizzle-kit generate --name <imperative_name>`.
- Use `@netlify/identity`; never add the deprecated Identity widget or GoTrue client.
- Preserve the tactile visual language: dark ink, warm paper, solid accent colors, offset shadows, expressive display type, and restrained motion.
- Prefer CSS custom properties in `src/styles.css` over scattered hard-coded design values.
- Guest interactions are intentionally temporary. Authenticated state must always come from Netlify Database.

## Non-Obvious Decisions

- Authentication is unavailable in ordinary localhost environments because Netlify Identity requires a deployed Netlify runtime. Use a deploy preview for end-to-end auth testing.
- New profiles receive three starter habits on first authenticated dashboard load.
- Friend codes connect players immediately to keep the invitation flow lightweight.
- Daily dates are stored as `YYYY-MM-DD` strings so check-ins represent a player-facing calendar day rather than a timestamp.
