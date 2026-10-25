# Lumni Bookings

> Spanish version: [`README.es.md`](README.es.md)

Room booking app for a coworking: customers quote and book rooms, admins manage bookings, and an AI assistant guides customers through the booking.

Requirements are summarized in [`CONTEXT.md`](CONTEXT.md) (source: technical assessment guide, Parts 1 and 2).

> Status: planning. The frontend ([`lumni-bookings-spa`](lumni-bookings-spa)) and API ([`lumni-bookings-api`](lumni-bookings-api)) scaffolds exist; no features yet. This README records decisions so far; the "Guarantees" section will be completed during implementation.

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript (Vite, TanStack Router, Query, Form, Table) |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL |
| ORM / migrations | Prisma (features it does not model, such as the D-05 exclusion constraint, go as custom SQL in migrations) |
| AI provider | Pending (P-01) |
| Email | Resend, behind an `EmailSender` port (D-10) |
| Background jobs | `@nestjs/schedule`: an in-process scheduled task that processes the email outbox (D-08) |

## Decisions taken

Requirements stated explicitly in the guide are specifications and live in [`CONTEXT.md`](CONTEXT.md), not here.

| ID | Decision | Rationale | Source |
|----|----------|-----------|--------|
| D-01 | Technical artifacts (code, docs, UI copy) are written in English. English docs are the source of truth; `*.es.md` files are Spanish translations kept in sync with them. | Single convention across the repo; translations make the docs accessible without creating two competing versions. | Own decision |
| D-02 | Business rules use `America/Bogota` (UTC-5, no DST); timestamps stored as `timestamptz`. | Coworking operates in Colombia; Part 3 reports by Colombia month. | Guide + assumption |
| D-03 | No buffer time between consecutive bookings. | Not mentioned in the guide; can be added later as a room setting. | Assumption |
| D-04 | Only `confirmed` and `completed` bookings block a slot. `draft` and `cancelled` do not. | Drafts are not commitments; availability is re-checked on confirmation. | Guide + assumption |
| D-05 | Double booking is prevented in the database with an exclusion constraint (`btree_gist`) on room + time range for blocking statuses. | An application-level check alone has a race window between "check" and "insert". | Own decision |
| D-06 | Confirmation is idempotent: conditional update `WHERE status = 'draft'`. A repeated confirm returns the already confirmed booking. The price is frozen in `booking_lines` at confirmation and never recalculated afterwards. | Satisfies "no duplicate, no recalculation". | Own decision |
| D-07 | Confirmation email uses a transactional outbox: the outbox row is inserted in the same transaction as the confirmation, with `UNIQUE(booking_id, type)`. | One outbox row per confirmed booking, even with a double concurrent confirmation; confirming never waits for sending. | Own decision |
| D-08 | The outbox is processed by an in-process `@nestjs/schedule` task that claims due rows with `FOR UPDATE SKIP LOCKED` and applies exponential backoff on failure. | State lives in Postgres, so pending emails survive restarts; no extra infrastructure (Redis); safe with more than one instance. | Own decision |
| D-09 | Each email is rendered once, when the outbox row is created, and stored in it (recipient, subject, body). Every attempt sends that stored payload with the idempotency key `booking-confirmation/<booking_id>`. | With the same key and an identical payload, Resend returns the original response without sending again (24 h window): a retry after a lost response tells us for sure whether the email went out, and never duplicates it. | Own decision |
| D-10 | Email sending goes through an `EmailSender` port with two adapters: Resend when `RESEND_API_KEY` is set, and a local adapter (stores the email without sending it) otherwise. The admin view lists the outbox (recipient, subject, status, attempts, last error) and shows the stored email content. | The project runs without credentials, and the guide's "it must be possible to see which emails went out" is met regardless of the provider. | Own decision |
| D-11 | AI assistant rules are enforced in code, not only in the prompt: the model only gets an allowlist of tools (quote, availability, create draft); the customer id comes from the session, never from the model; there are no confirm/cancel tools; every model output is schema-validated. | Prompt injection cannot grant capabilities the model never has. | Own decision |
| D-12 | `rooms` includes a `capacity` field. | The assistant must match requests like "a room for 6 people". | Assumption |
| D-13 | Money is stored as `numeric(14,2)` in COP, and amounts keep their cents: percentages are never rounded. | Aligned with the Part 3 reference schema, which the guide marks as optional for our model; without rounding, the breakdown always adds up to the total exactly. | Own decision |
| D-14 | Additional services have a flat price per booking: projector COP 30,000, coffee service COP 25,000. | The guide does not define them; a flat price keeps step 3 simple (no quantities or headcount). | Own decision |
| D-15 | The duration discount and the Saturday surcharge apply only to the room base. Services are added at their flat price: `total = base − discount + surcharge + services`. | Services do not depend on the duration or the day, so discounting or surcharging them has no business meaning. | Own decision |
| D-16 | A `@nestjs/schedule` task moves `confirmed` bookings to `completed` once `ends_at` has passed. | No manual step for the admin; reuses the scheduler already used for emails (D-08). | Own decision |
| D-17 | Only the admin can cancel a booking, always with a reason. Customers cannot cancel. | The guide only describes cancellation from the admin view. | Own decision |
| D-18 | Drafts are never deleted. A draft keeps its quoted price and when it was quoted (`quoted_at`). It can be confirmed if that price matches the price recomputed with the current room rate and service prices; if prices changed, only while the quote is less than two weeks old, and the quoted price is honored. Otherwise the customer must quote again. | Keeps the full history; a quote stays valid for two weeks, and after that only while prices have not changed. | Own decision |
## Pending decisions

| ID | Question | Notes |
|----|----------|-------|
| P-01 | AI provider and model. | Free choice; key goes in an environment variable. |
| P-02 | Seed data: how many rooms per size, their names and capacities; the two seeded users. | |

## AI usage

This project is developed with the help of an AI assistant. This section records what it was used for.

- **Tool:** Claude (Anthropic), through Claude Code.
- **Scope:** development support only. The AI provider used inside the app (booking assistant) is a separate decision, see P-01.

| Date | Task | Output |
|------|------|--------|
| 2026-10-25 | Read the technical assessment guide and summarize Parts 1 and 2 into a context file, using Part 3 only to align the data model. | [`CONTEXT.md`](CONTEXT.md) |
| 2026-10-25 | Draft this README: decisions taken, pending decisions and the guarantees outline. | [`README.md`](README.md) |
| 2026-10-25 | Select and audit Claude Code skills for the API, and write its architecture rules. | [`.claude/skills/`](.claude/skills), [`lumni-bookings-api/CLAUDE.md`](lumni-bookings-api/CLAUDE.md) |

### Claude Code skills

Project-level skills live in [`.claude/skills/`](.claude/skills) and are committed as the exact copies that were audited. [`skills-lock.json`](skills-lock.json) records each skill's source and content hash. They were installed with the [`skills`](https://github.com/vercel-labs/skills) CLI (`npx skills add <repo> --skill <name> -a claude-code --copy`).

| Skill | Source | Used for |
|-------|--------|----------|
| `nestjs-best-practices` | [`Kadajett/agent-nestjs-skills`](https://github.com/Kadajett/agent-nestjs-skills) | NestJS mechanics: modules, DI, pipes, guards, config, testing module. |
| `clean-ddd-hexagonal` | [`ccheney/robust-skills`](https://github.com/ccheney/robust-skills) | Clean Architecture, tactical DDD, ports and adapters. |
| `prisma-orm-setup` | [`prisma/skills`](https://github.com/prisma/skills) (official) | Prisma ORM 8 setup and PostgreSQL connection. |
| `vite` | [`antfu/skills`](https://github.com/antfu/skills) (Anthony Fu, Vite core team) | Vite 8 config and plugins. |
| `vercel-react-best-practices` | [`vercel-labs/agent-skills`](https://github.com/vercel-labs/agent-skills) (official) | React re-render, bundle and rendering performance. Its Next.js and server rules are disabled in [`lumni-bookings-spa/CLAUDE.md`](lumni-bookings-spa/CLAUDE.md). |
| `tanstack` | [`pedronauck/skills`](https://github.com/pedronauck/skills) (Pedro Nauck) | TanStack Query and Form, which ship no official skills yet. Its Router part is overridden by the official skills. |

TanStack Router and Table skills are official and ship inside the TanStack npm packages, so they always match the installed version. [TanStack Intent](https://github.com/TanStack/intent) (`@tanstack/intent`, a SPA dev dependency) loads them; `intent.skills` in [`lumni-bookings-spa/package.json`](lumni-bookings-spa/package.json) allows only the Router and Table packages, and `pnpm exec intent install` writes the loading guidance into the SPA `CLAUDE.md`.

- **Selection criteria:** the author is an official organization or an identifiable, long-standing maintainer; the content is Markdown only and was read before installing; the installed copy was diffed against the audited copy.
- **Project rules win:** [`lumni-bookings-api/CLAUDE.md`](lumni-bookings-api/CLAUDE.md) overrides the skills where they conflict: no CQRS or Event Sourcing, no `HttpException` in business code, Prisma only in the infrastructure layer. [`lumni-bookings-spa/CLAUDE.md`](lumni-bookings-spa/CLAUDE.md) does the same for the frontend.
- **Updating:** `npx skills update` downloads the author's latest version without checking it against the lock hash. Review the diff before committing it.
- **Pending:** the `prisma-8` skill ships with the Prisma package; add it with `npx prisma skills sync` once Prisma 8 is installed in the API.

## Guarantees

To be completed during implementation, as required by the guide:

- How two concurrent confirmations of the same room and slot result in only one success (see D-05).
- How a repeated confirmation is neither duplicated nor re-priced (see D-06).
- How a confirmed booking produces exactly one email (see D-07 to D-10).
- How the assistant ignores instructions that try to change its rules (see D-11).
