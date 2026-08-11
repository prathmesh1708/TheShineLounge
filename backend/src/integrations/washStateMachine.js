// Maps hardware events onto the car-wash booking stepper that already exists in
// the product (see backend/src/models/Booking.js and the CAR_WASH_STEPS constant
// in frontend/src/staff/car-wash-staff/components/carWashJobStepper.jsx).
// Nothing here invents a new status — automation simply becomes a second writer
// alongside staff.

// Index positions must stay identical to CAR_WASH_STEPS on the frontend.
const CAR_WASH_FLOW = [
  { status: 'Pending', stepIndex: 0 },
  { status: 'Vehicle Received', stepIndex: 1 },
  { status: 'Wash Started', stepIndex: 2 },
  { status: 'Wash Completed', stepIndex: 3 },
  { status: 'Delivered', stepIndex: 4 }
];

const STATUS_TO_STEP = new Map(CAR_WASH_FLOW.map((s) => [s.status, s.stepIndex]));

// Statuses outside the wash flow that a booking can be parked in. Automation
// must not drag a cancelled job back onto the conveyor.
const TERMINAL_STATUSES = new Set(['Cancelled', 'Completed']);

const EVENT_TARGET = {
  'vehicle.entered': 'Vehicle Received',
  'wash.started': 'Wash Started',
  'wash.completed': 'Wash Completed',
  'vehicle.exited': 'Delivered'
};

// Events that carry no booking transition of their own.
const NON_TRANSITION_EVENTS = new Set(['wash.aborted', 'wash.stage_changed', 'heartbeat']);

const EVENT_TYPES = new Set([
  ...Object.keys(EVENT_TARGET),
  ...NON_TRANSITION_EVENTS
]);

// Where a booking currently sits on the wash flow. Bookings created through the
// normal customer path start as 'Confirmed', which is flow position 0 — the same
// place as 'Pending'.
const currentStep = (booking) => {
  if (!booking) return 0;
  const byStatus = STATUS_TO_STEP.get(booking.status);
  if (byStatus !== undefined) return byStatus;
  if (booking.status === 'Confirmed') return 0;
  // Unknown status (a booking parked in another service's flow): fall back to
  // the stored index so we at least never regress.
  const idx = Number(booking.stepIndex);
  return Number.isFinite(idx) ? idx : 0;
};

// The core rule: hardware may only ever move a booking forward.
//
// Events genuinely arrive out of order — a poll can surface `wash.completed`
// before the `wash.started` that preceded it, and a retried delivery can replay
// an event from ten minutes ago. Applying those naively would flick a finished
// job back to "Wash Started" in the customer's app. Staff keep the ability to
// move a job backwards; automation does not.
const decideBookingTransition = (booking, eventType) => {
  if (!EVENT_TYPES.has(eventType)) {
    return { apply: false, reason: 'UNKNOWN_EVENT' };
  }
  if (NON_TRANSITION_EVENTS.has(eventType)) {
    return { apply: false, reason: 'NO_TRANSITION' };
  }
  if (!booking) {
    return { apply: false, reason: 'NO_BOOKING' };
  }
  if (TERMINAL_STATUSES.has(booking.status)) {
    return { apply: false, reason: 'TERMINAL_STATUS' };
  }

  const targetStatus = EVENT_TARGET[eventType];
  const targetStep = STATUS_TO_STEP.get(targetStatus);
  const fromStep = currentStep(booking);

  if (targetStep < fromStep) {
    return { apply: false, reason: 'WOULD_REGRESS', fromStep, targetStep };
  }
  if (targetStep === fromStep && booking.status === targetStatus) {
    return { apply: false, reason: 'ALREADY_AT_STATE', fromStep, targetStep };
  }

  return {
    apply: true,
    reason: 'OK',
    fromStep,
    targetStep,
    status: targetStatus,
    stepIndex: targetStep
  };
};

// Wash session lifecycle, kept separate from the booking so that a cycle with no
// matched booking is still fully recorded.
const SESSION_TRANSITIONS = {
  // 'completed' is reachable straight from 'created' because on a dry-contact
  // or counter-only site the finish signal is frequently the first — and
  // sometimes the only — event a cycle ever produces.
  created: ['entered', 'washing', 'completed', 'aborted', 'abandoned'],
  entered: ['washing', 'aborted', 'completed', 'abandoned'],
  washing: ['completed', 'aborted', 'abandoned'],
  completed: ['exited', 'abandoned'],
  aborted: [],
  exited: [],
  abandoned: []
};

const EVENT_SESSION_STATE = {
  'vehicle.entered': 'entered',
  'wash.started': 'washing',
  'wash.completed': 'completed',
  'wash.aborted': 'aborted',
  'vehicle.exited': 'exited'
};

const canTransitionSession = (from, to) => {
  if (!from) return true;
  if (from === to) return false;
  return (SESSION_TRANSITIONS[from] || []).includes(to);
};

module.exports = {
  CAR_WASH_FLOW,
  STATUS_TO_STEP,
  TERMINAL_STATUSES,
  EVENT_TARGET,
  EVENT_TYPES,
  NON_TRANSITION_EVENTS,
  SESSION_TRANSITIONS,
  EVENT_SESSION_STATE,
  currentStep,
  decideBookingTransition,
  canTransitionSession
};
