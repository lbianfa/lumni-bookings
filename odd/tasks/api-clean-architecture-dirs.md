# api-clean-architecture-dirs

Objective: create the API folder structure for the selective Clean Architecture defined in `lumni-bookings-api/CLAUDE.md`, keeping empty folders in git with `.gitkeep`.
Branch: `main` (work-unit commits). Delivery: single commit. Test runner: none in the API; checks are structural (tree listing, `tsc --noEmit`, `pnpm build`).

## Specs

- **S1** — User request, verbatim: "inicia un odd para crear los directorios de la arquitectura limpia selectiva y si la carpeta son vacias mantenerlos con .gitkeep"
- **S2** — Layers per feature follow `lumni-bookings-api/CLAUDE.md` ("Where to apply the layers"): full layers = `domain`, `application`, `infrastructure`, `http`; thin = `http`, `infrastructure`.
- **S3** — Every created folder that has no files gets an empty `.gitkeep`. Folders that already contain files get none.
- **S4** — Structure option A (feature folder + layer folders: `src/<feature>/{domain,application,infrastructure,http}`), chosen by the user over option B (vertical slices per use case). User, verbatim: "implementa A solo para users, no implementes todos los modulos de una vez"
- **S5** — Scope of this iteration: only `users`. `users` is a thin feature (simple auth, two seeded users, no business rules), so it gets `http/` and `infrastructure/` only. Other features are created one at a time, when the user asks.
- *Deferred, not decided:* names for the remaining features (proposed: `bookings`, `emails`, `assistant` full; `rooms`, `extras` thin; `shared/`). Revisit when each feature starts.

## Tasks

| ID | Specs | Route | Status | Evidence |
|----|-------|-------|--------|----------|
| T1 | S4 | inline | done — user chose option A | L3, L4 |
| T2 | S2, S3, S5 | inline | done | L5: `tsc --noEmit` exit 0, `pnpm build` ok; no empty folders, so no `.gitkeep` |
| T3 | S1 | inline | done | commit "refactor(api): split users feature into http and infrastructure layers" |

- T1: confirm structure with the user.
- T2: `users` only: move `users.controller.ts` to `http/`, `users.service.ts` to `infrastructure/`; `.gitkeep` only for empty folders; verify with a tree listing, `tsc --noEmit` and `pnpm build`.
- T3: commit on `main` (explicit paths; exclude `migrations/app/refs/`, `guide.pdf`, `.atl/`).

## Log

- **L1** (2026-10-25) — User request: "inicia un odd para crear los directorios de la arquitectura limpia selectiva y si la carpeta son vacias mantenerlos con .gitkeep"
- **L2** (2026-10-25) — Feature list derived from `CONTEXT.md` tables (`users`, `rooms`, `customers`, `services`, `bookings`, `booking_lines`, `booking_services`, `email_outbox`, `chat_conversations`, `chat_messages`, `payments`) and Parts 1–2. `customers`, `booking_lines`, `booking_services` belong to the `bookings` feature. Next step: T1.
- **L3** (2026-10-25) — User, verbatim: "No creo que sea la estructura recomendada, busca cual es realmente la estructura recomendada en nestjs". Research: NestJS docs recommend feature modules only, no layers; `nestjs-best-practices` same; `Sairyss/domain-driven-hexagon` (15k stars) uses feature modules with vertical slices per use case ("a recommendation, not a rule"). Presented option A (feature + layer folders) and option B (feature + use-case slices, no CQRS bus).
- **L4** (2026-10-25) — User, verbatim: "vamos con la estructura inicial recomendada pero no lo implementes aún, te aviso", then "implementa A solo para users, no implementes todos los modulos de una vez". Decision: option A, `users` only, thin layers per `CLAUDE.md`.
- **L5** (2026-10-25) — T2 done. `git mv` of `users.controller.ts` → `src/users/http/` and `users.service.ts` → `src/users/infrastructure/`; imports updated in both files and in `users.module.ts`. Both folders have files, so S3 adds no `.gitkeep`. Checks: `tsc --noEmit` exit 0, `pnpm build` ok; app boot not run. Next: T3 when the user asks; next feature only on request.
