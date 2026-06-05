import { describe, it, expect } from "vitest";
import { computeLineItems } from "./pricing.js";

describe("computeLineItems", () => {
  it("computes basic seat price with no tax or gratuity", () => {
    const r = computeLineItems({ price_cents: 9500, qty: 2, tax_enabled: false,
      gratuity_required_pct: null, gratuity_before_tax: false,
      extra_tip_cents: 0, platform_fee_cents: 400 });
    expect(r.subtotal_cents).toBe(19000);
    expect(r.tax_cents).toBe(0);
    expect(r.gratuity_required_cents).toBe(0);
    expect(r.platform_fee_cents).toBe(400);
    expect(r.total_cents).toBe(r.subtotal_cents + r.platform_fee_cents + r.processor_fee_cents);
  });

  it("computes required gratuity correctly", () => {
    const r = computeLineItems({ price_cents: 9500, qty: 2, tax_enabled: false,
      gratuity_required_pct: 18, gratuity_before_tax: false,
      extra_tip_cents: 0, platform_fee_cents: 400 });
    expect(r.gratuity_required_cents).toBe(Math.round(19000 * 0.18));
  });

  it("excludes gratuity from tax base by default", () => {
    const r = computeLineItems({ price_cents: 9500, qty: 1, tax_enabled: true,
      gratuity_required_pct: 18, gratuity_before_tax: false,
      extra_tip_cents: 0, platform_fee_cents: 400 });
    // Tax should be on subtotal only, not on gratuity
    expect(r.tax_cents).toBe(Math.round(9500 * 0.0875));
  });

  it("all money is integer cents — no floats", () => {
    const r = computeLineItems({ price_cents: 7700, qty: 3, tax_enabled: true,
      gratuity_required_pct: 20, gratuity_before_tax: false,
      extra_tip_cents: 500, platform_fee_cents: 400 });
    for (const [k, v] of Object.entries(r)) {
      expect(Number.isInteger(v), `${k} should be integer`).toBe(true);
    }
  });
});
