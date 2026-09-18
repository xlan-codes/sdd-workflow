/**
 * Domain types — the ubiquitous language of the Refunds bounded context.
 * Pure declarations: no I/O, no framework, nothing to mock.
 */
import { Money } from "../../shared/money";

export type OrderStatus = "PAID" | "CANCELLED_EVENT" | "REFUNDED";

/** Frozen snapshot from the Ordering context (downstream-conformist). */
export interface Order {
  id: string;
  eventId: string;
  total: Money;
  fees: Money;
  status: OrderStatus;
}

export type RefundStatus = "PENDING" | "ISSUED";

/** The Refund aggregate — keyed by orderId; that key IS the idempotency. */
export interface Refund {
  orderId: string;
  amount: Money;
  status: RefundStatus;
}
