import { Money } from "../../shared/money";
import type { Order } from "./types";

/**
 * T3 — GREEN implementation (the demo's payoff).
 * Refund = ticket price minus service fees (EARS-2); amounts are integer
 * cents (EARS-1), so the subtraction is exact — Money.roundBankers (ADR-017)
 * guards any future fractional fee math in one audited place.
 */
export class RefundCalculator {
  calculate(order: Order): Money {
    const cents = Money.roundBankers(order.total.cents - order.fees.cents);
    return Money.ofCents(cents);
  }
}
