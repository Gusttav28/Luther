# Current specification progress

- Work item: main-cash-planned-savings (`specs/main-cash-planned-savings/`)
- Branch: `cursor/main-cash-planned-savings-ef43`
- Spec package: 2026-09-09 (amended same day: Already charged reduces Main)
- Spec Author session: 2026-09-09
- Handoff: **SPEC_READY**

## Outcome

Overview Main matches the cash typed on Balance Main. **Already charged** subtracts that expense from stored Main (example: ₡73,233 − ₡10,000 → ₡63,233); Planned expenses drops because the row is no longer Planning. Leftover for the 70% save is **current** Main minus this month’s remaining Planning. If Main cannot cover those bills, take is 0. If nothing remains to charge, take is 70% of current Main. Overview third card is **Planned expenses**. **From planned salary** is removed.

## Amendment (same day)

Owner confirmed leftover = Main − remaining Planning, then asked that marking an expense Already charged also reduce Main (and restore on un-charge). Requirements R1/R8/R10, design, and T8/TV4 now include that. Leftover still does **not** subtract charged a second time.

## Notes for the owner

Waiting for owner **GO** on this amended spec before implementation. Do not treat the earlier leftover-only draft as approved.

## Leader

Routed Spec Author to finish the charge→Main amendment. Implementation is blocked until GO.
