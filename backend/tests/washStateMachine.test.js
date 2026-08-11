const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CAR_WASH_FLOW,
  currentStep,
  decideBookingTransition,
  canTransitionSession
} = require('../src/integrations/washStateMachine');

const booking = (status, stepIndex) => ({ status, stepIndex });

test('the flow matches the frontend stepper exactly', () => {
  // Drifting from CAR_WASH_STEPS in carWashJobStepper.jsx would silently
  // mis-render every customer's progress bar.
  assert.deepEqual(
    CAR_WASH_FLOW.map((s) => s.status),
    ['Pending', 'Vehicle Received', 'Wash Started', 'Wash Completed', 'Delivered']
  );
  CAR_WASH_FLOW.forEach((s, i) => assert.equal(s.stepIndex, i));
});

test('currentStep maps every flow status and treats Confirmed as the start', () => {
  assert.equal(currentStep(booking('Pending', 0)), 0);
  assert.equal(currentStep(booking('Confirmed', 0)), 0);
  assert.equal(currentStep(booking('Vehicle Received', 1)), 1);
  assert.equal(currentStep(booking('Wash Started', 2)), 2);
  assert.equal(currentStep(booking('Wash Completed', 3)), 3);
  assert.equal(currentStep(booking('Delivered', 4)), 4);
  assert.equal(currentStep(null), 0);
});

test('currentStep trusts status over a contradictory stepIndex', () => {
  // Staff screens have historically written the two out of sync.
  assert.equal(currentStep(booking('Wash Completed', 0)), 3);
});

test('currentStep falls back to stepIndex for a status outside this flow', () => {
  assert.equal(currentStep(booking('Kitchen Preparing', 2)), 2);
  assert.equal(currentStep(booking('Kitchen Preparing', undefined)), 0);
});

// ── forward transitions ────────────────────────────────────────────────────

test('each event advances the booking to its mapped status', () => {
  const cases = [
    ['vehicle.entered', 'Confirmed', 'Vehicle Received', 1],
    ['wash.started', 'Vehicle Received', 'Wash Started', 2],
    ['wash.completed', 'Wash Started', 'Wash Completed', 3],
    ['vehicle.exited', 'Wash Completed', 'Delivered', 4]
  ];
  for (const [event, from, toStatus, toStep] of cases) {
    const d = decideBookingTransition(booking(from, currentStep(booking(from))), event);
    assert.equal(d.apply, true, `${event} from ${from}`);
    assert.equal(d.status, toStatus);
    assert.equal(d.stepIndex, toStep);
  }
});

test('a skipped step still advances rather than stalling', () => {
  // The tunnel reports completion but the start event was lost.
  const d = decideBookingTransition(booking('Confirmed', 0), 'wash.completed');
  assert.equal(d.apply, true);
  assert.equal(d.status, 'Wash Completed');
  assert.equal(d.stepIndex, 3);
});

// ── the monotonic guarantee ────────────────────────────────────────────────

test('automation never moves a booking backwards', () => {
  // A retried or out-of-order delivery must not flick a finished job back to
  // "Wash Started" in the customer's app.
  const d = decideBookingTransition(booking('Wash Completed', 3), 'wash.started');
  assert.equal(d.apply, false);
  assert.equal(d.reason, 'WOULD_REGRESS');
});

test('a replayed entry event on a delivered booking is ignored', () => {
  const d = decideBookingTransition(booking('Delivered', 4), 'vehicle.entered');
  assert.equal(d.apply, false);
  assert.equal(d.reason, 'WOULD_REGRESS');
});

test('re-delivering the same event is a no-op', () => {
  const d = decideBookingTransition(booking('Wash Started', 2), 'wash.started');
  assert.equal(d.apply, false);
  assert.equal(d.reason, 'ALREADY_AT_STATE');
});

test('a cancelled or completed booking is never touched by hardware', () => {
  assert.equal(decideBookingTransition(booking('Cancelled', 0), 'vehicle.entered').reason, 'TERMINAL_STATUS');
  assert.equal(decideBookingTransition(booking('Completed', 4), 'wash.started').reason, 'TERMINAL_STATUS');
});

test('events that carry no transition are declined cleanly', () => {
  assert.equal(decideBookingTransition(booking('Wash Started', 2), 'wash.aborted').reason, 'NO_TRANSITION');
  assert.equal(decideBookingTransition(booking('Wash Started', 2), 'wash.stage_changed').reason, 'NO_TRANSITION');
});

test('unknown events and missing bookings are rejected, not guessed at', () => {
  assert.equal(decideBookingTransition(booking('Pending', 0), 'wash.exploded').reason, 'UNKNOWN_EVENT');
  assert.equal(decideBookingTransition(null, 'vehicle.entered').reason, 'NO_BOOKING');
});

test('applying every event in reverse order still lands the booking forward-only', () => {
  let b = booking('Confirmed', 0);
  const shuffled = ['vehicle.exited', 'wash.started', 'vehicle.entered', 'wash.completed'];
  for (const e of shuffled) {
    const d = decideBookingTransition(b, e);
    if (d.apply) b = booking(d.status, d.stepIndex);
  }
  assert.equal(b.status, 'Delivered');
  assert.equal(b.stepIndex, 4);
});

// ── session lifecycle ──────────────────────────────────────────────────────

test('session transitions follow the physical order of a tunnel cycle', () => {
  assert.equal(canTransitionSession(null, 'entered'), true);
  assert.equal(canTransitionSession('created', 'entered'), true);
  assert.equal(canTransitionSession('entered', 'washing'), true);
  assert.equal(canTransitionSession('washing', 'completed'), true);
  assert.equal(canTransitionSession('completed', 'exited'), true);
});

test('a session cannot go backwards, repeat itself, or leave a terminal state', () => {
  assert.equal(canTransitionSession('washing', 'entered'), false);
  assert.equal(canTransitionSession('completed', 'washing'), false);
  assert.equal(canTransitionSession('washing', 'washing'), false);
  assert.equal(canTransitionSession('aborted', 'completed'), false);
  assert.equal(canTransitionSession('exited', 'entered'), false);
});

test('a cycle can abort from any live state', () => {
  assert.equal(canTransitionSession('created', 'aborted'), true);
  assert.equal(canTransitionSession('entered', 'aborted'), true);
  assert.equal(canTransitionSession('washing', 'aborted'), true);
});

test('a completion with no observed start is allowed at session level', () => {
  assert.equal(canTransitionSession('entered', 'completed'), true);
});

test('a completion can be the very first event a cycle produces', () => {
  // Dry-contact and counter-only installations often report nothing but the
  // finish signal; refusing it there would lose every wash on those sites.
  assert.equal(canTransitionSession('created', 'completed'), true);
  assert.equal(canTransitionSession(null, 'completed'), true);
});
