# Design: Redesign + Location Stamping

**Date:** 2026-11-05
**Base document:** [`docs/design/IMPLEMENTATION.md`](../../design/IMPLEMENTATION.md) (referred to below as **IMPL**). Its visual design is in [`docs/design/design.pen`](../../design/design.pen), with PNG exports in `docs/design/exports/`.

This document says what to build. Wherever it differs from IMPL, **this document wins**. When it says "as IMPL §N", follow that section unchanged.

## 1. Intent

People use the app to stamp photos for administrative proof, such as visits or check-ins. They send each stamped photo to a supervisor. The supervisor **rejects any photo whose time or location is missing**. Nothing else gets a photo rejected.

The supervisor trusts the stamp. Setting the time by hand, picking a place on a map, or typing coordinates are all legitimate. The tool proves nothing and enforces nothing beyond "time and location are present".

The usual workflow: take photos on a phone at the site, then **upload them later from a laptop, somewhere else and at another time**. Sometimes people upload from a phone on the spot instead.

Users: the owner and their coworkers. The owner self-hosts the app. There are no accounts or logins.

## 2. Goals, non-goals, anti-goals

**Goals**
- The visual redesign in `design.pen`: dark workspace, preview-first, fixed right-hand inspector on desktop.
- The stamp has three lines: time, coordinates, and place name. Coordinates and place name can each be toggled off.
- Location comes from photo EXIF first, then from the map picker (search or pin), "Use my location", or typed lat/lng.
- **Export is blocked until a location is set.**
- Works well on phones (layout B, §6) as well as laptops.

**Non-goals (cut from IMPL)**
- **The map watermark, entirely.** Cut: IMPL §6.2, `src/utils/mapTile.ts`, `MapWatermarkSection`, the `MapWatermark` type and `map` field, the CORS spike, the satellite provider (IMPL §10.1), and Phase 3. The stamp is text only.
- Paid or keyed tile providers.
- Proving authenticity: no EXIF locking, no tamper detection, no "edited" flags.
- Accounts, history, or batch processing. It stays one photo at a time (IMPL §1, FR-001 to FR-010).

**Anti-goals: the work fails if any of these happen, even if everything else works**
- A photo exports without a location. The supervisor rejects it.
- The app quietly stamps the upload time as if it were the capture time, and the user doesn't notice.
- The app is too strict to use, for example because it requires EXIF or refuses manual input.
- The photo file itself leaves the browser.

## 3. Constraints

- Stack: React 18 + Vite + Tailwind + TypeScript, as today. Use `react-leaflet@4`, not v5, which needs React 19 (IMPL §2).
- Dependencies: `exifr`, `leaflet`, `react-leaflet@4`, `@types/leaflet`. No map library on the export path, because there's no map in the export.
- Hosting: self-hosted, **served over HTTPS**. The Geolocation API needs a secure context.
- Usage is internal to a business, which is effectively commercial. That is why the tiles are OSM standard and not CARTO. Stay within the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/) and the Nominatim policy (IMPL §5.2): at most 1 request/s, search on submit only, results cached, attribution visible.
- Export stays at original resolution and in the original format (JPEG/PNG). The canvas export strips EXIF, as today.

## 4. Behaviour

### 4.1 Timestamp

- The source segment offers **Capture time / Now / Custom**, as IMPL.
- **Default:** Capture time when EXIF `DateTimeOriginal` exists, otherwise **Now**.
- **When the default fell back to Now because the photo has no capture time**, show a note under the timestamp field: *"No capture time in photo. Using current time."* It stays visible while the source is Now and the photo has no EXIF time. It disappears once the user picks Custom.
- Custom means the user edits the value by hand. Typing into the field switches the source to Custom.
- The field is a native `<input type="datetime-local" step="1">`, so it can't hold a garbled value. If the user clears it, export is blocked (§4.4).

### 4.2 Location sources

Listed by expected frequency:

1. **EXIF GPS**, read on upload (IMPL §5.3). The panel shows the "FROM PHOTO" badge.
2. **Map picker** (`MapPickerModal`): search on submit and a draggable pin, as IMPL §7 and design `A0a8p`/`g5ojk`. This is the main fallback when EXIF has no GPS.
3. **Use my location**: Geolocation API, as IMPL §5.1, with the states from IMPL §8 (locating, denied, error, ready/device with the `GPS ±N m` badge). **It stays**, for uploading on the spot. Hide it when `navigator.geolocation` is missing.
4. **Typed LAT/LNG**: last resort. Parse and validate it as IMPL §4.

Any source can override any other at any time.

**Empty-state primary action depends on the layout** (overrides IMPL §8's "empty" row):
- Desktop: **Pick on map** is primary and "Use my location" is secondary. A laptop is usually somewhere other than where the photo was taken.
- Phone: **Use my location** is primary and "Pick on map" is secondary.
- On desktop, a device fix shows a note under the map: *"This is where you are now, not necessarily where the photo was taken."*

### 4.3 Place name

Reverse-geocode with Nominatim, using the format, debounce, cache and failure handling from IMPL §5.2. Under the Location header, show the line *"Place names by OpenStreetMap"*.

### 4.4 Export gate (overrides IMPL §4 "A null location is valid")

The rule: **Export is enabled only when the stamp will actually print a time and at least one location line.** In terms of state:

- the timestamp is non-empty, **and**
- a location is set, **and**
- at least one location line will print: `showCoords`, or `showPlace` with a place name that has resolved.

When the gate is closed:
- Desktop: the button in the top bar is disabled.
- Phone: the bottom bar button is disabled.
- Next to or under the disabled button, a short reason: *"Add a location to export"*, *"Add a time to export"* or *"Turn on coordinates or place name"*. Clicking or tapping it, or the reason, takes the user to the relevant section. On a phone, that means switching to the right tab.

`showCoords` and `showPlace` both default to **on**. With coordinates on, a place-name lookup that fails or is still pending does not block export. The stamp just omits the place line.
- Export busy and failure states: as IMPL §8.

### 4.5 Replacing the photo, and Reset

The owner chose this: **settings carry over to the next photo.** Several photos from one visit are usually uploaded one after another.

- **Replace photo** keeps the location, place name, toggles, timestamp source and value, and style.
- **Exception, the new photo's own EXIF wins:**
  - GPS in the new photo replaces the carried location.
  - `DateTimeOriginal` in the new photo switches the timestamp to Capture time with that value.
  - With no EXIF, the carried values stay. A carried "Now" refreshes to the current time.
- **Reset button** (owner's request) returns every setting to its default for the current photo:
  - location and place name cleared, unless the photo has EXIF GPS
  - timestamp re-derived per §4.1
  - toggles on
  - style back to its defaults
  - Placement (my call): a ghost button in the top bar next to Replace photo, on desktop and phone. No confirmation dialog.

### 4.6 Stamp contents

Drawn by `drawOverlay` (IMPL §6 and §6.1, **minus the `mapTile` parameter**):

1. Timestamp, always.
2. `lat, lng` to 5 decimals, if `showCoords`.
3. Place name, if `showPlace` and a name exists.

Wait for the Geist Mono font to load before drawing (IMPL §6.1).

## 5. Data model changes from IMPL §4

- Remove `MapWatermark` and `OverlayMetadata.map`.
- Keep `LocationSource`, `GeoPoint`, `TimestampSource`, `placeName`, `showCoords` and `showPlace` exactly as IMPL.
- `validateLocation` takes numbers, as IMPL. **A null location is invalid for export.**

## 6. Layout

### 6.1 Desktop (≥ 1024 px)

Use the Editor design (`OMNiO`) **without the Map watermark section**. The inspector stacks three sections: Timestamp, Location, Overlay style. Everything else is as IMPL §7: the top bar with Export, the 380 px scrolling inspector, and the staged preview.

### 6.2 Phone and tablet (< 1024 px): layout B

The user chose this layout from mockups in the brainstorm. It replaces IMPL's "bottom sheet".

```
┌─────────────────────────┐
│ ▣ stamp        Replace  │  top bar: brand + Replace photo (no Export)
├─────────────────────────┤
│                         │
│     photo preview       │  pinned: stays on screen while editing
│            2026-11-05…  │
├─────────────────────────┤
│  Time │ Location │ Style│  tabs, one section visible at a time
├─────────────────────────┤
│                         │
│  active section         │  scrolls independently
│                         │
├─────────────────────────┤
│ [    ⤓ Export JPG     ] │  sticky full-width bottom bar
└─────────────────────────┘
```

- The tabs map one-to-one onto the desktop sections, so the same section components render in both layouts.
- The map picker opens full-screen on phones.
- File input: `accept="image/jpeg,image/png"`, so phones offer both the camera and the gallery. Photos taken through the browser camera often have no GPS. In that case the empty Location state's "Use my location" is the obvious next step.
- The upload screen (`MmTse`) restacks to a single column. Drag-and-drop is desktop-only.
- Minimum usable width: 360 px.

## 7. Map tiles (overrides IMPL §5.4)

- One style everywhere: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, with the attribution "© OpenStreetMap contributors" shown on every map.
- It's a light map inside a dark UI. **The owner accepted this.** Don't add dark-mode CSS filters to the tiles.
- Maps are only shown in the panel (`LocationMap`, non-interactive) and the picker. No tiles touch the canvas, so there's no CORS or tainted-canvas concern.

## 8. Tests (changes from IMPL §9)

- Drop `mapTile.test.ts`, the CORS spike, and the 605 px map manual check.
- `drawOverlay.test.ts`: test only the line combinations, with no `drawImage` map assertions.
- Add tests:
  - The export gate covers each closed case from §4.4 (no location, no time, no location line will print) and the open case.
  - The "No capture time" note shows only when EXIF has no time and the source is Now.
  - Replace photo carries settings over, the new photo's EXIF overrides them, and Reset restores defaults.
- Integration test updates as IMPL §9, plus the export gate.
- Manual checks:
  - A phone, 360–430 px wide: all three tabs usable, Export reachable, picker full-screen.
  - Upload a photo without EXIF from a laptop: the note shows and Export stays disabled until a location is picked.
  - Export with no network: place name missing, export still succeeds.

## 9. Build order (replaces IMPL §11)

| Phase | Work | Done when |
| --- | --- | --- |
| 1 | Tokens, fonts, `drawOverlay` extraction, new data model, `TopBar`/`Inspector` shell, restyle Upload and the existing controls | Same functionality as today in the new look; tests green |
| 2 | EXIF read, timestamp source + the "No capture time" note, `useLocation` + Geolocation, `LocationSection` with all states, Nominatim reverse geocode, place-name line, **export gate**, carry-over on Replace + **Reset** | All location states reachable; place name stamps; no export without a printed location; settings carry over and reset |
| 3 | `MapPickerModal` (search on submit, draggable pin), phone layout B (tabs, pinned preview, sticky Export, full-screen picker) | Location can be set without device permission; app usable at 360 px |

## 10. Calls made during writing (not discussed explicitly)

- **Tablets use the phone layout.** The breakpoint stays at IMPL's 1024 px.
- **"Place names by OpenStreetMap" note** under the Location header (IMPL §10.4 suggested it).
- **Typing in the timestamp field switches the source to Custom**, so the user never has to pick Custom first.
- **The disabled Export shows a reason and jumps to the right section**, so a blocked export never looks broken.
- **The export gate checks what will actually print**, not just whether a location is set. A photo with both location lines toggled off would also be rejected.
- **The timestamp is a native date-time input**, so it can't hold a garbled value. Clearing it blocks export.
- **On Replace, the new photo's EXIF overrides carried values.** Otherwise a carried location could silently stamp the wrong site onto a geotagged photo.
- **Reset sits in the top bar with no confirmation.** It's cheap to redo, and a confirmation dialog would be friction on every visit.
- **The empty-state primary action differs by layout:** Pick on map on desktop, Use my location on phone. A desktop device fix gets a "where you are now" note.

## 11. Left to the builder

- Component internals, hook boundaries, and test structure, within IMPL §7's file map minus `MapWatermarkSection`.
- Exact spacing and type for layout B, following IMPL §3 tokens and the mockup above.
- How the Location tab draws attention when a disabled Export sends the user there.
