/**
 * T1 — test fixtures & harness (in-memory, no I/O).
 * Gives the contract spec and the BDD steps their shared verbs:
 *   paidOrder() · events.cancel() · refundFor() · requestRefund()
 * One oracle, two dialects: Jest and Cucumber both bind here.
 */
import { Money } from "../../shared/money";
import { RefundCalculator } from "../domain/refund-calculator";
import type { Order } from "../domain/types";

export type { Order, OrderStatus } from "../domain/types";

const orders = new Map<string, Order>();
const refunds = new Map<string, Money>();
let seq = 0;

export async function paidOrder(eventId: string): Promise<Order> {
  const order: Order = {
    id: `ord-${++seq}`,
    eventId,
    total: Money.ofCents(12_000), // €120.00 ticket
    fees: Money.ofCents(1_500), //  €15.00 service fees
    status: "PAID",
  };
  orders.set(order.id, order);
  return order;
}

export const events = {
  async cancel(eventId: string): Promise<void> {
    for (const o of orders.values()) {
      if (o.eventId === eventId && o.status === "PAID") {
        o.status = "CANCELLED_EVENT";
        const amount = new RefundCalculator().calculate(o); // T3 drives this
        refunds.set(o.id, amount);
        o.status = "REFUNDED";
      }
    }
  },
};

export async function refundFor(orderId: string): Promise<Money | undefined> {
  return refunds.get(orderId);
}

/** EARS-3: further refund requests while PENDING/ISSUED are rejected with 409. */
export async function requestRefund(
  orderId: string
): Promise<{ status: 201 | 409 }> {
  if (refunds.has(orderId)) return { status: 409 };
  const order = orders.get(orderId);
  if (!order) throw new Error(`unknown order ${orderId}`);
  const amount = new RefundCalculator().calculate(order);
  refunds.set(orderId, amount);
  order.status = "REFUNDED";
  return { status: 201 };
}

export function orderById(orderId: string): Order | undefined {
  return orders.get(orderId);
}

export function resetFixtures(): void {
  orders.clear();
  refunds.clear();
  seq = 0;
}
