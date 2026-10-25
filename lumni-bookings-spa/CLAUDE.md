# lumni-bookings-spa — Frontend rules

Client-only React SPA (Vite 8, TanStack Router with file-based routes). It talks to the NestJS API in [`../lumni-bookings-api`](../lumni-bookings-api); there is no SSR and no server code here. Business rules live in [`../CONTEXT.md`](../CONTEXT.md).

Run every `pnpm` and `intent` command from `lumni-bookings-spa/`, not from the repository root: this folder is the pnpm workspace root. Only the TanStack Router and Table packages are allowed as skill sources (`intent.skills` in `package.json`); Query and Form ship no official skills yet.

<!-- intent-skills:start -->
## Skill Loading

Use the repository’s installed Intent. If it is unavailable, report the missing dependency instead of downloading a replacement.
Before editing files for a substantial task:
- Run `pnpm exec intent list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm exec intent load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

## Skill precedence

Third-party skills live in [`.claude/skills/`](.claude/skills) as audited copies, recorded in [`skills-lock.json`](skills-lock.json). The official TanStack skills stay inside their packages and load through Intent.

These rules override the installed skills when they conflict:

- TanStack Router and Table: the official package skills loaded through Intent win over any other skill.
- `tanstack` (community skill): use it for TanStack Query and TanStack Form, which have no official skills. Ignore its Router references; the official Router skills cover routing.
- `vite`: use it for config and plugins. The project is on Vite 8.
- `vercel-react-best-practices`: apply its client-side rules (`rerender-*`, `bundle-*`, `js-*`, `client-*`, `advanced-*`, and `rendering-*`). Ignore the rules that assume Next.js or a server:
  - `server-*` and `async-api-routes`: there is no server in this app.
  - `rendering-hydration-*`: there is no SSR, so nothing hydrates.
  - `client-swr-dedup`: data fetching uses TanStack Query, not SWR.
  - Next.js APIs (`next/dynamic`, `next/script`, and similar): use `React.lazy` or the router's automatic code splitting instead.

## Data and URL state

- Server data goes through TanStack Query (installed; the `QueryClient` is not wired into the router yet). Route loaders call `queryClient.ensureQueryData`, and components read with `useSuspenseQuery` (see the `@tanstack/react-router#compositions/router-query` skill).
- Shareable UI state (selected room, date, filters) lives in search params validated with `validateSearch`, not in component state.

## Commands

`pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm format`, `pnpm check`.
