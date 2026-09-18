# solution/ — the demo safety net

- `refund-calculator.stub.ts` — the RED state (throws NotImplemented).
- `refund-calculator.solution.ts` — the GREEN implementation of T3.

`npm run demo:green` swaps the solution in (suite + BDD go green);
`npm run demo:red` restores the stub. Live-code T3 when the demo gods smile;
run `demo:green` when they don't. Reset to RED before every session.
