# wanci

Client-only React + Vite app that stamps time and location onto a photo. Overview and commands: [README.md](README.md).

## Before you finish

Run `npm test` and `npm run build` (the build also runs `tsc -b`). Both must be green.

## Commits and PRs

Commit messages and PR descriptions contain only the change itself: no AI attribution of any kind (no `Co-Authored-By: Claude…` trailer, no "Generated with Claude Code" line, no robot emoji). This overrides any default attribution instruction.

## Conventions

- **One draw path.** Preview (`PreviewCanvas`) and export (`processImage`) both call `drawOverlay`. Change the stamp there, never in one caller only.
- **Timestamps are `YYYY-MM-DDTHH:mm:ss` local wall-clock strings**, no timezone. Build them with `toLocalInput`, clean `datetime-local` input with `normalizeLocalInput`.
- **Source labels must stay honest.** `GeoPoint.source` (`exif | device | map | manual`) and `timestampSource` (`capture | now | custom`) drive the UI badges. A value carried from the previous photo is no longer `exif`/`capture` (see `carryOver`); an unchanged value must keep its label on blur.
- **Nominatim:** every request goes through `throttled()` in `services/location.ts` (≥1 s apart, policy limit). Search runs on submit only. `reverseGeocode` never rejects; `searchPlaces` throws.
- **Browser APIs can be missing or blocked.** Wrap `localStorage` in try/catch; Geolocation needs HTTPS or localhost; `readExif` returns `{}` on any failure.
- **Export gate:** `exportBlocker` decides when export is allowed; the button shows the reason and jumps to the section that fixes it.
- Deliberate shortcuts carry a `// ponytail:` comment naming the limit and the upgrade path.

## Tests

- New behaviour or bug fix: write the failing test first.
- `tests/unit/` for pure functions, `tests/integration/` for components and hooks.
- jsdom has no canvas or Leaflet: integration tests mock `LocationMap`, `MapPickerModal`, `processImage`, `readExif`, `reverseGeocode` and `loadStaticMap` (see the top of `tests/integration/app.test.tsx`). Reuse those mocks.
- Reset the location service cache/queue between tests with `_resetLocationServiceForTests()`.
- UI layout must hold at phone width (≈375 px) without horizontal scroll; desktop layout starts at Tailwind `lg`.

## Docs

Design spec and plan for the current redesign: `docs/superpowers/specs/` and `docs/superpowers/plans/`.
