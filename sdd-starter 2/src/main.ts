/**
 * Composition root — the only file allowed to know concrete adapters.
 * Wiring only: no logic, no conditionals beyond configuration.
 */
import { RefundsService } from "./refunds/application/refunds.service";
import { RefundsController } from "./refunds/infrastructure/http/refunds.controller";
import { InMemoryOrderSnapshotRepository } from "./refunds/infrastructure/repositories/in-memory-order-snapshot.repository";
import { InMemoryRefundRepository } from "./refunds/infrastructure/repositories/in-memory-refund.repository";
import { RecordingEvents } from "./refunds/infrastructure/events/recording-events";

export function buildApp() {
  const orders = new InMemoryOrderSnapshotRepository();
  const refunds = new InMemoryRefundRepository();
  const events = new RecordingEvents();
  const service = new RefundsService(orders, refunds, events);
  const controller = new RefundsController(service);
  return { controller, service, orders, refunds, events };
}
