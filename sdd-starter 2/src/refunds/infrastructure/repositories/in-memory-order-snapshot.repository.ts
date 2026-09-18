/** In-memory OrderSnapshotPort — seedable stand-in for the Ordering context feed. */
import type { Order } from "../../domain/types";
import type { OrderSnapshotPort } from "../../application/ports";

export class InMemoryOrderSnapshotRepository implements OrderSnapshotPort {
  private readonly orders = new Map<string, Order>();

  seed(order: Order): void {
    this.orders.set(order.id, order);
  }

  async byId(orderId: string): Promise<Order | undefined> {
    return this.orders.get(orderId);
  }
}
