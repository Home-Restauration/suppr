import { describe, it, expect } from "vitest";
import { checkPolicy } from "./policy.js";

const policy = {
  cancellation: [{ hours_before: 72, refund_pct: 100 }, { hours_before: 24, refund_pct: 50 }],
  reschedule: [{ hours_before: 48, refund_pct: 100 }],
  transfer: [{ hours_before: 24, refund_pct: 0 }],
  name_change: [{ hours_before: 2, refund_pct: 0 }],
};

const event = new Date(Date.now() + 80 * 3_600_000); // 80 hours from now

it("allows full refund cancel when >72h out", () => {
  const r = checkPolicy("cancel", policy, event, new Date(), 19000);
  expect(r.allowed).toBe(true);
  expect(r.refund_cents).toBe(19000);
});

it("allows partial refund cancel when 24-72h out", () => {
  const now = new Date(event.getTime() - 48 * 3_600_000);
  const r = checkPolicy("cancel", policy, event, now, 19000);
  expect(r.allowed).toBe(true);
  expect(r.refund_pct).toBe(50);
});

it("denies cancel when <24h out", () => {
  const now = new Date(event.getTime() - 10 * 3_600_000);
  const r = checkPolicy("cancel", policy, event, now, 19000);
  expect(r.allowed).toBe(false);
});

it("denies all actions when event has passed", () => {
  const past = new Date(Date.now() - 3_600_000);
  const r = checkPolicy("cancel", policy, past, new Date(), 19000);
  expect(r.allowed).toBe(false);
});
