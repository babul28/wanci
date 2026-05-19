# Data Model: Photo Metadata Editor

## Entities

- **Uploaded Photo**
  - `file`: `File`
  - `name`: `string`
  - `type`: `image/jpeg | image/png`
  - `width`: `number`
  - `height`: `number`
  - `size`: `number`
  - `srcUrl`: `string`
  - `bitmap`: `ImageBitmap`

- **Overlay Metadata**
  - `timestamp`: `string`
  - `location`: `string`
  - `fontSize`: `number`
  - `color`: `string`
  - `position`: `"bottom-left" | "bottom-right" | "top-left" | "top-right"`

- **Export Result**
  - `blob`: `Blob`
  - `downloadUrl`: `string`
  - `fileName`: `string`
  - `mimeType`: `string`

## Relationships

- `Uploaded Photo` is the source input for the editing flow.
- `Overlay Metadata` is applied to the loaded photo during preview and export.
- `Export Result` is generated from the combination of `Uploaded Photo` and `Overlay Metadata`.

## Validation Rules

- Uploaded file type must be JPEG or PNG.
- Timestamp input must be a valid date/time string.
- Location input must contain latitude and longitude values in a recognizable format.
- Export only proceeds when a valid image is loaded and overlay values pass validation.

## State Transitions

- `idle` → `uploaded` when the user selects a supported image.
- `uploaded` → `edited` when the user modifies timestamp or location metadata.
- `edited` → `ready-to-export` when preview is validated and renderable.
- `ready-to-export` → `exported` when the user downloads the final image.
