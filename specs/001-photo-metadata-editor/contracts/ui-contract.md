# UI Contract: Photo Metadata Editor

## Overview
This contract defines the expected user-facing interface and behavior for the photo metadata editor application.

## Public UI Components

- **Upload control**
  - Accepts JPEG and PNG images.
  - Displays validation feedback for unsupported file types.

- **Image preview area**
  - Shows the uploaded image immediately after selection.
  - Updates to display timestamp and location overlays in real time.

- **Timestamp input field**
  - Accepts a date/time value.
  - Provides inline validation for invalid values.

- **Location coordinate input field**
  - Accepts latitude and longitude values.
  - Provides inline validation for malformed coordinates.

- **Download button**
  - Generates a client-side export of the edited image.
  - Uses the same image format as the upload when possible.

## Behavior Contract

- Uploading an image must enable editing controls and trigger the preview.
- Changing timestamp or location values must update the preview immediately.
- The overlay must appear in both the preview and the downloaded image.
- Downloaded images must preserve original resolution and maintain equivalent visual quality.
- The UI must remain minimal and focused, exposing only the necessary controls for upload, edit, preview, and export.
