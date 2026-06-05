/** All amounts in integer cents. No floats cross this boundary. */
export interface PricingInput {
  price_cents: number;
  qty: number;
  tax_enabled: boolean;
  gratuity_required_pct: number | null;
  gratuity_before_tax: boolean;
  extra_tip_cents: number;
  platform_fee_cents: number; // flat per-booking fee
}

export interface LineItemsResult {
  subtotal_cents: number;
  tax_cents: number;
  gratuity_required_cents: number;
  gratuity_extra_cents: number;
  platform_fee_cents: number;
  processor_fee_cents: number;
  total_cents: number;
}

const TAX_RATE = 0.0875; // configurable per-event in real usage
const PROCESSOR_RATE = 0.029;
const PROCESSOR_FIXED = 30; // cents

export function computeLineItems(input: PricingInput): LineItemsResult {
  const subtotal = Math.round(input.price_cents * input.qty);

  // Gratuity base: before or after tax
  const gratBase = input.gratuity_before_tax
    ? subtotal
    : subtotal; // calculated on subtotal, tax added after

  const gratuityRequired = input.gratuity_required_pct
    ? Math.round(gratBase * (input.gratuity_required_pct / 100))
    : 0;

  // Tax base excludes gratuity (unless gratuity_before_tax which is pre-tax)
  const taxBase = input.tax_enabled
    ? (input.gratuity_before_tax ? subtotal + gratuityRequired : subtotal)
    : 0;
  const tax = input.tax_enabled ? Math.round(taxBase * TAX_RATE) : 0;

  const gratuityExtra = input.extra_tip_cents;
  const platformFee = input.platform_fee_cents;

  const chargeableBeforeProcessor =
    subtotal + tax + gratuityRequired + gratuityExtra + platformFee;

  const processorFee = Math.round(
    chargeableBeforeProcessor * PROCESSOR_RATE + PROCESSOR_FIXED
  );

  const total =
    chargeableBeforeProcessor + processorFee;

  return {
    subtotal_cents: subtotal,
    tax_cents: tax,
    gratuity_required_cents: gratuityRequired,
    gratuity_extra_cents: gratuityExtra,
    platform_fee_cents: platformFee,
    processor_fee_cents: processorFee,
    total_cents: total,
  };
}
