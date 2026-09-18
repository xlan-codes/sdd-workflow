/**
 * HTTP controller (adapter) — thin by law: parse → delegate → map to the
 * OpenAPI contract (201 / 404 / 409). Framework-agnostic on purpose: plug it
 * into Express/Fastify/Lambda at the composition root; test it with a plain
 * object. Zero business logic lives here.
 */
import { invariant } from "../../../shared/guard";
import type { RefundsService } from "../../application/refunds.service";

export interface HttpRequest {
  params: { orderId?: string };
}

export interface HttpResponse {
  status: number;
  body?: unknown;
}

export class RefundsController {
  constructor(private readonly service: RefundsService) {}

  /** POST /orders/{orderId}/refunds — specs/checkout-refunds/contracts/openapi.yaml */
  async postRefund(req: HttpRequest): Promise<HttpResponse> {
    invariant(req.params.orderId, "orderId path parameter is required");
    const result = await this.service.requestRefund(req.params.orderId);
    switch (result.status) {
      case 201:
        return { status: 201, body: { orderId: req.params.orderId, amountCents: result.amountCents } };
      case 404:
        return { status: 404, body: { reason: "ORDER_NOT_FOUND" } };
      case 409:
        return { status: 409, body: { reason: "ALREADY_REFUNDED" } };
    }
  }
}
