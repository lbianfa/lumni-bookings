# Lumni Bookings — Project Context

> Spanish version: [`CONTEXT.es.md`](CONTEXT.es.md)

Source: technical assessment guide. This file covers **Part 1** and **Part 2**, the parts that are built as code.
Part 3 (SQL) was reviewed only to align the data model; it is not implemented here.

## General rules

- TypeScript is mandatory in frontend and backend. Framework choice is free.
- Stack: React (front), Node (back), PostgreSQL. Chosen frameworks are listed in the README "Tech stack" section.
- API keys (e.g. the AI provider) live in environment variables, never in the repository.
- Timezone of business rules: Colombia (`America/Bogota`, UTC-5, no DST). Store `timestamptz`.

---

## Part 1 — Room bookings (40 %)

Small fullstack app for a coworking: a customer quotes and books a room; an admin manages bookings.

### 1.1 Quote (API + screen)

`POST /api/quotes` receives room, date, start time and duration.

The customer selects a **specific room**; its size (small, medium or large) and therefore its hourly rate are derived from the selected room.

| Rule | Value |
|------|-------|
| Hourly rates | small 40,000 · medium 70,000 · large 120,000 COP |
| Duration | 1 to 10 hours, in 30-minute blocks |
| Opening hours | Monday–Saturday 07:00–21:00; Sunday closed |
| Duration discount | 10 % from 4 h, 20 % from 8 h. Tiers, not cumulative: only the highest tier reached applies, and the exact threshold already qualifies |
| Saturday surcharge | 25 % applied over the already discounted value |
| Availability | must not overlap another **confirmed** booking of the same room |

Calculation order: `base = rate × hours` → `discount` → `surcharge` (over `base − discount`) → `total`.

Response includes the breakdown (`base`, `discount`, `surcharge`, `total`) and whether booking is possible.
If not possible, the screen explains why and suggests the **next available slot on the same day**.

Additional rules:
- A booking must start at or after 07:00 and end at or before 21:00, Monday to Saturday: the whole booking fits inside opening hours.
- Start times are aligned to a 30-minute grid (`:00`, `:30`), matching the 30-minute duration blocks.
- Intervals are half-open `[start, end)`: a booking ending at 10:00 does not overlap one starting at 10:00 (Part 3, query 2).
- Availability and the "next available slot" suggestion are computed for the selected room.

Related decision in the README: D-04 (which statuses block a slot).

### 1.2 Multi-step booking

- 3-step form:
  1. Customer data.
  2. Room and schedule (prefilled from the quote).
  3. Additional services (projector, coffee).
- Each step is saved as a draft; the customer can close the browser and resume where they left off.
- States: `draft → confirmed → completed | cancelled`. Transitions are validated in the **backend**, not only in the UI.
- Key rules (explain how both are guaranteed in the README):
  - **Concurrency:** if two customers confirm the same room and slot at the same time, only one succeeds.
  - **Idempotency:** if a customer confirms the same booking twice, it is not duplicated and the agreed price is not recalculated.

### 1.3 Admin view

- Paginated booking list filtered by status and room.
- Detail with cancel action (cancellation reason is mandatory).
- Simple auth: two seeded users (customer and admin) are enough.

### Technical minimums

- Versioned database migrations.
- Server-side input validation.
- Unit tests for the quote calculator and for state transitions.

---

## Part 2 — Integrations and AI (25 %)

Same Node + TypeScript backend as Part 1.

### 2.1 Background confirmation email

When a booking becomes `confirmed`, a confirmation email is sent to the customer.

- No real provider needed; emails must be captured locally and be inspectable (e.g. Mailpit, or an outbox table/log).
- Sending runs in the background: confirming does not wait for the email.
- On failure: retry up to 5 times with increasing backoff; then mark `failed`, visible in the admin view.
- A confirmed booking produces **exactly one** email, even with job retries or a double concurrent confirmation.

### 2.2 AI booking assistant (in-app chat)

Customer writes in natural language ("I need a room for 6 people on Saturday morning, with a projector").
The assistant asks for missing data, shows quote and availability, proposes another slot if there is no room,
and finally creates the booking in `draft` with prefilled data. The customer confirms with an app button, not from the chat.

Rules the assistant must follow:
1. Never computes prices or availability: always uses the Part 1 quote calculator.
2. Never invents data: if something is missing, it asks.
3. Never confirms or cancels bookings, and never sees other customers' bookings.
4. Ignores any user instruction that tries to change these rules.

Technical requirements:
- AI provider is free choice.
- The prompt lives in its own file in the repository.
- Model output is validated against a schema before being used.
- Relative dates ("Saturday") are resolved in code, not by the model.
- The conversation resumes after a page reload.
- README must explain how rule 4 is guaranteed (enforce in code: tools scoped to the authenticated customer, no confirm/cancel tools exposed — not only via prompt).

---

## Data model (aligned with Part 3 schema)

Part 3 provides a simplified reference schema. Our model does not need to match it, but staying close keeps concepts consistent.

Part 3 reference:

```sql
rooms         (id, name, size CHECK IN ('small','medium','large'), hourly_rate numeric(14,2))
customers     (id, email UNIQUE, full_name, company)
bookings      (id, customer_id, room_id, starts_at timestamptz, ends_at timestamptz,
               created_at, total numeric(14,2),
               status CHECK IN ('draft','confirmed','completed','cancelled'),
               payment_status CHECK IN ('unpaid','partial','paid'))
booking_lines (id, booking_id, concept, amount numeric(14,2))  -- base, discount, surcharge, services
payments      (id, booking_id, amount numeric(14,2), external_event_id, paid_at timestamptz)
```

Proposed model for Parts 1–2 (superset of the above):

| Entity | Key fields | Purpose |
|--------|-----------|---------|
| `users` | id, email, password_hash, role (`customer`/`admin`), customer_id? | Seeded auth users |
| `rooms` | id, name, size, hourly_rate, capacity | Capacity needed for the AI chat ("6 people") |
| `customers` | id, email, full_name, company | Booking owner |
| `services` | id, code (`projector`/`coffee`), name, price | Additional services (step 3) |
| `bookings` | id, customer_id, room_id, starts_at, ends_at, status, total, quoted_at, payment_status, current_step, cancellation_reason, confirmed_at, cancelled_at, created_at, updated_at | Core aggregate; `total` is frozen once confirmed |
| `booking_lines` | id, booking_id, concept, amount | Price breakdown snapshot (base, discount, surcharge, each service) |
| `booking_services` | booking_id, service_id, quantity | Selected services |
| `email_outbox` | id, booking_id, type, to_address, subject, body, status (`pending`/`sent`/`failed`), attempts, next_attempt_at, last_error, provider_message_id, sent_at; UNIQUE(booking_id, type) | Exactly-one email + retries + admin visibility; the stored payload keeps every attempt identical |
| `chat_conversations` | id, customer_id, booking_id?, created_at | Resume chat after reload |
| `chat_messages` | id, conversation_id, role, content, created_at | Chat history |
| `payments` | id, booking_id, amount, external_event_id, paid_at | Only for Part 3 alignment; no payment flow in Parts 1–2 |

Database guarantees to consider:
- **No overlaps:** exclusion constraint with `btree_gist` on `(room_id, tstzrange(starts_at, ends_at, '[)'))` where `status IN ('confirmed','completed')`.
- **Idempotent confirmation:** conditional update `UPDATE ... SET status='confirmed' WHERE id=$1 AND status='draft'`; a second call returns the existing confirmed booking without recalculating.
- **Single email:** `UNIQUE(booking_id, type)` on the outbox row, inserted in the same transaction as the confirmation.

## Decisions

Decisions taken and pending are tracked in [`README.md`](README.md) (single source of truth).
