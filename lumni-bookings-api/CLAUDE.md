# lumni-bookings-api — Architecture rules

NestJS 12 API with Prisma ORM 8 and Prisma Composer, following Clean Architecture with tactical DDD. Business rules live in [`../CONTEXT.md`](../CONTEXT.md); decisions (D-xx) live in [`../README.md`](../README.md).

Run every `pnpm` and `prisma` command from `lumni-bookings-api/`, not from the repository root.

## Skills

Skills live in [`.claude/skills/`](.claude/skills):

- `prisma-8`, `prisma-composer-core-concepts`, `prisma-platform-core-concepts`: official, shipped inside the Prisma packages. `pnpm install` refreshes them (`postinstall` runs `prisma skills sync`); `skills.agents` in `prisma.config.ts` limits them to Claude. Never edit them by hand.
- `nestjs-best-practices`, `clean-ddd-hexagonal`: third-party, audited, recorded in [`skills-lock.json`](skills-lock.json).

When they conflict, these rules win, then the official Prisma skills, then the third-party ones:

- `prisma-8`: the only source for contracts, migrations, and queries. Prisma 8 changed the whole API; never apply Prisma 7 patterns (`schema.prisma`, `PrismaClient`, `prisma migrate dev`).
- `clean-ddd-hexagonal`: use its layering, aggregates, value objects, and ports/adapters guidance. Ignore its folder naming and its CQRS / Event Sourcing material (see below).
- `nestjs-best-practices`: use it for framework mechanics (modules, DI, pipes, guards, config). Ignore its TypeORM examples and the rules that put HTTP or ORM concerns in business code.
- `prisma-composer-core-concepts`, `prisma-platform-core-concepts`: only for running the app locally with Composer or deploying it.

## Out of scope: CQRS and Event Sourcing

- Do not introduce CQRS: no command/query buses, no `@nestjs/cqrs`, no separate read and write models. A use case is one class with one `execute` method.
- Do not introduce Event Sourcing: state is stored as current rows in PostgreSQL, never rebuilt from an event log.
- Domain events are allowed only as plain in-process signals when a rule needs them. The confirmation email uses the transactional outbox table (D-08), not an event store.

## Layout (screaming architecture)

Organize by feature first, then by layer:

```
src/
  <feature>/                 # e.g. bookings, rooms
    domain/                  # entities, value objects, domain errors, repository ports
    application/             # use cases and the ports they need
    infrastructure/          # Prisma repositories, external adapters (Resend, AI)
    http/                    # controllers, request/response DTOs, exception filters
    <feature>.module.ts      # wires ports to adapters
  prisma/                    # Prisma contract, generated types, db client, seed (persistence only)
  shared/                    # cross-feature kernel (clock, ids, base errors) only
module.ts, service.ts        # Prisma Composer app definition (scaffold, root level)
migrations/                  # Prisma 8 migrations (generated, then reviewed)
```

File names are kebab-case (`create-booking.use-case.ts`, `booking.entity.ts`). The starter `User`/`Post` models, `src/users.*`, `src/prisma/users.ts`, and `src/prisma.service.ts` are scaffold samples: replace them with the real features instead of building on them.

## Dependency rule

- `domain` imports nothing from NestJS, Prisma, or any other layer.
- `application` imports only `domain` and its own ports. No `@nestjs/*` imports except `@Injectable()` and `@Inject()`.
- `infrastructure` and `http` depend inward; nothing depends on them.
- The Prisma client (`db` from `src/prisma/db.ts`) and the generated contract types are used only inside `infrastructure`. Map rows to domain entities at the repository boundary; never return Prisma types from a port.

## Ports and dependency injection

- Define ports as `abstract class` (no `I` prefix), e.g. `export abstract class BookingRepository`. TypeScript interfaces are erased at runtime and cannot be Nest injection tokens.
- Always inject with an explicit token: `constructor(@Inject(BookingRepository) private readonly bookings: BookingRepository)`. `pnpm dev` runs through `tsx` (esbuild), which does not emit the decorator metadata Nest needs to inject by type alone; the scaffold injects with explicit tokens everywhere.
- Bind adapters in the feature module: `{ provide: BookingRepository, useClass: PrismaBookingRepository }`.
- Existing ports: `EmailSender` (D-10).

## TypeScript and modules

- The project is ESM (`"type": "module"`) with `verbatimModuleSyntax`: import types with `import type`.

## Errors

- `domain` and `application` throw domain errors (subclasses of a shared `DomainError`), never `HttpException` or its subclasses.
- Map domain errors to HTTP status codes in an exception filter inside `http/`.

## Domain rules to respect

- Business time zone is `America/Bogota`; timestamps are stored as `timestamptz` (D-02). Inject a clock port instead of calling `new Date()` in domain or application code.
- Slot overlap is enforced by a PostgreSQL exclusion constraint (D-05). Prisma 8 cannot model it in the contract: add it in a migration with the `rawSql(...)` operation (see `prisma-8`, `references/migrations.md`). The domain check is a fast path, not the only guard.
- Do not invent business rules. If a rule is missing from `CONTEXT.md`, name the gap and ask.

## Testing

- No test runner is configured yet: the Prisma 8 scaffold ships none. Choosing one is pending; do not add one without asking.
- Strategy once it exists: domain with plain unit tests; use cases with in-memory fakes of the ports, without the Nest testing module; Prisma repositories and HTTP with integration tests against a real PostgreSQL.

## Commands

- `pnpm dev`: run with `tsx watch` against `DATABASE_URL` (see `.env.example`).
- `pnpm dev:composer`: build and run with Composer, which provides a local Prisma Postgres and applies the committed migrations.
- `pnpm build`: bundle with `tsdown` into `dist/`.
- `pnpm contract:emit`, `pnpm migration:plan`, `pnpm migrate`, `pnpm migration:status`: Prisma 8 contract and migration workflow.
- `pnpm deploy`: deploys to Prisma Compute. Never run it without explicit approval.
