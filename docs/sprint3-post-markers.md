# Sprint 3 — Post Markers & Preview (Steven)

## Goal and ownership

Show valid geotagged Firestore posts as interactive markers on the **existing** WeTravel React-Leaflet map. Clicking a marker opens a preview; **View post** navigates to the matching `/posts/:postId` document. Invalid/missing coordinates never produce a marker. This follows the Sprint 3 vertical-slice and the individual test plan.

Related Jira issues: [SCRUM-215](https://wetravelproject.atlassian.net/browse/SCRUM-215) (10 automated test cases) and [SCRUM-217](https://wetravelproject.atlassian.net/browse/SCRUM-217) (6 manual/exploratory cases).

## Architecture and integration points

- `app/map/Map.tsx`: **existing** Leaflet map retained; adds loading/empty/error/retry states, a `PostMarkers` layer, and a post selector to center a post from the seeded global data set.
- `app/map/PostMarkers.tsx`: each verified post produces one CircleMarker and a popup containing the title, location name, optional image, description, and a `/posts/<id>` link.
- `app/models/postMarker.ts`: pure mapping/validation using the team's existing `FeedPost` and `validateGeotag` contracts. No alternate post schema introduced.
- `app/services/mapPostService.ts`: reads the most recent **200** posts from the team's Firestore `posts` collection (the feed is paginated in groups of 10); normalizes using the team's existing feed model and drops corrupt post records. Non-geotagged posts are filtered by `toPostMarkers`.
- `app/map/PostDetail.tsx`, `app/routes/postDetail.tsx`, `app/routes.ts`: detail route fetches by real Firestore document ID, supports not-found/error/retry, and links back to the map focused on that post.
- `app/routes/map.tsx`: translates `?postId=...` into the map's focus prop so a return to the map recenters correctly.
- `firestore.rules`: allows **optional** author-controlled `location` updates on a post while validating the location name and coordinate ranges; does not loosen author/ownership restrictions. This fixes the preexisting block on `attachLocationToPost` in `app/services/postLocationService.ts`.

Important: This patch **does not edit `app/create_post/CreatePost.tsx` or `app/firebase/posts.ts`**, so it does not overwrite the separate media-picker work. The uploaded `main` still creates new posts without a geotag in its create-post UI; to produce markers for new posts, the post-authoring slice must call the existing `attachLocationToPost(postId, geotag)` or store a validated `location` according to the agreed team workflow. The Firebase emulator's built-in `seed-emulator.mjs` already creates geotagged sample posts for demonstrating this sprint. Agree on how the `steven` branch creates or attaches locations before merging.

## Run locally

1. Merge the Sprint 3 changes into an up-to-date feature branch based on `steven` (or the branch designated by the team), resolving any overlaps in the shared route and map files before opening a PR.
2. `npm ci`
3. `npm run typecheck`
4. `npx vitest run`
5. `npm run build`
6. Start the Firebase emulators with `firebase emulators:start` (Java 21+ required), run `npm run seed:emulator` in a second terminal, then `npm run dev`.
7. Sign in to the emulator as `feedtester@wetravel.test` / `password123`, navigate to `/map` and use **Find a post on the map** to recenter to one of the geotagged seed posts (e.g. Kyoto). Click the orange CircleMarker, inspect the preview, and click **View post**. Marker selection also records `?postId=...` in the map URL, so browser Back can restore the selected post context.
8. From Post Detail, click **Back to map**; the map recenters on the selected post using `?postId=...`.

Note: The application requires network access for OpenStreetMap tiles and must have valid Firebase/firestore configuration or running emulators to display real data.

## Tests

- `app/models/postMarker.test.ts`: S3-TC01, TC02, TC03, TC06, TC07, TC08, TC09, TC10 (8 automated cases) and supplemental malformed-data checks.
- `app/map/PostMarkers.test.tsx`: S3-TC04 and TC05 (2 automated UI cases) using a mock of Leaflet popup selection and a real React Router MemoryRouter.
- `app/services/mapPostService.test.ts`: supplemental Firestore-query, invalid-record, and correct-post lookup tests.
- `app/map/Map.test.tsx`: existing geolocation/base-map tests retained, with supplemental marker-load, retry, and post-focus checks.

The six required manual cases **S3-TC11..TC16** and a results/evidence table are in `docs/sprint3-manual-test-checklist.md`. Test runs and actual browser/Firestore behavior **must still be verified in a local npm environment**; this source package by itself is not evidence that tests pass.

## Merge considerations

Compared with the uploaded `main` snapshot, the shared files modified are `app/map/Map.tsx`, `app/map/Map.test.tsx`, `app/css/Map.css`, `app/routes.ts`, `app/routes/map.tsx`, and `firestore.rules`. All other Sprint 3 implementation files are new. If `steven` has diverged, inspect these six files carefully before applying the patch; do not overwrite an existing post-detail route with the fallback implementation without comparing both.

## Limitations / future work

- The map reads the 200 most recent Firestore posts, **not** a location-indexed or unlimited result. For a much larger dataset, implement paginated/geospatial querying in a future sprint.
- Initial center remains the existing default or user's current location; the dropdown jumps to sample posts elsewhere in the world.
- The main snapshot's create-post form does not connect to the Sprint 2 `LocationPicker`/`attachLocationToPost` path. This must be integrated in the author's post workflow (without conflicting with the `steven` media-picker branch) before a new real-world post can appear as a marker.
- GitHub `steven` could not be fetched by this sandbox, so branch-level merge and CI status are **not yet verified**.
