/**
 * Application service (imperative shell) — orchestrates the use case:
 * idempotency check (EARS-3), pure calculation (EARS-2, domain core),
 * state transition, domain event. Depends only on ports (DIP); wired at
 * the composition root (src/main.ts). CQS: a command that reports status.
 */
import { RefundCalculator } from "../domain/refund-calculator";
import type { OrderSnapshotPort, RefundEventsPort, RefundRepository } from "./ports";

export interface RequestRefundResult {
  status: 201 | 404 | 409;
  amountCents?: number;
}

export class RefundsService {
  constructor(
    private readonly orders: OrderSnapshotPort,
    private readonly refunds: RefundRepository,
    private readonly events: RefundEventsPort,
    private readonly calculator: RefundCalculator = new RefundCalculator()
  ) {}

  async requestRefund(orderId: string): Promise<RequestRefundResult> {
    // EARS-3 — WHILE a refund is PENDING or ISSUED, further requests → 409.
    if (await this.refunds.byOrderId(orderId)) return { status: 409 };

    const order = await this.orders.byId(orderId);
    if (!order) return { status: 404 };

    // EARS-2 — pure domain core computes; the shell never does math.
    const amount = this.calculator.calculate(order);

    await this.refunds.save({ orderId, amount, status: "ISSUED" });
    await this.events.refundIssued({ orderId, amountCents: amount.cents, v: 1 });
    return { status: 201, amountCents: amount.cents };
  }
}
