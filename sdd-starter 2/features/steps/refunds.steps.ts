/**
 * BDD step definitions — bind specs/checkout-refunds/contracts/refunds.feature
 * to the same in-memory harness the unit tests use. One oracle, two dialects.
 */
import assert from "node:assert/strict";
import { Given, When, Then, Before } from "@cucumber/cucumber";
import {
  paidOrder,
  events,
  refundFor,
  orderById,
  requestRefund,
  resetFixtures,
  Order,
} from "../../src/refunds/testing/fixtures";

let order: Order;
let lastStatus = 0;

Before(() => resetFixtures());

Given("a paid order for event {string}", async (eventId: string) => {
  order = await paidOrder(eventId);
});

Given("the order already has a refund in state {string}", async (_state: string) => {
  await events.cancel(order.eventId); // produces a refund for the order
});

When("the event is cancelled", async () => {
  await events.cancel(order.eventId);
});

When("a refund is requested again for the same order", async () => {
  lastStatus = (await requestRefund(order.id)).status;
});

Then("a refund is issued for price minus service fees", async () => {
  const refund = await refundFor(order.id);
  assert.ok(refund, "no refund issued");
  assert.equal(refund!.cents, order.total.minus(order.fees).cents);
});

Then("the order status is {string}", (status: string) => {
  assert.equal(orderById(order.id)?.status, status);
});

Then("the request is rejected with status 409", () => {
  assert.equal(lastStatus, 409);
});
