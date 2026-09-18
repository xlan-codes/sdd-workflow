Feature: Refunds on event cancellation
  Covers EARS-2 and EARS-3 of specs/checkout-refunds/spec.md

  Background:
    Given a paid order for event "EVT-303"

  Scenario: refund on cancellation
    When the event is cancelled
    Then a refund is issued for price minus service fees
    And the order status is "REFUNDED"

  Scenario: duplicate refund request is rejected
    Given the order already has a refund in state "PENDING"
    When a refund is requested again for the same order
    Then the request is rejected with status 409
