import { Money } from "../../shared/money";
import type { Order } from "./types";

/**
 * T3 — implement per EARS-2 (refund = ticket price minus service fees).
 * Contract: specs/checkout-refunds/contracts/refunds.feature ("refund on cancellation")
 * Rounding: banker's, per ADR-017 — via Money.roundBankers, nowhere else.
 * Pure domain service: no I/O in here, ever.
 */
export class RefundCalculator {
  calculate(order: Order): Money {
    throw new Error("NotImplemented — task T3 (see specs/checkout-refunds/tasks.md)");
  }
}
