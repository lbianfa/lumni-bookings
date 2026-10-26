# booking-detail

Objective: the customer's detail page for a confirmed booking, opened from My bookings, laid out like `design/AdminBookingDetail.dc.html` without the admin-only parts and without the confirmation email box.
Branch: `main` (user convention). Delivery: commits per work unit, made only after the user approves them. Test runner: none, by user decision (no tests in ODD features); checks are structural (`tsc`, build, lint) plus runtime probes.

## Specs

- **S1** — Scope (user request): a booking detail for the customer, reached from My bookings, for confirmed bookings; no confirmation email box. There is no customer detail design, so the admin detail design is the reference, minus what only the admin has: the "Cancel booking" button, the cancellation dialog, the email box and "by Admin".
- **S2** — Entry: in My bookings, each confirmed item gets a "View booking" link to `/bookings/<id>`; drafts keep "Resume booking"; completed and cancelled items stay without a link. *Assumption:* the same page renders any non-draft booking opened by its URL.
- **S3** — Layout, following the admin detail: a back link to My bookings; the heading is the reference `BK-<id>` with its status badge; a "Booking" section (Customer, Email, Company, Room "Name (Size)", Date "Thu, Oct 29, 2026", Time "08:00–16:00 · 8 h", Services or "None"); a "Price" section titled with "Locked at confirmation · <date, time>" over the frozen breakdown (base, duration discount, Saturday surcharge, each service, total); a "Status history" section: "Draft created · <date, time>" and "Confirmed · <date, time>". *Assumption:* history lines drop "by the customer", since the customer is the reader.
- **S4** — The confirmation banner ("Booking BK-… confirmed") shows only right after confirming on this page (the previous feature's choice to stay on the booking page), not when the detail is opened later from My bookings. *Assumption.*
- **S5** — API: the booking response gains `createdAt` (ISO-8601), documented in its OpenAPI schema; every other field and route stays unchanged.
- **S6** — Docs: README D-27 updated (confirmed items open their detail), `.es.md` mirrored. No tests (standing user rule).

## Tasks

| ID | Specs | Route | Status | Evidence |
|----|-------|-------|--------|----------|
| T1 | S5 | inline | done; probe ok | L3; `9dd10ce` |
| T2 | S1, S2, S3, S4 | inline | done; browser walk-through by the user | L3, L4; `9dd10ce` |
| T3 | S6 | inline | done | L3, L4; docs commit |

- T1: `createdAt` in `BookingResponseDto` (schema and class) from the entity's `createdAt`.
- T2: rewrite `BookingRecord` as the detail layout reusing `StatusBadge`, `PriceBreakdown`, `MyBookingsLink` and the date and money formatters; banner only after confirming (state set by the wizard's confirm success); "View booking" link in `BookingListItem` for confirmed items; `createdAt` in the `Booking` type.
- T3: README D-27 (+ `.es.md`), checks, runtime probe, commits after the user's approval.

Route evidence: one unit of behavior (the SPA depends on T1's field), no writer trigger, so the parent writes inline. Risk: none of the high-risk items (an added response field and a read-only page), so no independent verifier.

## Log

- **L1** (2026-10-26) — User request (paraphrased): start ODD to implement the booking detail in My bookings, for the customer, for confirmed bookings, without the email box.
- **L2** (2026-10-26) — Exploration: the design canvas (the attached artifact, same files as `design/`) has no customer detail; `AdminBookingDetail.dc.html` is the closest (header with reference and badge, Booking and Price sections, Status history, email box, cancel button). Today `/bookings/<id>` renders `BookingRecord` for any non-draft (links, header with room title, a confirmation banner for every confirmed booking, the summary card). The booking response has `confirmedAt` but no creation time; the entity already reads `createdAt` (my-bookings T1). Forecast ~250 authored lines. Next: T1.
- **L3** (2026-10-26) — T1: `BookingResponseDto` gains `createdAt` (schema and class; `create` already returns the stored row, so a new draft has it too). T2: `BookingRecord` rewritten as the detail: back link to My bookings (`MyBookingsLink back`), reference heading with a new `detail` badge size (badge padding and text size moved into its variants), Booking section (two-column grid, one column on phones), Price section with "Locked at confirmation · <Oct 24, 16:02>" over `PriceBreakdown`, Status history (Draft created, Confirmed); `formatFullDateLabel` added beside `formatDateLabel`; the confirmation banner shows only when the page confirmed this booking (`onConfirmed` from step 3 through the wizard to the route, which keeps the confirmed booking id, so another booking opened later shows no banner); My bookings shows "View booking" on confirmed items. Company without value shows "None". Prettier fixed the pre-existing import formatting in `services-step.tsx`. T3: README D-27 (+ `.es.md`). Checks: API `tsc` 0, `build` 0; SPA `tsc` 0, `lint` 0, `build` 0, Prettier clean on the changed files. Probe: a real confirmed booking answers with `createdAt` as the only new field (16 → 17 keys); `/api/docs-json` documents it. Pending: the user's browser walk-through; commits after approval.
- **L4** (2026-10-26) — The user tested the detail and approved the commits. On main: `9dd10ce` API field and SPA detail (T1, T2; one commit since the SPA needs the field), then the docs commit with README D-27 and this document (T3). Feature closed.
