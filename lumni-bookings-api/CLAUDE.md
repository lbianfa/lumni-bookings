# lumni-bookings-api — Architecture rules

NestJS API following Clean Architecture with tactical DDD. Business rules live in [`../CONTEXT.md`](../CONTEXT.md); decisions (D-xx) live in [`../README.md`](../README.md).

## Skill precedence

These rules override the installed skills when they conflict:

- `clean-ddd-hexagonal`: use its layering, aggregates, value objects, and ports/adapters guidance. Ignore its folder naming and its CQRS / Event Sourcing material (see below).
- `nestjs-best-practices`: use it for framework mechanics (modules, DI, pipes, guards, config, testing module). Do not follow its rules that put HTTP or ORM concerns in business code.

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
  shared/                    # cross-feature kernel (clock, ids, base errors) only
```

File names are kebab-case (`create-booking.use-case.ts`, `booking.entity.ts`), matching Nest conventions.

## Dependency rule

- `domain` imports nothing from NestJS, Prisma, `class-validator`, or any other layer.
- `application` imports only `domain` and its own ports. No `@nestjs/*` imports except `@Injectable()`.
- `infrastructure` and `http` depend inward; nothing depends on them.
- Prisma Client and Prisma-generated types are used only inside `infrastructure`. Map rows to domain entities at the repository boundary; never return Prisma types from a port.

## Ports and dependency injection

- Define ports as `abstract class` (no `I` prefix), e.g. `export abstract class BookingRepository`. TypeScript interfaces are erased at runtime and cannot be Nest injection tokens; abstract classes work without `@Inject()`.
- Bind adapters in the feature module: `{ provide: BookingRepository, useClass: PrismaBookingRepository }`.
- Existing ports: `EmailSender` (D-10).

## Errors

- `domain` and `application` throw domain errors (subclasses of a shared `DomainError`), never `HttpException` or its subclasses.
- Map domain errors to HTTP status codes in an exception filter inside `http/`.

## Domain rules to respect

- Business time zone is `America/Bogota`; timestamps are stored as `timestamptz` (D-02). Inject a clock port instead of calling `new Date()` in domain or application code.
- Slot overlap is enforced by a PostgreSQL exclusion constraint added as custom SQL in a Prisma migration (D-05). The domain check is a fast path, not the only guard.
- Do not invent business rules. If a rule is missing from `CONTEXT.md`, name the gap and ask.

## Testing (Vitest)

- Domain: plain unit tests, no Nest, no database.
- Use cases: unit tests with in-memory fakes of the ports, no `Test.createTestingModule`.
- Prisma repositories and HTTP: integration and e2e tests (`pnpm test:e2e`) against a real PostgreSQL.
- Commands: `pnpm test`, `pnpm test:e2e`, `pnpm lint` (oxlint), `pnpm format`.
