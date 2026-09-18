# Spec lifecycle at sprint boundaries — the four rules

1. **New capability → new spec folder.** The spec exists before the code
   (`specs/wallet-credit/` precedes `src/wallet/`). Planning pulls from
   approved specs only.
2. **Change to existing behavior → amendment, never a rewrite.** Append new
   EARS criteria with fresh IDs (see checkout-refunds Amendment A1: EARS-6/7);
   verified criteria are regression contracts — never renumbered, edited or
   deleted. Superseded criteria are *marked* superseded, kept for history.
3. **Tasks append; done tasks are immutable.** T7, T8… continue the sequence;
   the estimation summary grows a per-sprint line.
4. **Verification grows pending rows and coverage dips** until the new
   contracts land — the dip is the signal working, not a defect. Mid-sprint
   Verify findings reopen the spec through this same append path.
