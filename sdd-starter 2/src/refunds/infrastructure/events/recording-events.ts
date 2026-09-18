/** Recording RefundEventsPort — captures published events for tests/demos. */
import type { RefundEventsPort } from "../../application/ports";

export class RecordingEvents implements RefundEventsPort {
  readonly published: Array<{ orderId: string; amountCents: number; v: 1 }> = [];

  async refundIssued(event: { orderId: string; amountCents: number; v: 1 }): Promise<void> {
    this.published.push(event);
  }
}
