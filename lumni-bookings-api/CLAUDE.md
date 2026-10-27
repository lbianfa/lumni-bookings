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
- Domain events are allowed only as plain in-process signals when a rule needs them. The confirmation email uses the transactional outbox table (D-07), not an event store; an in-process `@nestjs/event-emitter` event starts its send job after the commit (D-08).

## Layout (screaming architecture)

Organize by feature first, then by layer. Business feature modules live in `src/features/`; cross-cutting code (auth, shared kernel, persistence, app bootstrap) stays at the root of `src/`:

```
src/
  features/
    <feature>/               # e.g. quotes, bookings, rooms, and the internal modules
      domain/
        entities/            #   entities
        exceptions.ts        #   the feature's domain errors
        repos/               #   repository ports (abstract classes), named `<entity>.repo.ts`
        core/                #   domain logic and value objects (pricing, availability, time slot, business time)
      application/           # use cases and the ports they need
        helpers/             #   injectable services several use cases share (no `execute`), e.g. access checks, quoting
      infrastructure/        # Prisma repositories (`prisma-<entity>.repo.ts`), external adapters (Resend, AI)
      http/                  # controllers, guards, exception filters; request/response DTOs in http/dtos/
      jobs/                  # in-process jobs: event listeners and the adapters that start them (e.g. emails)
      <feature>.module.ts    # wires ports to adapters
  auth/                      # session login, logout and guards used by every feature (D-19, D-20)
  prisma/                    # Prisma contract, generated types, db client, seed (persistence only)
  shared/                    # cross-feature kernel (clock, unit of work, ids, base errors), their adapters, and http/ helpers (pipes, filters, money formatting) only
  main.ts, app.module.ts     # bootstrap; `swagger.ts` builds the API docs (D-26); `prisma.module.ts` and `prisma.service.ts` wire the global Prisma client
module.ts, service.ts        # Prisma Composer app definition (scaffold, root level)
migrations/                  # Prisma 8 migrations (generated, then reviewed)
```

File names are kebab-case (`create-booking.use-case.ts`, `booking.entity.ts`). `auth` is a thin cross-cutting module at the root of `src/` (`http` + `infrastructure`): login, logout, and the current user (D-19, D-20). `quotes` has full layers (`POST /api/quotes`). `rooms` and `bookings` own their entity's repository: `RoomsModule` and `BookingsModule` export `RoomRepository` and `BookingRepository`, and `QuotesModule` imports both. `rooms` has full layers too: `GET /api/rooms` goes through the `ListRooms` use case. `bookings` has full layers and the booking endpoints: the flow's writes under `/api/bookings`, the customer's reads under `/api/my-bookings` (`MyBookingsController`), and the admin's reads under `/api/bookings` (`AdminBookingsController`, behind `SessionGuard` and `AdminGuard`, D-28); since `QuotesModule` imports `BookingsModule`, `BookingsModule` provides `QuoteRoom` itself rather than importing `QuotesModule` back.

Internal modules: the parts of the booking that are separate tables live in their own feature folders, without `http` or `application`: `customers`, `services`, `booking-lines`, `booking-services`. Each has `domain/` (entity and repository port) and `infrastructure/` (Prisma adapter), and its module exports only the repository. Only `bookings` imports them. Writes that span several of these repositories run in one transaction through the `UnitOfWork` port (`src/shared/application/unit-of-work.ts`): `run(work)` hands `work` an opaque `Transaction`, use cases pass it to every repository call, and Prisma adapters query through `ormOf(prisma, tx)` (`src/shared/infrastructure/prisma-unit-of-work.ts`).

## Where to apply the layers

Clean Architecture is applied selectively. Use the full layers only where business rules live; keep everything else thin.

- **Full layers** (`domain`, `application`, `infrastructure`, `http`): features with business rules or swappable infrastructure.
  - `quotes`: price, opening hours, availability and the next free slot.
  - `bookings`: multi-step draft, confirmation, state transitions, price agreed once.
  - The email outbox and its `EmailSender` port (D-08, D-10).
  - The AI booking assistant and its provider port (P-01).
- **Thin** (`http` + `infrastructure`, no `domain` or `application`): plain CRUD and read-only queries with no rules, such as reports. A read that can reuse a full-layer feature's use cases and helpers goes through them instead: the admin booking list shares `BookingSummaries` with My bookings. The controller calls a repository or query that returns the response DTO directly; no entities, no use case, no port.
- A thin feature gets full layers only when a real rule appears. Do not add layers, ports, or mappings "for the future".
- Every port must have a reason: more than one implementation (now or decided), or a dependency the tests must replace (clock, external APIs). No port for a class with a single, stable implementation.

## Dependency rule

- `domain` imports nothing from NestJS, Prisma, or any other layer.
- `application` imports only `domain` and its own ports. No `@nestjs/*` imports except `@Injectable()` and `@Inject()`.
- `infrastructure` and `http` depend inward; nothing depends on them.
- The Prisma client (`db` from `src/prisma/db.ts`) and the generated contract types are used only inside `infrastructure`. Map rows to domain entities at the repository boundary; never return Prisma types from a port.

## Ports and dependency injection

- Define ports as `abstract class` (no `I` prefix), e.g. `export abstract class BookingRepository`. TypeScript interfaces are erased at runtime and cannot be Nest injection tokens.
- Always inject with an explicit token: `constructor(@Inject(BookingRepository) private readonly bookings: BookingRepository)`. `pnpm dev` runs through `tsx` (esbuild), which does not emit the decorator metadata Nest needs to inject by type alone; the scaffold injects with explicit tokens everywhere.
- Bind adapters in the feature module: `{ provide: BookingRepository, useClass: PrismaBookingRepository }`.
- `PrismaModule` (`src/prisma.module.ts`) is global and imported once in `AppModule`. Inject `PrismaService` directly in infrastructure classes; never add it to a feature module's `providers`, which would create a second instance.
- Existing ports: `Clock` (`src/shared/domain`, bound to `SystemClock`); `UnitOfWork` (`src/shared/application`, bound to `PrismaUnitOfWork`); `RoomRepository`, `BookingRepository`, `CustomerRepository`, `ServiceRepository`, `BookingLineRepository` and `BookingServiceRepository` (each in its feature's `domain/repos`), all with Prisma adapters and exported by their feature module. `emails` (full layers; `http` serves the admin's `GET /api/bookings/:id/email`, D-29) owns `OutboxEmailRepository` (with the attempt history) and `EmailJobs` (exported; `ConfirmBooking` queues the email and starts the job after the commit) and `EmailSender` (D-10: `ResendEmailSender` when `RESEND_API_KEY` is set, with `EMAIL_FROM` as sender; `LocalEmailSender` otherwise).
- Money columns go through `toCents` / `toNumeric` (`src/shared/infrastructure/numeric.ts`); Postgres constraint errors are detected with `isDatabaseError` (`src/shared/infrastructure/database-error.ts`) and translated into domain errors in the adapter.

## TypeScript and modules

- The project is ESM (`"type": "module"`) with `verbatimModuleSyntax`: import types with `import type`.

## Errors

- `domain` and `application` throw domain errors (subclasses of a shared `DomainError`), never `HttpException` or its subclasses.
- Map domain errors to HTTP status codes in an exception filter inside `http/`.

## API docs (OpenAPI)

Swagger UI is served at `/api/docs` and the JSON at `/api/docs-json`, only when `NODE_ENV` is not `production` (D-26); `src/swagger.ts` builds the document. Every new or changed endpoint documents itself with `@nestjs/swagger` decorators and the helpers in `src/shared/http/openapi.ts`:

- Controller: `@ApiTags(...)`, plus `@ApiCookieAuth()` when it uses `SessionGuard`. Route: `@ApiOperation({ summary })`, and `@ApiParam({ name, type, format })` for each path parameter (give `type` explicitly: only the `tsdown` bundle has decorator metadata to infer it).
- Request body: `@ApiJsonBody(Dto.schema)`, the same zod schema `ZodValidationPipe` validates with. Keep `@Body(new ZodValidationPipe(Dto))`: `@Body({ schema })` is not documented (swagger reads body parameters from decorator type metadata, which `tsx` does not emit) and would bypass the `400` body clients read.
- Success response: `@ApiOkResponse` / `@ApiCreatedResponse` with `standardSchema: ResponseDto.schema`. Each response DTO declares a module-level zod schema, exposes it as `static readonly schema` and `implements z.infer<typeof schema>`, so TypeScript fails when the class and its docs drift apart.
- Errors: `@ApiError(status, description, schema?)` for each status the route can answer (`badRequestBodySchema` for `400`; feature-specific `409` bodies such as `bookingConflictSchema(...codes)`).
- `swagger-ui-dist` is a direct dependency on purpose: `@nestjs/swagger` loads it at runtime with `require`, which the bundle in `dist/` can only resolve from this package's own `node_modules`. Keep its version equal to the one `@nestjs/swagger` depends on.

## Domain rules to respect

- Business time zone is `America/Bogota`; timestamps are stored as `timestamptz` (D-02). Inject a clock port instead of calling `new Date()` in domain or application code.
- Slot overlap is enforced by a PostgreSQL exclusion constraint (D-05). Prisma 8 cannot model it in the contract: add it in a migration with the `rawSql(...)` operation (see `prisma-8`, `references/migrations.md`). The domain check is a fast path, not the only guard.
- Do not invent business rules. If a rule is missing from `CONTEXT.md`, name the gap and ask.

## Testing

- No test runner is configured yet: the Prisma 8 scaffold ships none. Choosing one is pending; do not add one without asking.
- Strategy once it exists: domain with plain unit tests; use cases with in-memory fakes of the ports, without the Nest testing module; Prisma repositories and HTTP with integration tests against a real PostgreSQL.

## Commands

- `pnpm dev`: run with `tsx watch` against `DATABASE_URL` (see `.env.example`); the API docs are at `http://localhost:3001/api/docs`.
- `pnpm dev:composer`: build and run with Composer, which provides a local Prisma Postgres and applies the committed migrations.
- `pnpm build`: bundle with `tsdown` into `dist/`.
- `pnpm db:seed`: create or reset the two demo users (D-20) and the twelve rooms (D-22).
- `pnpm contract:emit`, `pnpm migration:plan`, `pnpm migrate`, `pnpm migration:status`: Prisma 8 contract and migration workflow.
- `pnpm deploy`: deploys to Prisma Compute. Never run it without explicit approval.
