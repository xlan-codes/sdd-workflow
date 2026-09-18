/**
 * Ports (hexagonal architecture) — the application layer depends on THESE,
 * never on Dynamo, HTTP or a message bus (DIP). Kept narrow (ISP) so test
 * doubles stay five lines long.
 */
import type { Order, Refund } from "../domain/types";

/** Frozen order data from the Ordering context. */
export interface OrderSnapshotPort {
  byId(orderId: string): Promise<Order | undefined>;
}

/** Repository for the Refund aggregate — the idempotency backbone. */
export interface RefundRepository {
  byOrderId(orderId: string): Promise<Refund | undefined>;
  save(refund: Refund): Promise<void>;
}

/** Domain events out of the Refunds context (upstream to Notification). */
export interface RefundEventsPort {
  refundIssued(event: { orderId: string; amountCents: number; v: 1 }): Promise<void>;
}
