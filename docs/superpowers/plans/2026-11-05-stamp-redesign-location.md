# Stamp Redesign + Location Stamping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the photo stamper to the `design.pen` dark workspace, and stamp time, coordinates and place name. Location comes from EXIF, the device, a map picker or typed input. Export is blocked unless the stamp prints a time and a location.

**Architecture:** Pure logic lives in `src/utils` (metadata defaults and carry-over, the export gate, `drawOverlay`) and is unit-tested. Network and browser calls (EXIF, Geolocation, Nominatim) live in `src/services`. Components never call `fetch` or `navigator` directly. `App` owns `photo`, `metadata` and `keepSettings`. One component tree serves both layouts: CSS (`lg:`) switches between the stacked inspector and the phone tabs. `useIsDesktop()` is used only where behaviour, not just layout, differs.

**Tech Stack:** React 18, Vite 5, Tailwind 3, TypeScript, Vitest + Testing Library (jsdom). New: `exifr`, `leaflet`, `react-leaflet@4`, `@types/leaflet`.

**Spec:** `docs/superpowers/specs/2026-11-05-stamp-redesign-location-design.md`, which builds on `docs/design/IMPLEMENTATION.md` (IMPL). The spec wins where they differ. Visual reference: `docs/design/exports/*.png`. Read `design.pen` only through the pencil MCP tools.

## Global Constraints

- `react-leaflet` must be **v4** (v5 needs React 19).
- No map on the canvas. No `mapTile`, `MapWatermark` or `map` field anywhere.
- Tiles: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, attribution `© OpenStreetMap contributors` on every map. No CSS filters on tiles.
- Nominatim: at most 1 request/s across the app, search on submit only (never as you type), cache keyed by `lat.toFixed(5),lng.toFixed(5)`, reverse lookups debounced 800 ms.
- Tokens: exactly IMPL §3 (`bg`, `surface`, `line`, `ink`, `accent`, `ok`, `danger`, Geist / Geist Mono).
- Stamp font: `${fontSize}px "Geist Mono", ui-monospace, monospace`. Keep the existing shadow and the 2%-of-longest-side padding.
- Export: original resolution and format; filename `<name>_edited.jpg|png` (unchanged).
- Breakpoint: `lg` (1024 px). Below it is phone layout B; the minimum usable width is 360 px.
- `localStorage` key `stamp.keepSettings`. Wrap every access in try/catch; the default is `true`.
- Copy fixed by the spec:
  - `No capture time in photo. Using current time.`
  - `Add a location to export`
  - `Add a time to export`
  - `Turn on coordinates or place name`
  - `Place names by OpenStreetMap`
  - `This is where you are now, not necessarily where the photo was taken.`
  - `Couldn't get a fix. Try again or pick on map.`
  - `Place name unavailable`
  - `Export JPG` / `Export PNG`
  - `Exporting…`
  - `Keep settings for next photo`
  - `Reset`

## Review Focus

1. **Comma decimals in typed coordinates** (`-8,43221`, common with an Indonesian keyboard locale) should parse like dots. Test in Task 1.
2. **EXIF GPS of exactly `0,0`.** Some phones write this when they had no fix, so treat it as no GPS. Test in Task 5.
3. **EXIF capture time must stamp the camera's wall-clock time**, not shifted by the uploader's timezone. Test in Task 1 (`toLocalInput`) and Task 5.
4. **A reverse lookup still in flight when the location changes** (new photo, pin moved) must not overwrite the new place name. Test in Task 7.
5. **`localStorage` throwing** (private mode, blocked storage) must leave Keep settings on and the app working. Test in Task 4.

---

## File map

| File | Status | Responsibility |
| --- | --- | --- |
| `src/types/index.ts` | modify | IMPL §4 types minus `MapWatermark`/`map`; `PhotoExif`; `SectionId` |
| `src/utils/validation.ts` | modify | `validateTimestamp`, numeric `validateLocation`, `parseCoordinate` |
| `src/utils/metadata.ts` | create | `toLocalInput`, `formatStampTime`, `defaultMetadata`, `carryOver`, `DEFAULT_STYLE` |
| `src/utils/exportGate.ts` | create | `exportBlocker`, `BLOCK_REASON`, `BLOCK_SECTION` |
| `src/utils/drawOverlay.ts` | create | `stampLines`, `drawOverlay`, `loadStampFont` |
| `src/utils/imageProcessing.ts` | modify | `processImage` uses `drawOverlay` |
| `src/utils/loadPhoto.ts` | create | File → `UploadedPhoto` (type check, bitmap, EXIF) |
| `src/services/exif.ts` | create | `readExif` |
| `src/services/location.ts` | create | Geolocation + Nominatim |
| `src/hooks/useIsDesktop.ts` | create | `matchMedia('(min-width: 1024px)')` |
| `src/hooks/useDeviceLocation.ts` | create | locating / denied / error status, cancel |
| `src/hooks/usePlaceName.ts` | create | debounced reverse geocode into metadata |
| `src/components/ui/Segmented.tsx`, `ui/Switch.tsx` | create | primitives |
| `src/components/TopBar.tsx`, `ExportButton.tsx` | create | top bar, gated export |
| `src/components/ImageUploader.tsx` | rewrite | drop zone, drag-and-drop |
| `src/components/PreviewCanvas.tsx` | modify | calls `drawOverlay`, caption |
| `src/components/Inspector.tsx` | create | tabs (phone) / stacked (desktop) |
| `src/components/TimestampSection.tsx`, `StyleSection.tsx` | create | sections |
| `src/components/LocationSection.tsx`, `LocationMap.tsx`, `MapPickerModal.tsx` | create | location UI |
| `src/components/MetadataEditor.tsx`, `DownloadControls.tsx` | delete | replaced |
| `tests/unit/*.test.ts(x)`, `tests/integration/app.test.tsx` | create / rewrite | tests |

---

### Task 1: Data model and pure logic

**Files:**
- Modify: `src/types/index.ts`, `src/utils/validation.ts`
- Create: `src/utils/metadata.ts`, `src/utils/exportGate.ts`
- Test: `tests/unit/validation.test.ts` (rewrite), `tests/unit/metadata.test.ts`, `tests/unit/exportGate.test.ts`

**Interfaces:**
- Produces, in `types/index.ts`:
  - The IMPL §4 types `LocationSource`, `GeoPoint`, `TimestampSource`, plus `OverlayMetadata` without `map`.
  - `export interface PhotoExif { capturedAt?: string; gps?: { lat: number; lng: number } }`. `capturedAt` is in datetime-local format, `YYYY-MM-DDTHH:mm:ss`.
  - `UploadedPhoto` gains `exif?: PhotoExif`.
  - `export type SectionId = 'time' | 'location' | 'style'`.
  - `OverlayMetadata.timestamp` is **always** datetime-local format (`YYYY-MM-DDTHH:mm:ss`).
- Produces, in `validation.ts`:
  - `validateTimestamp(ts: string): { isValid: boolean; error?: string }`, with the same semantics as today.
  - `validateLocation(p: { lat: number; lng: number }): { isValid: boolean; error?: string }`.
  - `parseCoordinate(input: string, axis: 'lat' | 'lng'): number | null`.
- Produces, in `metadata.ts`:
  - `toLocalInput(d: Date): string`
  - `formatStampTime(ts: string): string`, which replaces `T` with a space.
  - `DEFAULT_STYLE = { fontSize: 48, color: '#FF7A1A', position: 'bottom-right' } as const`
  - `defaultMetadata(exif: PhotoExif | undefined, now: Date): OverlayMetadata`
  - `carryOver(prev: OverlayMetadata, exif: PhotoExif | undefined, now: Date): OverlayMetadata`
- Produces, in `exportGate.ts`:
  - `type ExportBlock = 'location' | 'time' | 'lines'`
  - `exportBlocker(m: OverlayMetadata): ExportBlock | null`
  - `BLOCK_REASON: Record<ExportBlock, string>`
  - `BLOCK_SECTION: Record<ExportBlock, SectionId>`, with `{ location: 'location', time: 'time', lines: 'location' }`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/validation.test.ts`, replacing the string-location cases:
```ts
expect(validateLocation({ lat: 40.7, lng: -74 }).isValid).toBe(true);
expect(validateLocation({ lat: 91, lng: 0 }).isValid).toBe(false);
expect(validateLocation({ lat: 0, lng: 181 }).isValid).toBe(false);
expect(validateLocation({ lat: NaN, lng: 0 }).isValid).toBe(false);
expect(parseCoordinate('-8.43221', 'lat')).toBe(-8.43221);
expect(parseCoordinate('-8,43221', 'lat')).toBe(-8.43221);   // Review Focus 1
expect(parseCoordinate(' 115.27904 ', 'lng')).toBe(115.27904);
expect(parseCoordinate('', 'lat')).toBeNull();
expect(parseCoordinate('abc', 'lat')).toBeNull();
expect(parseCoordinate('95', 'lat')).toBeNull();
expect(parseCoordinate('-181', 'lng')).toBeNull();
// keep the three existing validateTimestamp cases; add:
expect(validateTimestamp('2026-11-05T14:32:08').isValid).toBe(true);
```

`tests/unit/metadata.test.ts`:
```ts
const now = new Date(2026, 10, 5, 9, 0, 0);
const exifFull = { capturedAt: '2026-11-04T14:32:08', gps: { lat: -8.43221, lng: 115.27904 } };

it('toLocalInput keeps wall-clock time', () => {            // Review Focus 3
  expect(toLocalInput(new Date(2026, 10, 4, 14, 32, 8))).toBe('2026-11-04T14:32:08');
});
it('formatStampTime', () => expect(formatStampTime('2026-11-04T14:32:08')).toBe('2026-11-04 14:32:08'));
it('defaults from full EXIF', () => {
  const m = defaultMetadata(exifFull, now);
  expect(m).toMatchObject({ timestamp: '2026-11-04T14:32:08', timestampSource: 'capture',
    location: { lat: -8.43221, lng: 115.27904, source: 'exif' }, placeName: null,
    showCoords: true, showPlace: true, ...DEFAULT_STYLE });
});
it('defaults without EXIF', () => {
  expect(defaultMetadata(undefined, now)).toMatchObject({ timestamp: '2026-11-05T09:00:00', timestampSource: 'now', location: null });
});
it('carryOver keeps everything when new photo has no EXIF', () => {
  const prev = { ...defaultMetadata(undefined, now), location: { lat: 1, lng: 2, source: 'map' as const },
    placeName: 'X', timestamp: '2026-01-01T08:00:00', timestampSource: 'custom' as const, color: '#FFFFFF', showCoords: false };
  expect(carryOver(prev, undefined, now)).toEqual(prev);
});
it('carryOver refreshes a carried Now', () => {
  const prev = defaultMetadata(undefined, new Date(2026, 0, 1));
  expect(carryOver(prev, undefined, now).timestamp).toBe('2026-11-05T09:00:00');
});
it('carryOver: new EXIF wins', () => {
  const prev = { ...defaultMetadata(undefined, now), location: { lat: 1, lng: 2, source: 'map' as const }, placeName: 'X' };
  const m = carryOver(prev, exifFull, now);
  expect(m.location).toEqual({ lat: -8.43221, lng: 115.27904, source: 'exif' });
  expect(m.placeName).toBeNull();
  expect(m).toMatchObject({ timestampSource: 'capture', timestamp: '2026-11-04T14:32:08' });
});
```

`tests/unit/exportGate.test.ts`:
```ts
const ok = { ...defaultMetadata(undefined, new Date()), location: { lat: 1, lng: 2, source: 'manual' as const } };
expect(exportBlocker(ok)).toBeNull();
expect(exportBlocker({ ...ok, location: null })).toBe('location');
expect(exportBlocker({ ...ok, timestamp: '' })).toBe('time');
expect(exportBlocker({ ...ok, showCoords: false, placeName: null })).toBe('lines');
expect(exportBlocker({ ...ok, showCoords: false, showPlace: true, placeName: 'Bali' })).toBeNull();
expect(exportBlocker({ ...ok, showCoords: false, showPlace: false, placeName: 'Bali' })).toBe('lines');
expect(BLOCK_REASON).toEqual({ location: 'Add a location to export', time: 'Add a time to export', lines: 'Turn on coordinates or place name' });
```

- [ ] **Step 2: Run `npx vitest run tests/unit`.** Expected: FAIL (missing modules and exports).

- [ ] **Step 3: Implement the types and the three modules to the interfaces above.**
  - `exportBlocker` checks in this order: location, time (`validateTimestamp`), lines.
  - `carryOver` keeps `prev` except:
    - When `exif.gps` is present: set `location` from EXIF and `placeName: null`.
    - When `exif.capturedAt` is present: set `timestamp: exif.capturedAt` and `timestampSource: 'capture'`.
    - Otherwise, when `prev.timestampSource === 'now'`, refresh `timestamp` to `toLocalInput(now)`.
  - `parseCoordinate` replaces `,` with `.`, then rejects anything `Number()` can't parse fully, plus out-of-range values (lat ±90, lng ±180).

- [ ] **Step 4: Run `npx vitest run tests/unit`.** Expected: PASS. Until Task 4 replaces `App` and `MetadataEditor`, two things fail, and that's expected; don't patch them:
  - `tsc` in `App` and `MetadataEditor`.
  - `tests/integration/app.test.tsx`.

- [ ] **Step 5: Commit** `feat: structured location model, export gate, carry-over logic`

---

### Task 2: Shared `drawOverlay`

**Files:**
- Create: `src/utils/drawOverlay.ts`
- Modify: `src/utils/imageProcessing.ts`, `src/components/PreviewCanvas.tsx`
- Test: `tests/unit/drawOverlay.test.ts`, `tests/unit/imageProcessing.test.ts` (update the metadata fixture)

**Interfaces:**
- Consumes: `OverlayMetadata`, `formatStampTime` (Task 1).
- Produces:
  - `stampLines(m: OverlayMetadata): string[]`
  - `drawOverlay(ctx: CanvasRenderingContext2D, width: number, height: number, m: OverlayMetadata): void`
  - `loadStampFont(): Promise<void>`, which never rejects and is a no-op when `document.fonts` is missing.
  - `processImage(photo, metadata)` keeps its signature and awaits `loadStampFont()` before drawing.
  - `PreviewCanvas` keeps its props `{ photo, metadata }`.

- [ ] **Step 1: Write the failing tests** (`tests/unit/drawOverlay.test.ts`):
```ts
const base = { ...defaultMetadata(undefined, new Date(2026, 10, 5, 14, 32, 8)),
  location: { lat: -8.432214, lng: 115.279041, source: 'map' as const }, placeName: 'Tegallalang, Gianyar, Bali' };
it('all lines', () => expect(stampLines(base)).toEqual(['2026-11-05 14:32:08', '-8.43221, 115.27904', 'Tegallalang, Gianyar, Bali']));
it('coords off', () => expect(stampLines({ ...base, showCoords: false })).toEqual(['2026-11-05 14:32:08', 'Tegallalang, Gianyar, Bali']));
it('place off', () => expect(stampLines({ ...base, showPlace: false })).toHaveLength(2));
it('place pending', () => expect(stampLines({ ...base, placeName: null })).toHaveLength(2));
it('no location', () => expect(stampLines({ ...base, location: null })).toEqual(['2026-11-05 14:32:08']));
it('draws each line bottom-up for bottom positions, font is Geist Mono', () => {
  const ctx = { fillText: vi.fn(), set font(v: string) { this._f = v; }, get font() { return this._f; } } as any;
  drawOverlay(ctx, 1000, 800, { ...base, fontSize: 40 });
  expect(ctx.font).toBe('40px "Geist Mono", ui-monospace, monospace');
  expect(ctx.fillText).toHaveBeenCalledTimes(3);
  const lastY = ctx.fillText.mock.calls[2][2];
  expect(lastY).toBeCloseTo(800 - 1000 * 0.02);   // last baseline sits on the bottom padding
});
```

- [ ] **Step 2: Run `npx vitest run tests/unit/drawOverlay.test.ts`.** Expected: FAIL.

- [ ] **Step 3: Implement `drawOverlay.ts`.**
  - Line height is `fontSize * 1.2`.
  - Top positions: the first baseline is at `padding + fontSize`.
  - Bottom positions: the last baseline is at `height - padding`.
  - Alignment follows `right` / `left` as today.
- [ ] **Step 4: Replace the duplicated drawing code.**
  - `processImage` and `PreviewCanvas` draw the bitmap, then call `drawOverlay`. `PreviewCanvas` awaits `loadStampFont()` once, then redraws.
  - Restyle `PreviewCanvas` to design `STHTR`:
    - Dark stage; the canvas is `max-h-full max-w-full object-contain`.
    - Caption: `Preview · NN%`, where `NN = round(canvas.clientWidth / photo.width * 100)`. Update it with `ResizeObserver` when present.
    - Second caption: `Exports at full {W} × {H}, original format`.
  - Update the fixture in `imageProcessing.test.ts` to a `defaultMetadata(...)` object.
- [ ] **Step 5: Run `npx vitest run tests/unit`.** Expected: PASS.
- [ ] **Step 6: Commit** `refactor: single drawOverlay for preview and export`

---

### Task 3: Tokens, primitives, Inspector, Timestamp and Style sections

**Files:**
- Modify: `tailwind.config.js` (IMPL §3 block verbatim), `index.html`, `src/styles/index.css`
- Create: `src/components/ui/Segmented.tsx`, `src/components/ui/Switch.tsx`, `src/components/Inspector.tsx`, `src/components/TimestampSection.tsx`, `src/components/StyleSection.tsx`
- Test: `tests/unit/sections.test.tsx`

**Interfaces:**
- Consumes: `OverlayMetadata`, `SectionId`, `toLocalInput`, `DEFAULT_STYLE` (Task 1).
- Produces:
  - `Segmented<T extends string>(p: { value: T; options: { value: T; label: string; disabled?: boolean }[]; onChange(v: T): void; label: string })`. Renders `role="radiogroup"` with one `role="radio"` per option.
  - `Switch(p: { checked: boolean; onChange(v: boolean): void; label: string; disabled?: boolean })`. Renders `role="switch"` with `aria-checked`.
  - `Inspector(p: { active: SectionId; onTab(id: SectionId): void; sections: { id: SectionId; label: string; node: ReactNode }[] })`:
    - A tab bar (`lg:hidden`) labelled `Time / Location / Style`.
    - Each section is wrapped in `<section id={`section-${id}`} className={`${active === id ? 'block' : 'hidden'} lg:block`}>`.
    - At `lg` it is a 380 px `bg-surface border-l border-line overflow-y-auto` column.
  - `type Patch = Partial<OverlayMetadata>`
  - `TimestampSection(p: { metadata: OverlayMetadata; capturedAt?: string; onChange(patch: Patch): void })`
  - `StyleSection(p: { metadata: OverlayMetadata; onChange(patch: Patch): void; keepSettings: boolean; onKeepSettings(v: boolean): void })`

- [ ] **Step 1: Write the failing tests** (`tests/unit/sections.test.tsx`, Testing Library):
  - TimestampSection with no `capturedAt` and `timestampSource: 'now'`:
    - shows `No capture time in photo. Using current time.`
    - the `Capture time` radio is disabled
  - TimestampSection with `capturedAt`:
    - with `timestampSource: 'capture'`: no note; the hint `Read from EXIF` is visible
    - with `timestampSource: 'custom'`: no note
  - Typing into the `datetime-local` input calls `onChange({ timestamp: <value>, timestampSource: 'custom' })`.
  - Clicking `Capture time` calls `onChange({ timestamp: capturedAt, timestampSource: 'capture' })`.
  - Clicking `Now` calls `onChange` with `timestampSource: 'now'` and a `timestamp` matching `/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/`.
  - StyleSection:
    - Clicking the top-left corner cell calls `onChange({ position: 'top-left' })`.
    - The `Keep settings for next photo` switch calls `onKeepSettings(false)`.
  - Inspector: clicking the `Style` tab calls `onTab('style')`; the non-active sections have class `hidden`.

- [ ] **Step 2: Run `npx vitest run tests/unit/sections.test.tsx`.** Expected: FAIL.

- [ ] **Step 3: Implement.**
  - Tokens and fonts:
    - Add Geist and Geist Mono (weights 400/500/600) from Google Fonts to `index.html`.
    - Change `<title>` to `stamp`.
    - Change the `<body>` class to `bg-bg text-ink font-sans`.
  - Timestamp input: `<input type="datetime-local" step="1">`, `font-mono`, with a calendar icon from `lucide-react`.
  - StyleSection (design `wafPl`):
    - 2×2 corner picker.
    - Size range input, 10–200, showing `{n} px`.
    - Swatches `#FF7A1A`, `#FFFFFF`, `#FFD84D`, plus a native `<input type="color">`, with the hex value in mono.
    - Last row: the Keep settings `Switch`, with the `Switch` primitive's `label`.
  - Section styling is as IMPL §3 (padding, uppercase 12 px titles).
- [ ] **Step 4: Run `npx vitest run tests/unit`.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: design tokens, primitives, inspector, timestamp and style sections`

---

### Task 4: App shell, upload, export gate, replace / reset / keep settings

**Files:**
- Create: `src/utils/loadPhoto.ts`, `src/components/TopBar.tsx`, `src/components/ExportButton.tsx`, `src/hooks/useIsDesktop.ts`, `src/components/LocationSection.tsx` (v1: manual LAT/LNG and toggles only)
- Rewrite: `src/App.tsx`, `src/components/ImageUploader.tsx`
- Delete: `src/components/MetadataEditor.tsx`, `src/components/DownloadControls.tsx`
- Test: `tests/integration/app.test.tsx` (rewrite)

**Interfaces:**
- Consumes: everything from Tasks 1–3, plus `processImage`.
- Produces:
  - `loadPhoto(file: File): Promise<UploadedPhoto>`. It throws `Error('Please upload a valid JPEG or PNG image.')` for other types. Task 5 adds `exif` here.
  - `useIsDesktop(): boolean`. It reads `window.matchMedia?.('(min-width: 1024px)')`, returns `false` when `matchMedia` is missing, and subscribes to changes.
  - `ExportButton(p: { photo: UploadedPhoto; metadata: OverlayMetadata; onBlocked(section: SectionId): void; fullWidth?: boolean })`:
    - When `exportBlocker` returns a block: the button is disabled, `BLOCK_REASON` shows as a clickable line under or next to it, and clicking that line calls `onBlocked(BLOCK_SECTION[block])`.
    - While exporting: the label is `Exporting…`, and further clicks are ignored.
    - On failure: inline `Export failed. Try again.`; no `alert`.
    - Keep the anchor-click download and the delayed `revokeObjectURL` from the old `DownloadControls`.
  - `TopBar(p: { photo: UploadedPhoto | null; onFile(f: File): void; onReset(): void; exportSlot?: ReactNode })`:
    - Brand `stamp`.
    - File info `name · W × H · size MB · JPEG|PNG`, desktop only.
    - `Replace photo` (hidden file input, `accept="image/jpeg,image/png"`), then a ghost `Reset` button.
  - `LocationSection(p: { metadata: OverlayMetadata; onChange(patch: Patch): void })` (v1):
    - LAT / LNG inputs (`aria-label` `Latitude` / `Longitude`), with local draft strings.
    - On blur or Enter, when both parse via `parseCoordinate`: `onChange({ location: { lat, lng, source: 'manual' }, placeName: null })`. Otherwise show an inline error.
    - Two `Switch`es: `Show coordinates on photo` and `Show place name on photo`.

**App behaviour:**
- State: `photo`, `metadata`, `keepSettings` (initialised from `localStorage` in try/catch; default `true`; written in try/catch on change), `activeSection: SectionId` (default `'location'`), and `uploadError`.
- `handleFile(f)`:
  1. `loadPhoto`.
  2. `setMetadata(prev => photo && keepSettings ? carryOver(prev, p.exif, new Date()) : defaultMetadata(p.exif, new Date()))`.
  3. `setPhoto`.
  4. Revoke the previous `srcUrl`.
- `Reset`: `setMetadata(defaultMetadata(photo.exif, new Date()))`.
- `onBlocked(id)`: `setActiveSection(id)`, then `document.getElementById('section-' + id)?.scrollIntoView({ block: 'start' })`.
- Layout:
  - Desktop: `h-screen grid grid-rows-[56px_1fr] lg:grid-cols-[1fr_380px]`. `ExportButton` goes in the `TopBar` `exportSlot` when `useIsDesktop()`.
  - Phone: a column with the top bar, the preview pinned at `h-[40vh]`, the Inspector tabs plus a scrolling section area (`flex-1 overflow-y-auto`), and a sticky bottom bar with a full-width `ExportButton`.
  - Export renders exactly once in the DOM.
- No photo: `ImageUploader` (design `MmTse`):
  - A drop zone with `onDragOver` / `onDrop` (desktop) plus a `Choose photo` button. Its file input uses `accept="image/jpeg,image/png"`, so phones offer both the camera and the gallery.
  - The facts row and the privacy line `Your photo never leaves the browser.`, as in the design.
  - `uploadError` shows inline.

- [ ] **Step 1: Write the failing integration tests** (`tests/integration/app.test.tsx`):
  - Keep the existing canvas, bitmap and URL stubs.
  - Add `vi.stubGlobal('matchMedia', undefined)`, so the tests run the phone layout.
  - Use `upload(name)` to fire `change` on the first file input.
  - Use `exportBtn = () => screen.getByRole('button', { name: /Export JPG/ })`.

```ts
it('blocks export until a location is typed', async () => {
  render(<App />); upload('a.jpg');
  await waitFor(() => expect(exportBtn()).toBeDisabled());
  expect(screen.getByText('Add a location to export')).toBeInTheDocument();
  expect(screen.getByText('No capture time in photo. Using current time.')).toBeInTheDocument();
  typeCoords('-8,43221', '115.27904');            // fireEvent.change + blur on Latitude / Longitude
  await waitFor(() => expect(exportBtn()).toBeEnabled());
});
it('blocks when both location lines are off', async () => { /* set coords, toggle both switches off */
  expect(screen.getByText('Turn on coordinates or place name')).toBeInTheDocument(); });
it('clicking the reason switches to the right tab', /* reason click → Location section lacks class "hidden" */);
it('replace keeps settings; Reset clears them', async () => {
  /* upload, type coords, Replace with b.jpg → Latitude still -8.43221; click Reset → Latitude empty */ });
it('replace starts fresh when Keep settings is off, and the choice persists', async () => {
  /* toggle Keep off → localStorage 'stamp.keepSettings' === 'false'; Replace → Latitude empty */ });
it('survives localStorage throwing', async () => {                 // Review Focus 5
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  render(<App />); upload('a.jpg');
  await waitFor(() => expect(screen.getByRole('switch', { name: 'Keep settings for next photo' })).toBeChecked());
});
it('a double click exports once', async () => {
  /* coords set; processImage spied via vi.mock('../../src/utils/imageProcessing'); fire click twice → called once */ });
```

- [ ] **Step 2: Run `npx vitest run tests/integration`.** Expected: FAIL.
- [ ] **Step 3: Implement the files above, and delete `MetadataEditor.tsx` and `DownloadControls.tsx`.**
- [ ] **Step 4: Run `npm test && npm run build`.** Expected: all tests pass, and `tsc` and `vite build` succeed.
- [ ] **Step 5: Run `npm run dev`; check 1440 px and 375 px wide against `exports/01-upload.png` and `02-editor.png`, minus the map watermark.**
- [ ] **Step 6: Commit** `feat: new app shell with gated export, replace, reset and keep settings`

---

### Task 5: EXIF read

**Files:**
- Create: `src/services/exif.ts`
- Modify: `src/utils/loadPhoto.ts`, `package.json` (`npm i exifr`)
- Test: `tests/unit/exif.test.ts`, plus one case in `tests/integration/app.test.tsx`

**Interfaces:**
- Produces: `readExif(file: File): Promise<PhotoExif>`. It never rejects; on any failure it returns `{}`.
  - Uses `exifr.gps(file)` → `{ latitude, longitude }`, and `exifr.parse(file, ['DateTimeOriginal'])`.
  - `capturedAt = toLocalInput(DateTimeOriginal)` when it is a valid `Date`.
  - `gps` is omitted when missing, non-finite, or exactly `0,0`.
- `loadPhoto` sets `exif: await readExif(file)`, run in parallel with `createImageBitmap`.

- [ ] **Step 1: Write the failing tests.** `vi.mock('exifr')`:
  - GPS `{ latitude: -8.43221, longitude: 115.27904 }` plus `DateTimeOriginal: new Date(2026, 10, 4, 14, 32, 8)` → `{ capturedAt: '2026-11-04T14:32:08', gps: { lat: -8.43221, lng: 115.27904 } }`.
  - GPS `{ latitude: 0, longitude: 0 }` → no `gps` key. *(Review Focus 2.)*
  - `exifr.gps` rejecting → `{}`.
  - Integration test: `vi.mock('../../src/services/exif')` returns the full EXIF. After upload, the `datetime-local` input has the value `2026-11-04T14:32:08`, `Read from EXIF` is visible, Latitude shows `-8.43221`, and Export is enabled.
- [ ] **Step 2: Run `npx vitest run`.** Expected: the new tests FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run `npm test`.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: read capture time and GPS from EXIF`

---

### Task 6: Location service (Geolocation + Nominatim)

**Files:**
- Create: `src/services/location.ts`
- Test: `tests/unit/location.test.ts`

**Interfaces:**
- Produces:
  - `type DeviceStatus = { kind: 'idle' } | { kind: 'locating' } | { kind: 'denied' } | { kind: 'error'; message: string }`
  - `hasGeolocation(): boolean`
  - `getDevicePosition(): Promise<GeoPoint>`:
    - Options from IMPL §5.1: `enableHighAccuracy: true`, `timeout: 10_000`, `maximumAge: 60_000`.
    - Resolves with `source: 'device'` and `accuracy`.
    - Rejects with the result of `geoErrorToStatus(err.code)`.
  - `geoErrorToStatus(code: number): DeviceStatus`. Code `1` → `{ kind: 'denied' }`. Anything else → `{ kind: 'error', message: "Couldn't get a fix. Try again or pick on map." }`.
  - `formatPlaceName(address: Record<string, string> | undefined, displayName: string): string`. Format: `{village|suburb|town}, {county|city}, {state}`, skipping missing parts. Falls back to `displayName` when all three are missing.
  - `cachedPlaceName(lat: number, lng: number): string | undefined`
  - `reverseGeocode(lat: number, lng: number): Promise<string | null>`:
    - URL as IMPL §5.2 with `zoom=16` and `accept-language=navigator.language`.
    - Caches successes.
    - Returns `null` on a network error, a non-OK response, or a response with no name.
  - `type PlaceResult = { name: string; lat: number; lng: number }`
  - `searchPlaces(q: string): Promise<PlaceResult[]>`:
    - URL as IMPL §5.2 with `limit=5`.
    - `name` is `display_name`.
    - Throws on a network error or non-OK response.
  - `_resetLocationServiceForTests(): void` clears the cache and the queue.
- Rate limit: every Nominatim request goes through one module-level promise queue that starts each request at least 1000 ms after the previous one started.

- [ ] **Step 1: Write the failing tests.** Use stubbed `navigator.geolocation` and `fetch`, and `vi.useFakeTimers()` for the rate limit.
  - `geoErrorToStatus(1)` → denied; `(2)` and `(3)` → error with the exact message.
  - `getDevicePosition` resolves `{ lat, lng, accuracy: 12.4, source: 'device' }` from a stubbed success.
  - `formatPlaceName({ village: 'Tegallalang', county: 'Gianyar', state: 'Bali' }, 'x')` → `'Tegallalang, Gianyar, Bali'`.
  - `formatPlaceName({}, 'Somewhere, ID')` → `'Somewhere, ID'`.
  - The second `reverseGeocode(-8.432211, 115.279041)` with the same 5-decimal key does not call `fetch` again, and `cachedPlaceName` returns the value.
  - Two uncached `reverseGeocode` calls fired together: `fetch` is called once, and a second time only after `vi.advanceTimersByTime(1000)`.
  - `reverseGeocode` with `fetch` rejecting → `null`.
- [ ] **Step 2: Run `npx vitest run tests/unit/location.test.ts`.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: geolocation and Nominatim service with cache and 1 req/s limit`

---

### Task 7: Full Location section (map, device location, place name, states)

**Files:**
- Create: `src/hooks/useDeviceLocation.ts`, `src/hooks/usePlaceName.ts`, `src/components/LocationMap.tsx`
- Modify: `src/components/LocationSection.tsx`, `src/App.tsx`, `src/main.tsx` (`import 'leaflet/dist/leaflet.css'`), `package.json` (`npm i leaflet react-leaflet@4 && npm i -D @types/leaflet`)
- Test: `tests/unit/usePlaceName.test.tsx`, `tests/unit/useDeviceLocation.test.tsx`, plus cases in `tests/integration/app.test.tsx`

**Interfaces:**
- Consumes: Task 6 service, `useIsDesktop` (Task 4).
- Produces:
  - `useDeviceLocation(onFix: (p: GeoPoint) => void): { status: DeviceStatus; locate(): void; cancel(): void }`. `cancel()` returns to idle, and a fix that arrives after cancel is discarded (request-id ref).
  - `type PlaceStatus = 'idle' | 'pending' | 'ok' | 'failed'`
  - `usePlaceName(location: GeoPoint | null, setPlaceName: (n: string | null) => void): PlaceStatus`. It runs when the `location` reference changes:
    - null → `setPlaceName(null)`, `'idle'`.
    - A cache hit → set immediately, `'ok'`.
    - Otherwise `setPlaceName(null)`, `'pending'`, then after 800 ms `reverseGeocode` → set the name, `'ok'`, or `'failed'` on null.
    - Cleanup cancels the timer and ignores late results.
  - `LocationMap(p: { point: GeoPoint; badge: string; dimmed?: boolean; onPick(): void })`:
    - `react-leaflet` `MapContainer`, non-interactive (`dragging`, `zoomControl`, `scrollWheelZoom`, `doubleClickZoom`, `touchZoom`, `keyboard` all false), zoom 16, and it recentres when `point` changes.
    - The pin is an orange `CircleMarker` with a white stroke. A `device` point with `accuracy` adds a `Circle` of that radius.
    - Badge top-left; `Pick on map` chip bottom-right.
    - Export `OSM_TILE_URL` and `OSM_ATTRIBUTION` for Task 8.
  - `LocationSection` gains the props `placeStatus: PlaceStatus` and `onOpenPicker(): void`.
- Badge text:
  - `exif` → `FROM PHOTO`
  - `device` → `GPS ±{Math.round(accuracy)} m`
  - `map` → `FROM MAP`
  - `manual` → `MANUAL`
- The states are IMPL §8's table, with these spec overrides:

| Condition | Shows |
| --- | --- |
| `location === null`, idle | `This photo has no GPS data.`. Primary is `Pick on map` on desktop, `Use my location` on phone; the other is secondary. Hint: `Or type coordinates below.` |
| locating | Dimmed map placeholder, spinner, `Finding your location…`, and `Cancel` |
| denied | Red (`danger`) box: `Location access is blocked. Click the lock icon in the address bar to allow it, then try again.`. Primary `Pick on map`; secondary `Try again` |
| error | The message under the header. Primary `Try again`; secondary `Pick on map` |
| ready / exif | The map, plus the note `Location read from the photo.` and `Use my location instead` |
| ready / device | The map. On desktop only: `This is where you are now, not necessarily where the photo was taken.` |

- The header holds `Use my location`, hidden when `!hasGeolocation()`.
- Under the header: `Place names by OpenStreetMap`.
- Place line: `pending` → `Looking up place name…`; `failed` → `Place name unavailable`; `ok` → `metadata.placeName`.
- `App` calls `usePlaceName(metadata.location, n => setMetadata(m => ({ ...m, placeName: n })))` and passes the status down. `onOpenPicker` sets `pickerOpen` state, which Task 8 renders.

- [ ] **Step 1: Write the failing tests.**
  - `usePlaceName` (`renderHook`, fake timers, `vi.mock('../../src/services/location')`):
    - At 799 ms there is no `reverseGeocode` call; at 800 ms it is called once and the status becomes `ok`.
    - A cache hit sets the name with no timer.
    - **Stale result:** start a lookup for A, change to B before A's promise resolves, then resolve A → `setPlaceName` is never called with A's name. *(Review Focus 4.)*
    - A `null` result → `'failed'`.
  - `useDeviceLocation`:
    - `locate()` → `locating` → the fix calls `onFix`.
    - Code 1 → `denied`.
    - `cancel()` before the fix → `onFix` is not called and the status is `idle`.
  - Integration (`vi.mock('../../src/components/LocationMap', () => ({ LocationMap: ({ badge }) => <div>{badge}</div> }))`, with the location service mocked):
    - An EXIF upload shows `FROM PHOTO`.
    - A no-GPS upload shows `This photo has no GPS data.`.
    - Stubbing geolocation to deny and clicking `Use my location` shows the blocked copy.
    - With `reverseGeocode` resolving `'Tegallalang, Gianyar, Bali'`, the name appears after the timers advance by 800 ms.
- [ ] **Step 2: Run `npx vitest run`.** Expected: the new tests FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run `npm test && npm run build`.** Expected: PASS.
- [ ] **Step 5: Run `npm run dev` and reach every state in `exports/04-location-states.png`.** Deny the location permission in the browser to reach the denied state.
- [ ] **Step 6: Commit** `feat: location section with EXIF, device location, map and place name`

---

### Task 8: Map picker

**Files:**
- Create: `src/components/MapPickerModal.tsx`
- Modify: `src/App.tsx`
- Test: `tests/unit/mapPicker.test.tsx`

**Interfaces:**
- Consumes: `searchPlaces`, `reverseGeocode`, `cachedPlaceName`, `getDevicePosition`, `hasGeolocation` (Task 6), `OSM_TILE_URL` and `OSM_ATTRIBUTION` (Task 7).
- Produces: `MapPickerModal(p: { initial: GeoPoint | null; onCancel(): void; onConfirm(p: GeoPoint): void })`.
  - `onConfirm` receives `{ lat, lng, source: 'map' }`, or the device point unchanged when the pin came from "Use my current location" and wasn't moved.
- Behaviour (design `A0a8p` / `g5ojk`):
  - Interactive `MapContainer` with a zoom control. It starts at `initial`, or at Indonesia (`-2.5, 118`, zoom 5) when `initial` is null.
  - A draggable `Marker` with an `L.divIcon` orange dot (no image assets). A map click moves the pin.
  - A search `<form>`: submit on Enter or the search-icon button, **never on change**. Up to 5 results; clicking one moves the pin and `flyTo` zoom 16. Errors show `Search failed. Try again.`; an empty result shows `No places found.`.
  - `Use my current location` (hidden when `!hasGeolocation()`): moves the pin.
  - Footer readout: mono `lat, lng` (5 dp) and the place name from `reverseGeocode`, debounced 800 ms after the last pin move. Then `Cancel` and the primary `Use this location`.
  - Layout: desktop is a centred modal (about 880×640, radius 14, `bg-surface`), with a `bg-black/60` backdrop. Phone (`< lg`) is full-screen. `Esc` cancels.
- `App`: when `pickerOpen`, render the modal. `onConfirm(p)` → `setMetadata(m => ({ ...m, location: p, placeName: null }))` and close.

- [ ] **Step 1: Write the failing tests.** Mock `react-leaflet` with a stub that renders children; mock the location service.
  - Typing in the search box does **not** call `searchPlaces`; pressing Enter calls it once with the query.
  - Clicking a result, then `Use this location`, calls `onConfirm({ lat, lng, source: 'map' })` with that result's coordinates.
  - `searchPlaces` rejecting shows `Search failed. Try again.`.
  - `Cancel` calls `onCancel`, and so does `Escape`.
- [ ] **Step 2: Run `npx vitest run tests/unit/mapPicker.test.tsx`.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run `npm test && npm run build`.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: map picker with search on submit and draggable pin`

---

### Task 9: Manual verification

No code unless a check fails. A failure goes back to the task that owns it.

- [ ] **Step 1:** `npm run build && npm run preview`. Then, in Chrome at 1440×1024 and in device mode at 360×740 and 430×932, check:
  - All three phone tabs are usable, Export is reachable in the bottom bar, the picker is full-screen, and nothing scrolls sideways.
  - Uploading a PNG without EXIF from the desktop shows the capture-time note, and Export stays disabled until a location is picked.
  - A phone JPEG with GPS gives `FROM PHOTO`, the capture time, and the place name on the exported file.
  - Deny location permission, then re-allow it via the lock icon, and `Try again` works.
  - Go offline in DevTools after setting coordinates: the place line shows `Place name unavailable`, and export still succeeds with two lines.
  - A 4032×3024 export opens at full size with the stamp in the chosen corner.
  - Replace with Keep settings on keeps the location; Reset clears it; Keep settings off survives a reload.
- [ ] **Step 2:** Note in the PR description that production must be served over HTTPS for `Use my location`.
