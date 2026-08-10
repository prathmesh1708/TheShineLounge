# Tunnel Wash + ANPR Automation — Implementation Plan

**Internal engineering document.** Companion to `01-distributor-requirements.md`.
**Date:** 8 August 2026

---

## 1. Goal

Replace manual staff status entry on car-wash jobs with automatic updates driven by site hardware:

| Trigger (hardware) | System effect | Booking status | `stepIndex` |
|---|---|---|---|
| — | Customer books | `Pending` | 0 |
| ANPR entry camera sees a registered plate | Match plate → booking, auto-check-in | `Vehicle Received` | 1 |
| Tunnel controller reports cycle start | Auto-advance | `Wash Started` | 2 |
| Tunnel controller reports cycle complete | Auto-advance + **consume 1 wash from membership** | `Wash Completed` | 3 |
| Exit gate / vehicle leaves | Auto-close | `Delivered` | 4 |

Statuses and indices above already exist — see `backend/src/models/Booking.js:76` and `CAR_WASH_STEPS` in `frontend/src/staff/car-wash-staff/components/carWashJobStepper.jsx:4`. **No status model change is needed**; we are only changing *who* writes them.

Staff manual override is **retained at every step**. Automation is an additional writer, never the only one.

---

## 2. Why an on-premise bridge is mandatory

The supplied parking API is:
- reachable only on the site LAN (`192.168.1.169:9001`),
- plain HTTP with **no authentication**,
- **poll-based** (`getPushNotification` is a POST we must call, not a callback).

Our backend is cloud/remote. It therefore cannot reach the device, and we must not expose an unauthenticated gate-opening API to the internet. The answer is a small **on-site connector service**:

```
┌─────────── SITE LAN (isolated VLAN) ────────────┐
│                                                  │
│  ANPR / Parking server   Tunnel wash controller  │
│    :9001 (HTTP, no auth)      (protocol TBD)     │
│         ▲                          ▲             │
│         │ poll ~1s                 │ webhook/poll│
│         └──────────┬───────────────┘             │
│                    │                             │
│           TSL Edge Connector (Node.js)           │
│            · normalises plates & events          │
│            · assigns idempotent event ids        │
│            · disk-buffers on outage              │
└────────────────────┼─────────────────────────────┘
                     │ HTTPS + device API key + HMAC
                     ▼
        Backend  POST /api/integrations/events
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   Booking      Membership    WashSession
   state m/c    ledger        audit trail
                     │
                     ▼
     Customer app · Staff console · Admin
     (existing 5s/10s poll + `tsl_live_sync` BroadcastChannel)
```

The connector is the **only** thing that ever talks to the hardware. Everything upstream sees clean, authenticated, idempotent events.

---

## 3. Backend module layout

Following the vertical-slice convention documented in `tools/project structure` (as used by `backend/src/car-wash/`):

```
backend/src/integrations/
  integrations.model.js        # DeviceEvent, WashSession
  integrations.controller.js   # event ingest endpoint
  integrations.service.js      # plate matching, state machine, membership consumption
  integrations.middleware.js   # device API-key + HMAC verification
  integrations.routes.js
  index.js

backend/src/integrations/adapters/
  parkingAnprAdapter.js        # maps the /yard/third/* payloads → canonical events
  tunnelWashAdapter.js         # maps tunnel controller payloads → canonical events

edge-connector/                # separate deployable, runs on site
  src/pollers/anprPoller.js
  src/pollers/tunnelPoller.js
  src/receivers/tunnelWebhook.js
  src/queue.js                 # disk-backed retry buffer
  src/forwarder.js
  src/simulator.js             # replaces hardware during development
```

Mount in `backend/src/server.js` alongside the existing module mounts (lines 73–98):

```js
app.use('/api/integrations', integrations.routes);
```

### Canonical event envelope

Every adapter normalises to one shape, so adding a second vendor later costs one adapter file:

```json
{
  "eventId": "anpr:1803001B1226:2026-08-08T10:14:22Z:MH01AB1234",
  "source": "anpr" | "tunnel",
  "type": "vehicle.entered" | "wash.started" | "wash.completed" | "wash.aborted" | "vehicle.exited",
  "occurredAt": "2026-08-08T10:14:22.000Z",
  "plate": "MH01AB1234",
  "plateRaw": "MH 01 AB 1234",
  "laneId": "tunnel-1",
  "channelMac": "1803001B1226",
  "cycleId": "…",
  "programCode": "…",
  "photoUrl": "…",
  "raw": { }
}
```

`eventId` is a unique index. Re-delivery is a no-op — this is what prevents a customer being charged twice for one wash.

---

## 4. Data model changes

### 4.1 Plate normalisation (new, `backend/src/utils/plateNormalizer.js`)
Strip spaces, hyphens and dots; uppercase; optionally correct O↔0 and I↔1 confusions. Store `plateNormalized` alongside the raw value everywhere. **Never match on raw plates** — ANPR output spacing is unreliable.

### 4.2 `User.vehicles[]` — add index fields
Currently `plateNumber`, `model`, `category`, `isPrimary` (`backend/src/models/User.js:117`). Add:
- `plateNormalized` (indexed) — enables O(1) plate → customer lookup
- `verifiedAt`, `addedVia` (`self` | `staff` | `anpr`)

A backfill script populates `plateNormalized` for existing vehicles.

### 4.3 `User.membership` — add balance fields
Today it tracks `maxPerDay`, `maxPerMonth`, `usageCountToday`, `lastUsedAt` (`backend/src/models/User.js:125`). To answer *"washes remaining"* we add:
- `washesRemaining` (Number) — for prepaid packs
- `usageCountMonth` (Number) + `usagePeriodStart` (Date) — for monthly caps
- `unlimited` (Boolean)

### 4.4 `MembershipUsage` ledger (new collection) — **do not skip this**
Never decrement a counter in place with no audit trail. One row per consumption:
`userId, bookingId, washSessionId, plate, consumedAt, source ('tunnel'|'staff'|'admin'), programCode, balanceBefore, balanceAfter, reversedBy`

This makes disputes answerable, makes reversal possible when a wash aborts, and makes the counters rebuildable if they drift.

### 4.5 `WashSession` (new collection)
Ties one physical tunnel cycle to one booking: `cycleId, plate, bookingId, userId, laneId, programCode, enteredAt, startedAt, completedAt, outcome, events[], photos[]`.

### 4.6 `Booking` — add provenance
- `vehicleNoNormalized` (indexed) — `vehicleNo` is currently free text
- `statusSource` (`staff` | `anpr` | `tunnel` | `admin`)
- `washSessionId`

---

## 5. Matching logic (the part that decides whether this works)

On `vehicle.entered` with plate `P`:

1. Normalise `P`.
2. Find an open car-wash booking today where `vehicleNoNormalized === P` and status is `Pending`.
3. If **exactly one** → auto-advance to `Vehicle Received`, set `statusSource: 'anpr'`.
4. If **none**, look up `User.vehicles.plateNormalized === P`:
   - **Known customer, no booking** → create a walk-in booking, attach the customer, notify staff via the existing `notifyStaffOfBooking` path in `backend/src/utils/staffAssignment.js`.
   - **Unknown plate** → create an unattached walk-in booking flagged `needsReview`; surface in an admin "Unmatched arrivals" queue with the ANPR photo.
5. If **more than one** candidate → do **not** guess. Flag for staff resolution in the staff console. *(Ambiguity is rare but must never be silently resolved — that is how the wrong customer gets billed.)*
6. Debounce: ignore a repeat entry event for the same plate within N minutes (default 10) so a car rolling over the loop twice does not create two bookings.

On `wash.completed`:
1. Resolve the `WashSession` → booking → user.
2. Advance the booking to `Wash Completed`.
3. If the user has an active membership covering `car-wash` and the entitlement check passes, write a `MembershipUsage` row and decrement `washesRemaining` / increment `usageCountMonth` **inside a transaction with the booking update**.
4. If the membership is expired, suspended or exhausted → do not decrement; mark the booking payable and raise a staff alert.

On `wash.aborted`: reverse any consumption for that `cycleId` (write a reversing ledger row; never delete the original).

---

## 6. Live propagation to the customer app

No new transport is strictly required. `StaffContext` already polls at 5s/10s and broadcasts over `BroadcastChannel('tsl_live_sync')`, and `frontend/src/pages/BookingsPage.jsx` renders from the API. Once the backend status changes, the customer sees it within one poll interval.

Improvement worth doing in Phase 3: expose `GET /api/bookings/stream` as Server-Sent Events so the status flips instantly rather than up to 10s later. SSE is preferred over WebSockets here — one-directional, survives proxies, ~30 lines of code.

---

## 7. Security

- Edge connector authenticates with a **device API key + HMAC-SHA256** over `(timestamp + body)`, with a ±5 minute clock-skew window; replayed signatures rejected via the `eventId` unique index.
- Hardware sits on an **isolated VLAN**. Only the connector's IP may reach `:9001`. Given `openGate` and `monthRental` are unauthenticated, this is not optional.
- The connector holds **no customer data** — it forwards events and nothing else. If it is stolen, nothing leaks.
- Plate numbers and ANPR photos are personal data: define a retention period (suggest 90 days for photos) and enforce it with a TTL index.
- All raw device payloads stored in `DeviceEvent.raw` for forensic replay.

---

## 8. Phased delivery

### Phase 0 — Foundations *(no hardware needed — can start today)*
- Plate normaliser + unit tests
- `plateNormalized` on `User.vehicles` and `Booking`, plus backfill script
- Membership balance fields + `MembershipUsage` ledger
- Admin UI: manage a customer's vehicles and see their wash ledger
- **Also removes the fabricated placeholder vehicle/membership data currently returned by `getCustomers` in `backend/src/controllers/userController.js` — automation cannot run on fake fallback rows.**

*Deliverable: real vehicle and membership data, correct by construction.*

### Phase 1 — Event pipeline + simulator *(no hardware needed)*
- `integrations` module, canonical envelope, HMAC middleware, idempotent ingest
- `WashSession` state machine
- **Simulator** that emits entry/start/complete/abort events on demand
- End-to-end demo: simulator → booking auto-advances → customer app updates

*Deliverable: the entire feature working against a simulator. This is the phase that de-risks everything — if the distributor is slow, we are not blocked.*

### Phase 2 — ANPR adapter *(needs the parking server reachable)*
- `parkingAnprAdapter` against `getPushNotification` (poll ~1s per `channelMac`)
- `getCarIn` / `getCarOut` reconciliation sweep every 5 min to catch anything the poll dropped
- Entry photos via `find?carNumUid=`
- Unmatched-arrivals admin queue

*Deliverable: arrival auto-check-in live. Steps 2–4 still manual.*

### Phase 3 — Tunnel adapter *(needs §3 of the distributor document)*
- `tunnelWashAdapter` for whichever protocol they confirm
- Auto `Wash Started` / `Wash Completed` / `Delivered`
- Automatic membership consumption
- SSE for instant customer updates

*Deliverable: the full automatic flow.*

### Phase 4 — Entitlement & control *(needs A5)*
- Pre-wash entitlement check: expired/exhausted membership blocks the wash or converts it to a paid wash
- Gate control via `openGate` for members
- Fault/alarm handling and machine status on the admin dashboard

### Phase 5 — Pilot and cutover
- Run automation in **shadow mode** for 2 weeks: events recorded, staff still update manually, daily report of disagreements
- Cut over per-lane once agreement is >99%
- Manual override permanently retained

---

## 9. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Tunnel controller exposes **no vehicle identity** | High — cannot link a wash to a customer | Time-window correlation with ANPR entry; §6 dry-contact fallback; confirm early via A3 |
| `getPushNotification` returns only the latest vehicle | Missed arrivals at busy times | 1s polling + `getCarIn` reconciliation sweep; raise B2 with distributor |
| ANPR misreads a plate | Wrong customer billed | Normalisation + fuzzy match via `findsimilarCar`; **never auto-consume on a fuzzy match** — always route to staff |
| No authentication on device API | Anyone on the LAN can open the gate | Isolated VLAN, IP allow-list, push B1 hard |
| Duplicate events on retry | Double-charged membership | `eventId` unique index; ledger with reversals |
| Site network outage | Lost events | Disk-backed queue in the connector + backfill on reconnect |
| Distributor delivers late | Project stalls | Phases 0–1 need no hardware; simulator carries development |

---

## 10. Build status

Phases 0, 1 and 2 are **implemented and tested**. 204 automated tests pass (187 backend, 17 connector), plus an end-to-end run of the real backend driven by the shipped simulator.

| Area | File | State |
|---|---|---|
| Plate normalisation + fuzzy matching | `backend/src/utils/plateNormalizer.js` | Done |
| Entitlement engine | `backend/src/utils/membershipEntitlement.js` | Done |
| Booking/session state machine | `backend/src/integrations/washStateMachine.js` | Done |
| Event ingest, matching, consumption | `backend/src/integrations/integrations.service.js` | Done |
| Device auth (API key + HMAC) | `backend/src/integrations/integrations.middleware.js` | Done |
| Operator + device API | `backend/src/integrations/integrations.{controller,routes}.js` | Done |
| Ledger / session / raw event models | `MembershipUsage.js`, `integrations.model.js` | Done |
| ANPR vendor adapter | `backend/src/integrations/adapters/parkingAnprAdapter.js` | Done |
| Tunnel adapter (3 modes) | `backend/src/integrations/adapters/tunnelWashAdapter.js` | Awaiting field map |
| On-site connector | `edge-connector/` | Done |
| Hardware simulator | `edge-connector/src/simulator.js` | Done |
| Backfill migration | `backend/src/utils/backfillPlateNormalization.js` | Done, not yet run |

**Endpoints**

| Method | Path | Auth |
|---|---|---|
| POST | `/api/integrations/events` | device (API key + HMAC) |
| GET | `/api/integrations/health` | device |
| GET | `/api/integrations/sessions` | staff/admin |
| GET | `/api/integrations/unmatched` | staff/admin |
| POST | `/api/integrations/sessions/:id/attach` | staff/admin |
| GET | `/api/integrations/customers/:id/usage` | staff/admin |
| GET | `/api/integrations/events` | admin |

**Still open:** Phase 3 needs the tunnel field map from §3 of the distributor request; Phase 4 needs A5; the unmatched-arrivals admin screen is API-complete but has no UI yet; SSE is not built (the existing 5s/10s poll covers it).

## 11. Immediate next actions

1. **Send `01-distributor-requirements.md` to the distributor.** Phase 3's adapter is written but needs their vocabulary to be configured; Phase 4 cannot start until A5 is answered.
2. **Run the backfill** — `npm run backfill:plates` (dry run), then `--apply`. Until this runs, existing bookings and vehicles have no normalised plate and will not match an arrival.
3. **Generate device secrets** and set `INTEGRATION_DEVICE_KEYS` on the server and `TSL_DEVICE_SECRET` on the connector.
4. **Get the site network plan** (§C2) so the connector host can be provisioned and the devices put on an isolated VLAN.

## 12. Verifying it works without hardware

```bash
# 1. backend
cd backend && npm run dev

# 2. drive a full cycle through the real API
cd edge-connector
node src/simulator.js --plate MH01AB1234 --secret <TSL_DEVICE_SECRET> --replay
```

The booking moves Pending → Vehicle Received → Wash Started → Wash Completed → Delivered in the customer app, one wash comes off the membership, and the `--replay` pass confirms every event de-duplicates. `--abort` exercises the reversal path.
