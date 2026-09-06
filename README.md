# Streakside

Streakside turns daily habits into a friendly game. Players check in on workouts, reading, hydration, or custom goals, collect XP, protect streaks, and compare daily progress with friends.

## Features

- Rewarding one-tap daily check-ins with XP feedback
- Current streaks, weekly rhythm, and progress summaries
- Custom habits with icons, colors, and weekly targets
- Netlify Identity signup and login flows
- Persistent profiles, habits, check-ins, and friendships in Netlify Database
- Friend-code invitations and a daily social leaderboard
- Interactive guest demo with responsive mobile and desktop layouts

## Technology

- TanStack Start and TanStack Router
- React 19 and TypeScript
- Netlify Identity via `@netlify/identity`
- Netlify Database with Drizzle ORM
- Tailwind CSS tooling with a custom CSS design system
- Lucide icons

## Local Development

Install dependencies and start the app:

```bash
pnpm install
pnpm dev
```

The guest demo works locally. Netlify Identity requires a deployed Netlify environment, so use a deploy preview to test account creation, login, and authenticated persistence.

## Database Changes

Edit `db/schema.ts`, then generate a deployable migration:

```bash
pnpm exec drizzle-kit generate --name add_feature_name
```

Do not run migrations directly. Netlify applies files from `netlify/database/migrations/` during deployment.
