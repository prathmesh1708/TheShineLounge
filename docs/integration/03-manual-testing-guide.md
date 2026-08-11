# Manual Testing Guide — ANPR & Tunnel Wash Integration

How to see every part of this working by hand, without any hardware.
Takes about 10 minutes.

---

## Before you start: two warnings

**1. `MONGO_URI` points at your production Atlas database.**
Everything below writes real rows into it. The demo seeder confines its data to
one tagged customer and plate so `npm run demo:clean` can take it all back out,
but the backfill in Step 2 touches your existing bookings. Read Step 2 before
running it.

**2. Your live data cannot demonstrate this yet.**
As of now: **11 customers, 0 with a vehicle registered, 0 with a membership.**
Plate→customer matching has nothing to match against, and there is no membership
balance to decrement. That is why Step 3 seeds a demo customer.

Also note four open bookings share plate `MP09WC4444`. An arrival on that plate
is *correctly* sent to manual review rather than guessed at — see Test D.

---

## Step 1 — Add the device secret

Site hardware authenticates with a device id and a shared secret, not a login.
Without this the backend rejects every event with `401 BAD_SIGNATURE`.

Append to `backend/.env`:

```bash
cd backend
cat >> .env <<'EOF'

# Hardware integration
INTEGRATION_DEVICE_KEYS={"edge-connector-1":"4038bd732c8997057239ac576705aca29933d561481a8ccc37663b22dc0bc3f0"}
SITE_TIMEZONE=Asia/Kolkata
EOF
```

Generate your own secret for anything beyond local testing:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 2 — Backfill the plate index

Existing bookings were written before the normalised plate column existed, so a
camera arrival matches none of them.

```bash
cd backend
npm run backfill:plates          # dry run — reads only, writes nothing
```

Current output on your database:

```
Bookings   scanned 19, needing update 19
Customers  scanned 0, needing update 0
Memberships without a balance: 0
No duplicate plate registrations found.
```

It only ever sets `vehicleNoNormalized` from the `vehicleNo` already on the row —
no status, price or customer field is touched. When you are happy:

```bash
npm run backfill:plates -- --apply
```

---

## Step 3 — Seed the demo customer

```bash
cd backend
npm run demo:seed
```

Creates one tagged customer, fully isolated from your real records:

| | |
|---|---|
| Customer | `anpr.demo@theshinelounge.test` / `demo1234` |
| Vehicle | `MH 01 AB 1234` → normalised `MH01AB1234` |
| Membership | Shine Club Gold (Demo), **10 washes remaining** |
| Booking | `B-ANPR-DEMO`, status `Confirmed`, step 0 |
| Booking plate | `MH-01-AB-1234` (hyphens — deliberately different from the camera's format) |

Re-running resets it to this exact state. `npm run demo:clean` removes all of it.

---

## Step 4 — Start the app

Two terminals:

```bash
# terminal 1
cd backend && npm run dev        # http://localhost:5005

# terminal 2
cd frontend && npm run dev       # http://localhost:3000
```

---

## Step 5 — Watch it happen

Open **two browser windows side by side**:

- **Customer** — log in as `anpr.demo@theshinelounge.test` / `demo1234`, go to
  http://localhost:3000/bookings
- **Staff** — http://localhost:3000/staff/bookings

Then, in a third terminal, drive a car through the tunnel:

```bash
cd edge-connector
node src/simulator.js \
  --plate MH01AB1234 \
  --secret 4038bd732c8997057239ac576705aca29933d561481a8ccc37663b22dc0bc3f0 \
  --speed 8 \
  --replay
```

If your backend is on a port other than 5005, add `--url http://localhost:<port>`.

`--speed 8` puts 8 seconds between events so you can watch each one land.

**Expected — both screens advance on their own, with nobody touching them:**

| Simulator prints | Booking becomes | Step |
|---|---|---|
| `vehicle.entered` | Vehicle Received | 1 |
| `wash.started` | Wash Started | 2 |
| `wash.completed` | Wash Completed | 3 |
| `vehicle.exited` | Delivered | 4 |

The customer screen refreshes within about 10 seconds of each event — that is the
existing poll interval, not a delay in the integration.

Then the `--replay` pass resends all four events and should print:

```
sim:...:vehicle.entered    DUPLICATE
sim:...:wash.started       DUPLICATE
sim:...:wash.completed     DUPLICATE
sim:...:vehicle.exited     DUPLICATE

Idempotency holds.
```

**Nothing moves on the replay.** That is the guarantee that a tunnel retrying its
webhook cannot charge a customer twice.

---

## Step 6 — Confirm the membership was charged exactly once

```bash
cd backend
node -e "
require('dotenv').config();
const m=require('mongoose');
(async()=>{
  await m.connect(process.env.MONGO_URI);
  const U=require('./src/models/User');
  const L=require('./src/models/MembershipUsage');
  const u=await U.findOne({email:'anpr.demo@theshinelounge.test'});
  console.log('washes remaining :', u.membership.washesRemaining, '(was 10)');
  console.log('used today       :', u.membership.usageCountToday);
  console.log('used this month  :', u.membership.usageCountMonth);
  for (const r of await L.find({userId:u._id}).sort({consumedAt:1}))
    console.log(\`ledger: \${r.kind} \${r.balanceBefore} -> \${r.balanceAfter} via \${r.source}\`);
  await m.disconnect();
})();"
```

Expected:

```
washes remaining : 9 (was 10)
used today       : 1
used this month  : 1
ledger: consume 10 -> 9 via tunnel
```

One row, one deduction — for four events including a full replay.

---

## The tests worth running by hand

### Test A — Plate formatting is irrelevant

The booking says `MH-01-AB-1234`. The camera sent `MH01AB1234`. They matched.
Try `--plate "mh 01 ab 1234"` — same result.

### Test B — Two different failures, two different outcomes

**B1 — the wash fails mid-cycle.** Nothing was ever charged, so there is nothing
to refund:

```bash
npm run demo:seed          # reset to 10 washes
cd ../edge-connector
node src/simulator.js --plate MH01AB1234 --secret <secret> --abort
```

Cycle runs `entered → started → aborted`. Verified result:

```
washes left: 10 | used today: 0
(no ledger rows)
```

**B2 — the wash completed, was charged, then voided.** *This* is the reversal
path:

```bash
cd backend && npm run demo:seed
cd ../edge-connector
node src/simulator.js --plate MH01AB1234 --secret <secret> --void
```

Cycle runs `entered → started → completed → aborted`. Verified result:

```
washes left: 10 | used today: 0
  ledger: consume 10 -> 9 |
  ledger: reverse 9 -> 10 | Wash voided by supervisor
```

Two rows, and the original is never deleted — a customer disputing a charge can
be shown exactly what happened, when, and why it was undone.

### Test C — An unregistered car goes to a human

```bash
node src/simulator.js --plate XX99ZZ0001 --secret <secret>
```

Then as staff or admin:

```bash
curl -s http://localhost:5005/api/integrations/unmatched \
  -H "Authorization: Bearer <your admin JWT>" | python3 -m json.tool
```

You get a booking named `Unregistered · XX 99 ZZ 0001`, flagged `needsReview`
with the reason *"not registered to any customer"*. **No membership was
touched.** A staff notification is raised. Attach a customer with:

```
POST /api/integrations/sessions/:id/attach   { "userId": "<id>" }
```

which also registers the plate to that account, so the next visit matches by
itself.

*(Get your admin JWT from browser devtools → Application → Local Storage →
`tsl_admin_token`.)*

### Test D — An ambiguous plate is never guessed

**Requires Step 2 to have been run with `--apply`.** Without it your existing
bookings have no normalised plate, so this falls through to Test C's
"not registered" path instead — which is itself a good demonstration of why the
backfill matters.

Your live data already has this case — four open bookings share `MP09WC4444`:

```bash
node src/simulator.js --plate MP09WC4444 --secret <secret>
```

It does **not** pick one. It creates a review item reading *"4 open bookings
share plate MP 09 WC 4444: B-2026-6263, B-2026-2081, …"*. Guessing here is how
the wrong customer gets billed.

Clean up afterwards — this writes a walk-in booking against a real plate:

```bash
cd backend && node -e "
require('dotenv').config();const m=require('mongoose');
(async()=>{await m.connect(process.env.MONGO_URI);
const B=require('./src/models/Booking');
console.log('removed:', (await B.deleteMany({createdVia:'anpr'})).deletedCount);
await m.disconnect();})();"
```

### Test E — A membership that should not pay

Expire the demo membership, then run a normal cycle:

```bash
cd backend
node -e "
require('dotenv').config();const m=require('mongoose');
(async()=>{await m.connect(process.env.MONGO_URI);
const U=require('./src/models/User');
await U.updateOne({email:'anpr.demo@theshinelounge.test'},
  {\$set:{'membership.expiryDate':new Date('2020-01-01')}});
console.log('membership expired');await m.disconnect();})();"
```

The wash still completes and the booking still reaches Delivered — but no wash is
deducted, the booking gains a note *"Membership not applied — Membership
expired."*, and staff get an urgent alert to collect payment. An expired card
must never mean a free wash *or* a refused service.

### Test F — Security holds

```bash
# no credentials
curl -s -X POST http://localhost:5005/api/integrations/events \
  -H 'content-type: application/json' -d '{"events":[]}'
# -> 401 MISSING_CREDENTIALS

# wrong secret
node src/simulator.js --plate MH01AB1234 --secret wrong-secret
# -> 401 BAD_SIGNATURE
```

---

## Where each change is visible

| What changed | Where to look |
|---|---|
| Booking auto-advances | `/bookings` (customer), `/staff/bookings` |
| Wash sessions | `GET /api/integrations/sessions` (staff/admin) |
| Unmatched arrivals | `GET /api/integrations/unmatched` (staff/admin) |
| Raw device events | `GET /api/integrations/events` (admin) |
| Membership + ledger | `GET /api/integrations/customers/:id/usage` (staff/admin) |
| Placeholder data removed | `/admin/customers` — customers with no vehicle now show blank, not `MH01AB1234 (Hyundai Creta)` |

The first four have **no UI yet** — they are API-only, and building those screens
is the next piece of work.

---

## Automated tests

```bash
cd backend && npm test          # 187 tests
cd edge-connector && npm test   # 17 tests
```

These use a throwaway in-memory MongoDB and never touch your Atlas data.

---

## Cleaning up

```bash
cd backend && npm run demo:clean
```

Removes the demo customer, its bookings, wash sessions, device events and ledger
rows. Your real data is untouched — the backfill in Step 2 is the only thing that
wrote to existing records, and it only filled in the normalised-plate column.
