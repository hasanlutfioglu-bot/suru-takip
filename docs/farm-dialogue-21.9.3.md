# Character dialogue — 21.9.3

- Farmer speech uses existing due health reminders, ram introduction/removal plans and weighing logic. Vaccination wording is used only when the saved health note identifies vaccination. No vaccine or breeding dates are invented.
- Due/overdue plans are selected; completed health reminders, completed ram actions, future dates and departed animals are excluded. Target-weight wording explicitly identifies an estimate; the existing 21-day weighing interval and missing first measurement are handled separately.
- Observation speech is limited to active animals marked Takipte. It does not diagnose illness. One speech item is visible at a time; its animal is prioritized within the representative figure limit.
- A readable HTML speech card accompanies the SVG bubble. Clicking opens the animal card, weighing form or ram calendar; opening/dismissing never completes the underlying task.
- Visits last 16 seconds with at least 45 seconds between them; the same reminder is suppressed for 30 minutes. Cooldown and mute are device-local and scoped to the active farm. Night, pause, other screens, hidden tabs, reduced motion and recorded events suppress dialogue.
- Recorded feeding uses a farmer arrival/pour/departure sequence with the selected animals approaching the trough. The ambient daytime farmer also draws finishing-pen animals toward the trough during his decorative bucket cycle. Neither animation creates a consumption transaction or changes stock.
- Validation: unit and Chromium coverage of due/completed/invalid/departed reminders, persistent cooldown/mute, farm isolation, speech navigation, HTML escaping, real feeding form, stock conservation, actor pause and phone layouts. No production Supabase data accessed or changed.
