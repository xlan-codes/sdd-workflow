Add discount codes to our checkout.

We need percentage and fixed-amount codes. Codes should support expiry dates
and minimum order amounts. Big percentage codes shouldn't give crazy
discounts. Handle bad codes gracefully. Amounts are money, so be careful.

Implement `applyDiscount` in `src/discount.js` (CommonJS, keep the export).
Make it robust and production-ready. You may write your own tests if you want.
When you believe it is done, stop — the stakeholder will review it.
