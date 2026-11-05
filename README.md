# wanci

Stamp a date, time and location onto a photo, right in the browser. Upload a JPEG or PNG, check the stamp, export at the original resolution and format. Nothing is uploaded to a server.

## Features

- **Time.** Use the photo's EXIF capture time, the current time, or a custom value.
- **Location from four sources:**
  - **Photo:** GPS read from EXIF on upload (badge `FROM PHOTO`).
  - **Device:** "Use my location" through the browser Geolocation API.
  - **Map:** search for a place or drop a pin in the map picker.
  - **Manual:** type latitude and longitude. A comma decimal (`-8,43221`) works too.
- **Place name.** Coordinates are reverse-geocoded to a readable name (village, city, province) that can be printed under the coordinates.
- **Style.** Font size, color, and corner position. The "keep settings" option carries the settings over to the next photo.
- **Export.** Original resolution, same format (JPEG at quality 1.0, or PNG), saved as `<name>_edited.<ext>`. Export stays blocked until the stamp has a valid time and at least one location line.

## Getting started

Requires Node.js 18+.

```bash
npm install
npm run dev       # dev server at http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Run every test once (Vitest + jsdom) |

"Use my location" needs a secure context: `localhost` or HTTPS. On a phone over the LAN (`http://192.168.x.x`), the browser blocks it; use the map or manual entry, or serve over HTTPS.

## How it works

1. `loadPhoto` checks the type, decodes the image into an `ImageBitmap` and reads EXIF (`exifr`) in parallel.
2. `defaultMetadata` (first photo) or `carryOver` (next photo, keep settings on) builds the stamp state.
3. `usePlaceName` waits 800 ms after the location changes, then reverse-geocodes through Nominatim.
4. The preview and the export both draw the text with `drawOverlay`, so what you see is what you get.
5. `processImage` draws the photo and stamp on a full-size canvas, and `ExportButton` downloads the blob.

## Project structure

```
src/
  App.tsx          state, upload flow, layout (mobile stack / desktop grid)
  components/      UI: uploader, preview, inspector sections, map picker, export
  hooks/           useDeviceLocation, usePlaceName, useIsDesktop
  services/        exif.ts (exifr), location.ts (Geolocation + Nominatim)
  utils/           metadata, drawOverlay, imageProcessing, exportGate, validation
  types/           shared types
tests/
  unit/            pure functions and services
  integration/     App, sections, map picker, hooks (React Testing Library)
docs/superpowers/  design spec and implementation plan for the stamp redesign
```

## Tech stack

React 18, TypeScript, Vite 5, Tailwind CSS 3, Leaflet / react-leaflet (OpenStreetMap tiles), exifr, lucide-react, Vitest + Testing Library.

## Third-party services

- **OpenStreetMap tiles** for the maps.
- **Nominatim** for search and reverse geocoding. Its [usage policy](https://operations.osmfoundation.org/policies/nominatim/) allows at most one request per second, so every request goes through one queue, search runs on submit only, and place names are cached. When Nominatim is unreachable, the app shows "Place name unavailable" and coordinates still work.

The photo itself never leaves the browser; only coordinates and search text are sent to Nominatim.
