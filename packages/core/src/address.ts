export type AddressRule = "always" | "on_confirmation" | "before_event";

export function shouldReleaseAddress(
  rule: AddressRule,
  bookingConfirmed: boolean,
  eventStartsAt: Date,
  releaseHours: number | null,
  now: Date
): boolean {
  switch (rule) {
    case "always":
      return true;
    case "on_confirmation":
      return bookingConfirmed;
    case "before_event": {
      const hours = releaseHours ?? 24;
      const releaseAt = new Date(eventStartsAt.getTime() - hours * 3_600_000);
      return bookingConfirmed && now >= releaseAt;
    }
  }
}
