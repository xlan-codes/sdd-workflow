/** Money in minor units (cents) — EARS-1. Value object: compare with toEqual. */
export class Money {
  private constructor(readonly cents: number) {
    if (!Number.isInteger(cents)) {
      throw new Error(`Money must be integer cents, got ${cents}`);
    }
  }

  static ofCents(cents: number): Money {
    return new Money(cents);
  }

  minus(other: Money): Money {
    return new Money(this.cents - other.cents);
  }

  /**
   * Banker's rounding (half-to-even) — ADR-017.
   * Applied once, at the final fee subtraction. No intermediate rounding.
   */
  static roundBankers(value: number): number {
    const floor = Math.floor(value);
    const diff = value - floor;
    if (diff > 0.5) return floor + 1;
    if (diff < 0.5) return floor;
    return floor % 2 === 0 ? floor : floor + 1;
  }
}
