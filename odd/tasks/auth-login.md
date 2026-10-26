# auth-login

Objective: complete login from the React SPA to the NestJS API (httpOnly cookie + JWT), a simple protected home page, and removal of the scaffold `Post` table.
Branch: `main` (user convention: work-unit commits directly on main, no PR). Delivery: commits per work unit. Test runner: none, by user decision (S7); checks are structural (`tsc`, build, lint) plus manual probes (curl, browser).

## Specs

- **S1** — User request, verbatim: "inicia odd para implementar la pagina de autenticación completa desde react hasta nestjs con un home page sencilla pero el login completo, incluye eliminar la tabla inicial de post que trae el scaffold de nest prisma 8 project"
- **S2** — Session: "Cookie httpOnly + JWT (Recommended)" (user choice). JWT signed with `@nestjs/jwt`, stored in an httpOnly, `SameSite=Lax` cookie (`Secure` in production). The SPA never reads the token. The SPA reaches the API through a Vite `/api` proxy, so no CORS.
- **S3** — Data: remove the `Post` model and table. `User` follows `CONTEXT.md` (`users`: id, email, password_hash, role `customer`/`admin`); the scaffold `username`/`name` columns are removed. `customer_id` is deferred until the `customers` table exists. Migration via `migration plan` + `db migrate` (reviewed, committed).
- **S4** — Seed users: "Credenciales demo fijas (Recommended)" (user choice): `customer@lumni.test` and `admin@lumni.test`, demo password `lumni-demo`, documented in the README. Passwords stored as bcrypt hashes (`bcryptjs`, pure JS, cost 12; changed from `scrypt` in L9). Resolves P-02 for users only.
- **S5** — API endpoints under the global prefix `/api`:
  - `POST /api/auth/login` `{ email, password }` → `200` `{ id, email, role }` + session cookie; invalid body → `400`; wrong email or password → `401` `"Invalid email or password"` (same message for both, no user enumeration).
  - `POST /api/auth/logout` → `204`, clears the cookie.
  - `GET /api/auth/me` → `200` `{ id, email, role }`, or `401` without a valid session.
  - Server-side input validation (CONTEXT "Technical minimums") with explicit zod schema pipes (`tsx` emits no decorator metadata, so class-validator's `ValidationPipe` cannot see DTO types).
  - `JWT_SECRET` required at boot. API default port `3001` (the SPA dev server owns `3000`).
- **S6** — SPA: `/login` page following `design/Login.dc.html` (email, password, "Sign in", "Demo accounts" with "Continue as customer" / "Continue as admin" calling the same login with the demo credentials); `/` simple home behind an auth guard (shows the signed-in email and role, "Sign out"); unauthenticated visits redirect to `/login` and return after sign-in; TanStack Query wired into the router context.
- **S7** — No tests. User, verbatim: "No agregar tests en nigun odd, luego cubro los tests de todo el proyecto".
- **S9** — User, verbatim: "No ejecutes los comandos de prisma, eso me lo dejas a mi para hacerlo manual". The user runs contract emit, migration plan/apply and the seed.
- **S8** — The scaffold `users` sample (`GET /users`, `src/prisma/users.ts`, `PrismaService.listUsers`, lazy seed) is replaced by the auth feature (`src/auth/`, thin: `http` + `infrastructure`, per `lumni-bookings-api/CLAUDE.md`). *Assumption:* `GET /users` is removed because it publicly lists users.

## Tasks

| ID | Specs | Route | Status | Evidence |
|----|-------|-------|--------|----------|
| T1 | S3 | inline | done | L8, L10; commit 3bb8db4 |
| T2 | S4, S8 | inline | done | L5, L9, L10; commit 3bb8db4 |
| T3 | S2, S5, S8 | inline | done | L5, L10; commit 3bb8db4 |
| T4 | S2, S6 | delegated (parallel with T1–T3: disjoint surface `lumni-bookings-spa/`) | done | L6, L11; commit 4398f6a |
| T5 | S4, S5 | inline | done except `.env.example` (left to the user) | L7, L10, L11 |

- T1: contract (drop `Post`, reshape `User`, `role` enum), emit, plan migration, review, apply to local DB. Risk: item 1.
- T2: seed script with hashed demo users; remove scaffold `users` sample.
- T3: `auth` feature (login, logout, me, guard, cookie, zod pipe), global prefix, port, env. Risk: item 2.
- T4: SPA login, guarded home, Query wiring, proxy.
- T5: docs (README + `.es.md`, API `CLAUDE.md`, `.env.example`), end-to-end manual probe, commits.

## Log

- **L1** (2026-10-25) — User request, verbatim: "inicia odd para implementar la pagina de autenticación completa desde react hasta nestjs con un home page sencilla pero el login completo, incluye eliminar la tabla inicial de post que trae el scaffold de nest prisma 8 project"
- **L2** (2026-10-25) — Decisions asked one at a time: session "Cookie httpOnly + JWT (Recommended)"; tests "No agregar tests en nigun odd, luego cubro los tests de todo el proyecto"; seed "Credenciales demo fijas (Recommended)".
- **L3** (2026-10-25) — Findings: local DB `lumni-db` does not exist yet (`migration status`: `DRIVER.CONNECTION_FAILED`); no `db` ref, so the plan needs `--from` the init migration. Forecast ~700 authored lines (API ~350, SPA ~350). Next: T1 inline, T4 in parallel.
- **L4** (2026-10-25) — Before S9 arrived, ran `contract emit` and `migration plan --from 20261025T2334_init --name auth_users --delete Post --delete User.name --delete User.username` → `migrations/app/20261026T0210_auth_users` (DROP TABLE Post; drop name/username; add passwordHash, role + CHECK). Not applied. Note: `role` is added NOT NULL without default, so the apply fails if the old scaffold users (alice/bob/carol, lazily seeded by `GET /users`) exist in the target DB.
- **L5** (2026-10-25) — Added `@nestjs/jwt`, `cookie-parser`, `zod`, `@types/cookie-parser`, `@types/express` (last one with `--ignore-scripts` to skip `prisma skills sync`). `src/auth/` (controller, session guard, zod pipe, cookie options, AuthService, scrypt hasher), global prefix `/api`, cookie-parser, default port 3001, `pnpm db:seed`; removed `src/users`, `src/prisma/users.ts`. Checks: `tsc --noEmit` exit 0; `pnpm build` ok; boot probe: `/api/auth/me` 401 without and with forged cookie, login bad body 400 with field errors, logout 204 clearing cookie, `/api/users` 404. Reading `.env` and writing `.env.example` are denied: user adds `JWT_SECRET` and `PORT=3001`.
- **L6** (2026-10-25) — T4 writer: `src/auth/{api,queries,redirect}.ts`, `routes/login.tsx`, `routes/_authenticated.tsx` + `_authenticated/index.tsx`, Query in router context, `/api` proxy to 3001, removed `router.tsx` and template home. tsc, lint, build ok (parent re-ran tsc: exit 0). `pnpm check` fails only on 79 pre-existing files. Known gap: cached user is not re-checked when the cookie expires while the tab stays open.
- **L7** (2026-10-25) — Docs: README + README.es.md D-19 (session), D-20 (demo users), P-02 narrowed; API CLAUDE.md (auth feature, `db:seed`). Next: user creates `lumni-db`, applies migration, runs seed, adds env vars; then e2e login probe, independent verifier (Risk items 1, 2, 5), commits on main.
- **L8** (2026-10-25) — User, verbatim: "pero las migraciones anteriores de post y demas no es necesario". Decision: drop the whole `migrations/` folder (scaffold `init` with `Post` included) and plan a single fresh `init` from the empty database; valid because no database has applied the old `init`. The user deletes the folder and runs `contract:emit` + `migration plan --name init` + `migrate` + `db:seed` manually (S9).
- **L9** (2026-10-25) — User asked "Hashpassword no puede ser un simple bcrypt?", then "sí, pasalo a bcryptjs". `password-hasher.ts` now uses `bcryptjs` 3.0.3 (bundled types, installed with `--ignore-scripts`), cost 12, precomputed dummy hash for unknown emails. README D-19 updated in both languages. Seed must run after this change.
- **L10** (2026-10-25) — User: "funciona". User regenerated `migrations/app/20261026T0221_init` and seeded. E2E probe (API on 3911 against `lumni-db`): wrong password and unknown email both `401 "Invalid email or password"`; customer login with ` Customer@Lumni.test ` → 200 + `lumni_session` (HttpOnly, SameSite=Lax, Max-Age=28800); `/me` 200; admin login 200; logout 204 then `/me` 401. Tailwind was already in the SPA scaffold (commit 7e06415); T4 only added `@theme` tokens. Independent verifier launched (items 1, 2, 5). Next: verifier verdict, then commits on main.
- **L11** (2026-10-25) — Independent verifier: no blockers; S1–S5, S7–S9 met, S6 met by code reading. Fixed advisory 1: `safeRedirect` now rejects control characters, spaces and backslashes (probe: `/	/evil.com`, `/\evil.com`, `//evil.com`, `https://evil.com` → undefined; `/bookings?x=1` kept). Open advisories: cached `me` not refetched on cookie expiry; stateless logout (D-19); no minimum `JWT_SECRET` length; passwords >72 bytes truncated by bcrypt; Composer `service.ts` does not provide `JWT_SECRET`; `/auth/me` 5xx shows an error page. Commit `3bb8db4` (API + docs): RDD assess high (auth, migration), user chose "Omitir esta vez" → declined_this_candidate. `.env.example` excluded from commits: its diff cannot be read (deny rule), the user commits it.
- **L12** (2026-10-25) — Commit `4398f6a` (SPA): RDD assess high (auth). User, verbatim: "Omitir toda revision" → declined_this_candidate, then `gentle-ai review mode disable` (global off). Feature closed; `.env.example` left uncommitted for the user.
