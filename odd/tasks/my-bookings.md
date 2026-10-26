# my-bookings

Objective: the customer's "My bookings" page (`design/MyBookings.dc.html`): every booking of the signed-in customer, with drafts resumable from it.
Branch: `main` (user convention: work-unit commits directly on main). Delivery: commits per work unit, made only after the user approves them. Test runner: none, by user decision (no tests in ODD features); checks are structural (`tsc`, build, lint) plus runtime probes.

## Specs

- **S1** — Scope: a "My bookings" page in the SPA listing the signed-in customer's bookings in every status, following the design; a "My bookings" item in the header nav and a "New quote" link on the page. Out of scope: the confirmation email, the assistant, cancelling from this page, the design's header changes other than the nav item.
- **S2** — After confirming (user choice): the customer stays on the booking page, as today; the read-only booking view gains a link to My bookings. My bookings shows no confirmation banner.
- **S3** — Each item, as in the design: status badge, reference `BK-<id>` (D-24), "Room name (Size) · Day, Mon D · HH:mm–HH:mm", the total in COP, and a second line: a draft says "Saved at step N of 3" with a "Resume booking" link to `/bookings/<id>` (which opens on the furthest step reached); a confirmed or completed booking lists its selected services or says "No additional services"; a cancelled booking says "Cancelled by the coworking: “<reason>”". *Assumptions:* "Created by the assistant" is left out until the assistant exists; non-draft items link nowhere, as in the design.
- **S4** — Order and size: newest booking first (by creation, as the design's references descend); no pagination (the design has none). *Assumption:* an empty list shows a short empty state with the "New quote" link.
- **S5** — API: `GET /api/bookings` returns only the session customer's bookings (`401` without session, `403` for a user without customer, as the other booking routes); it reads rooms, services and the selected services once per request, never per booking; documented in the OpenAPI spec following the API `CLAUDE.md` rules.
- **S6** — The SPA wording that sent customers to "open the booking again" now points to My bookings, matching the booking designs.
- **S7** — Docs: README status line and decisions only where a new rule appears (order, empty state); `.es.md` mirrored. No tests (standing user rule).

## Tasks

| ID | Specs | Route | Status | Evidence |
|----|-------|-------|--------|----------|
| T1 | S4, S5 | delegated (W1) | done; runtime probes pass | L3; `b8581b9` |
| T2 | S1, S2, S3, S4, S6 | delegated (W2) | done; browser walk-through by the user | L3, L4; `622ccd6` |
| T3 | S7 | inline | done | L3, L4; docs commit |

- T1 (API): `BookingRepository.findByCustomer`, the booking's cancellation reason and creation time read into the entity, a batch read of selected services, a `ListMyBookings` use case, `GET /api/bookings` with its response DTO and OpenAPI decorators.
- T2 (SPA): `/bookings` route (list page), header nav item (customers only), list query and types, list item component, empty state, link from the read-only booking view, resume wording.
- T3: README (+ `.es.md`), seam check (API `tsc`/`build`, SPA `tsc`/`lint`/`build`), runtime probes, commits after the user's approval.

Route evidence: writer trigger (a): T1 and T2 are independent units with disjoint edit surfaces (API vs SPA), each several files, joined only by the HTTP contract below; launched together. The parent owns git, docs and the seam check. Risk: none of the high-risk items (a new read-only endpoint; no schema, auth or concurrency change), so no independent verifier; each writer runs its checks and the parent probes at runtime.

HTTP contract (shared by W1 and W2). Session cookie required.

`GET /api/bookings` → `200` with an array, newest created first:

```
[{ id, reference: "BK-<id>", status: "draft" | "confirmed" | "completed" | "cancelled", currentStep: 1 | 2 | 3,
   room: { id, name, size: "small" | "medium" | "large" },
   date: "YYYY-MM-DD", startTime: "HH:mm", endTime: "HH:mm",
   total: "345000.00",
   services: [{ code, name }],          // selected services, catalog order
   cancellationReason: string | null,
   createdAt: ISO-8601 }]
```

Errors: `401` without session, `403` for a user without customer (`{ statusCode, message }`).

## Log

- **L1** (2026-10-26) — User request (paraphrased): start ODD to implement My bookings.
- **L2** (2026-10-26) — Exploration: CONTEXT has no My bookings section; the design `MyBookings.dc.html` is the contract (header nav, confirmation banner, title with "New quote", items with badge, reference, room/date/time, second line by status, total, "Resume booking" for drafts). Today the SPA has no list route; the read-only booking view already shows the confirmation banner. The `Booking` entity has no creation time or cancellation reason yet. Decision asked: after confirming → stay on the booking page (user choice), so My bookings shows no banner. Forecast ~450 authored lines (API ~200, SPA ~220, docs ~30). Next: W1 and W2 in parallel.
- **L3** (2026-10-26) — W1 and W2 returned; both diffs stay inside their surfaces. W1 (S4, S5): `Booking` reads `createdAt` (Postgres text parsed with `Temporal.Instant.from`) and `cancellationReason`; `BookingRepository.findByCustomer` (created desc, then id desc); `BookingServiceRepository.findServiceIdsByBookings` (one query); `ListMyBookings` resolves the customer through `BookingAccess`, reads rooms, services and selections once, in parallel, and returns `[]` early for no bookings; `BookingListItemDto` with its zod schema; `GET /api/bookings` documented. W2 (S1–S4, S6): `/bookings` route with loader + suspense query (`['bookings']`, invalidated exactly after start, step saves and confirm), `BookingListItem`, shared `StatusBadge` (also used by the booking header), `MyBookingsLink` in the read-only view and the step 1 note, "My bookings" nav item for customers only, `403` message, empty state. Design departures: no thick border on the confirmed item (it pairs with the banner S2 removed); nav item active only on `/bookings`; the step 1 note links "My bookings". T3: README D-27 and status line (+ `.es.md`). Seam check: API `tsc` 0, `build` 0; SPA `tsc` 0, `lint` 0, `build` 0. Runtime probe (parent, temporary draft deleted afterwards, Booking count 2 → 2): 401/403 per W1; a draft through all steps with coffee and projector lists first, `currentStep` 3, total 175000.00, services in catalog order; after setting it cancelled with a reason the item shows `cancelled` and the reason. Pending: the user's browser walk-through; commits after the user's approval.
- **L4** (2026-10-26) — The user tested the page in the browser, approved the commits and asked to close the feature. On main: `b8581b9` API (T1), `622ccd6` SPA (T2), then the docs commit with README D-27 and this document (T3). Feature closed.
