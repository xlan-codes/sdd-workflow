/**
 * Payments bounded context — PSP adapter (OUT OF SCOPE for checkout-refunds).
 * This file exists so the live demo can prove the resource gate: any task
 * whose Touches don't include src/payments/** is blocked from editing it.
 */
export class PspClient {
  async capture(_orderId: string, _amountCents: number): Promise<void> {
    throw new Error("NotImplemented — Payments context, different spec");
  }
}
