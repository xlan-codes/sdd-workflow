/**
 * Executable contract for task T3 (EARS-2) — derived from:
 *   specs/checkout-refunds/contracts/refunds.feature  ("refund on cancellation")
 *   specs/checkout-refunds/contracts/openapi.yaml     (POST /orders/{id}/refunds)
 *
 * This suite is RED by design until RefundCalculator is implemented (/implement T3).
 */
import { Money } from "../../shared/money";
import {
  paidOrder,
  events,
  refundFor,
  orderById,
  resetFixtures,
} from "../testing/fixtures";

describe("checkout-refunds · T3 — refund on event cancellation", () => {
  beforeEach(() => resetFixtures());

  it("refunds price minus fees when the event is cancelled", async () => {
    const order = await paidOrder("EVT-303");
    await events.cancel("EVT-303");
    expect(await refundFor(order.id)).toEqual(
      order.total.minus(order.fees) // RED — no implementation yet (T3)
    );
  });

  it("sets the order status to REFUNDED", async () => {
    const order = await paidOrder("EVT-303");
    await events.cancel("EVT-303");
    expect(orderById(order.id)?.status).toEqual("REFUNDED");
  });

  it("amounts are minor units (EARS-1)", () => {
    expect(Money.ofCents(12_000).minus(Money.ofCents(1_500))).toEqual(
      Money.ofCents(10_500)
    );
  });
});
