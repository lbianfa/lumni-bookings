# admin-bookings-table

Objective: the admin's bookings table at `/admin/bookings`, after `AdminBookings.dc.html`, reading `GET /api/bookings` (D-28) with its status and room filters and pagination; rows open the admin booking detail.
Branch: `main` (user convention). Delivery: commits per work unit, made only after the user approves them. Test runner: none, by user decision (no tests in ODD features); checks are structural (`tsc`, build, lint, Prettier) plus runtime probes.

## Specs

- **S1** — Scope (user request): implement the bookings table for the admin.
- **S2** — Layout, following the design: heading "Bookings"; a status filter group ("All", "Draft", "Confirmed", "Completed", "Cancelled") and a "Room" select ("All rooms", then rooms grouped by size); a table with the columns Booking, Customer, Room, Schedule, Total and Status; "No bookings match these filters." when a page has no rows; a pagination bar with "Page X of Y", Previous, page numbers and Next.
- **S3** — Data: the table reads `GET /api/bookings` (`status`, `roomId`, `page`); rows keep the API's order (newest created first); the Booking cell is the reference (D-24) linking to `/admin/bookings/<id>`; Room is "Name (Size)"; Schedule is "Sat, Oct 31 · 09:00–13:00"; Total in COP; Status is the status badge.
- **S4** — Navigation: the admin reaches the table from the main navigation ("Bookings") and from the home page; the admin booking detail links back to it ("All bookings", as in the detail design).
- **S5** — Docs: README D-28 updated now that the table exists (+ `.es.md`). No tests (standing user rule).

Assumptions (marked so the user can correct them):
- *A1:* the design's Email column waits for the email outbox (D-07–D-10); no outbox exists yet.
- *A2:* the filters and the page live in component state (project rule: page selections are not search params); changing a filter goes back to page 1, and returning from a detail starts from page 1 with no filters.
- *A3:* the room options come from `GET /api/rooms`, grouped by size in `optgroup`s.
- *A4:* the pagination shows at most 5 page numbers around the current page; Previous and Next are disabled at the ends.
- *A5:* the dark "Lumni Admin" header of the admin designs stays out of scope; the shared header gains the admin's "Bookings" link.
- *A6:* the home page shows the admin a "Bookings" quick action card; the admin still lands on the home page after signing in.

## Tasks

| ID | Specs | Route | Status | Evidence |
|----|-------|-------|--------|----------|
| T1 | S1, S2, S3 | inline | done; approved by the user | L3, L4; `1609953` |
| T2 | S4 | inline | done; approved by the user | L3, L4; `1609953` |
| T3 | S5 | inline | done | L3, L4; docs commit |

- T1: `adminBookingsQueryOptions(filters, page)` and the page types; the `/admin/bookings` route with the table (TanStack Table v9), the filters, the pagination and the empty and error states.
- T2: "Bookings" in the admin's navigation, the admin's card on the home page, the "All bookings" back link on the admin detail.
- T3: README D-28 (+ `.es.md`), checks, runtime walk-through, commits after the user's approval.

Route evidence: one SPA unit of behavior on an existing endpoint, no parallel units and no writer trigger, so the parent writes inline. Risk: none of the high-risk items (a read-only page over an existing, already verified endpoint; no API, dependency or contract change), so no independent verifier. Forecast ~350 authored lines.

## Log

- **L1** (2026-10-26) — User request (paraphrased): start ODD to implement the bookings table for the admin.
- **L2** (2026-10-26) — Exploration: the canvas design `project/AdminBookings.dc.html` matches the local copy (filters by status and room, seven columns including Email, pagination, empty row). `GET /api/bookings` (D-28) already serves pages of 10 with `customer`, `room`, schedule, `total` and `status` per item, `total` and `totalPages`; `GET /api/rooms` lists the rooms with their size. `@tanstack/react-table` 9.3.1 is installed, with its Intent skills. The admin detail renders `BookingRecord` with no back link. Next: T1.
- **L3** (2026-10-26) — T1: `BookingPage`, `AdminBookingListItem` and `BookingFilters` types; `adminBookingsQueryOptions(filters, page)` (key `['admin', 'bookings', 'list', filters, page]`, previous page kept while the next loads); `/admin/bookings` route (loader warms page 1 and the rooms) with `BookingsFilters` (status pills with `aria-pressed`, room select grouped by size), `BookingsTable` (TanStack Table v9 core `useTable`, columns only, since the API filters, orders and pages; the stale page is dimmed and `aria-busy`) and `PaginationBar`; a filter change goes back to page 1. T2: "Bookings" in the admin's navigation, the admin's "Bookings" card on the home page (its subtitle now shows to both roles), `AllBookingsLink` on the admin detail and its not-found and error states. T3: README D-28 (+ `.es.md`). Checks: SPA `tsc` 0, `lint` 0, `build` ok, Prettier applied; the page-window logic gives `1`, `1 2`, `1 2 3 4 5` (pages 1 and 3 of 6), `2 3 4 5 6` (6 of 6), `3 4 5 6 7` (5 of 20), `16 17 18 19 20` (20 of 20). Not run: the browser walk-through (both dev servers were down). Pending: the user's walk-through; commits after approval.
- **L4** (2026-10-26) — The user asked to merge the two role checks of the navigation into one condition with an else; it is now one ternary (customer: Quote and My bookings; otherwise Bookings), with Prettier, `tsc` and lint clean. The user approved the result and the commits. On main: `1609953` the SPA table, navigation, home card and back link (T1, T2), then the docs commit with README D-28 and this document (T3). Feature closed.
