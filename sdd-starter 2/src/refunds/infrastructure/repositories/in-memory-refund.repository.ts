/** In-memory RefundRepository — test/demo adapter; production swaps this at src/main.ts. */
import type { Refund } from "../../domain/types";
import type { RefundRepository } from "../../application/ports";

export class InMemoryRefundRepository implements RefundRepository {
  private readonly byId = new Map<string, Refund>();

  async byOrderId(orderId: string): Promise<Refund | undefined> {
    return this.byId.get(orderId);
  }

  async save(refund: Refund): Promise<void> {
    this.byId.set(refund.orderId, refund);
  }
}
