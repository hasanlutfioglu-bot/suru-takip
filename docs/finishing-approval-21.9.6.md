# Finishing approval — 21.9.6

Replaces the previously inferred oldest-seven scene rule with the user's actual workflow: reaching three calendar months creates a pending decision, never an automatic transfer. Month-end birthdays clamp to the last valid day of the third month. Missing/future dates and departed animals are excluded.

The scene shows a persistent reminder and the farmer can mention the pending decision. Opening it is read-only. Pressing Move to finishing validates eligibility and write access, then stores one dated note record with action finishing_start through the existing atomic save/sync flow. The note is visible in animal history and its removal reverses the scene placement. There is no automatic replacement of a sold finishing lamb with another lamb.

Confirmed transition records and pre-existing explicit Besi groups determine pen membership. Old local oldest-seven and manual presentation preferences are ignored. Weaning alone does not confirm finishing. No animal group, health, weight or financial record is modified by rendering or reminders. The saved transition animates movement to the pen; no cloud data was changed during implementation or tests.

Validation covers calendar boundaries, reminders without automatic movement, explicit approval, duplicate/invalid/young/departed guards, reload persistence, note undo and failed-save rollback. Browser tests exercise the real notice/button, transition animation and reload. The obsolete oldest-seven test was replaced by tests for the corrected workflow.
