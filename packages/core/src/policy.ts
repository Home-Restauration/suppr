export interface PolicyWindow {
  hours_before: number;
  refund_pct: number;
}

export interface PolicySet {
  cancellation: PolicyWindow[];
  reschedule: PolicyWindow[];
  transfer: PolicyWindow[];
  name_change: PolicyWindow[];
}

export type ModifyAction = "cancel" | "reschedule" | "transfer" | "name_change";

export interface PolicyCheckResult {
  allowed: boolean;
  refund_pct: number;
  refund_cents: number;
  message: string;
}

export function checkPolicy(
  action: ModifyAction,
  policy: PolicySet,
  eventStartsAt: Date,
  now: Date,
  paidCents: number
): PolicyCheckResult {
  const windows = policy[action === "name_change" ? "name_change" : action];
  const hoursUntilEvent = (eventStartsAt.getTime() - now.getTime()) / 3_600_000;

  if (hoursUntilEvent <= 0) {
    return { allowed: false, refund_pct: 0, refund_cents: 0, message: "Event has already started." };
  }

  // Find the most generous applicable window
  const applicable = windows
    .filter(w => hoursUntilEvent >= w.hours_before)
    .sort((a, b) => b.hours_before - a.hours_before)[0];

  if (!applicable) {
    return { allowed: false, refund_pct: 0, refund_cents: 0, message: "Outside the allowed window for this change." };
  }

  const refund_cents = Math.round(paidCents * (applicable.refund_pct / 100));
  return {
    allowed: true,
    refund_pct: applicable.refund_pct,
    refund_cents,
    message: applicable.refund_pct === 100
      ? "Full refund will be issued."
      : `${applicable.refund_pct}% refund will be issued.`,
  };
}
