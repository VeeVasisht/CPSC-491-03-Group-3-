# Sprint 3 — manual/exploratory test execution record

**Tester:** Steven Salinas

**Jira:** [SCRUM-217](https://wetravelproject.atlassian.net/browse/SCRUM-217)

**State:** Not executed; complete the Actual Result / Pass-Fail / Evidence cells while running the app. Do not mark the Jira task Done until these six scenarios are executed.

| ID | Steps (run using emulator-seeded posts unless stated) | Expected result | Actual result | Pass/Fail | Evidence |
|---|---|---|---|---|---|
| S3-TC11 | Open `/map`, choose *Sunset in Kyoto* in **Find a post on the map**, zoom to the marker and compare the displayed coordinates to the seeded Kyoto location `(35.0116, 135.7681)`. | Post marker visibly appears at the correct map location. | _Pending_ | _Pending_ | _Pending_ |
| S3-TC12 | Select the Kyoto post marker. | Preview identifies *Sunset in Kyoto*, the Kyoto location and its description/media where available. | _Pending_ | _Pending_ | _Pending_ |
| S3-TC13 | Click **View post** in the Kyoto marker preview. | `/posts/seed-post-01` loads the matching title, image and description. | _Pending_ | _Pending_ | _Pending_ |
| S3-TC14 | Click **Back to map** from Post Detail; also try the browser Back button after re-opening the detail. | Returns to `/map?postId=seed-post-01` focused on Kyoto through the UI link; browser Back returns to the map route. Confirm map focus/state visually. | _Pending_ | _Pending_ | _Pending_ |
| S3-TC15 | Choose several nearby markers (create/seed at least two nearby geotagged posts), click markers and inspect their previews rapidly. | Each marker is individually selectable and preview matches the selected post. | _Pending_ | _Pending_ | _Pending_ |
| S3-TC16 | Inject a post without a location and malformed/out-of-range location records in the emulator; reopen `/map` and select valid entries. | Invalid posts have no markers and the map still works without crashing. | _Pending_ | _Pending_ | _Pending_ |

## Reporting a failure

For every reproducible defect: record browser and emulator state, input post ID, exact reproduction steps, expected vs actual result, screenshot, and the linked Jira bug. For adjacent features owned by teammates, coordinate rather than duplicating their work.

## Sprint 3 release evidence

After completing both automated and manual tasks, include: the passing `npx vitest run` output, passing `npm run typecheck` and `npm run build` output, the six completed rows above, a screenshot of map marker + preview, a screenshot of correct post detail, and a PR linked to SCRUM-215/SCRUM-217. No test status in this template implies a real execution result.
