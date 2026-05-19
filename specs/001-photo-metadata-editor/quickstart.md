# Quickstart: Photo Metadata Editor

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the local development server:
   ```bash
   npm run dev
   ```
3. Open the URL shown in the terminal (usually `http://localhost:5173`).

## Usage

1. Upload a JPEG or PNG photo using the file picker.
2. Enter or edit the timestamp value.
3. Enter or edit the location coordinates.
4. Preview the image with the overlay applied.
5. Download the edited image using the download control.

## Build

```bash
npm run build
```

## Testing

```bash
npm run test
```

## Notes

- The app runs entirely in the browser; no backend is required for image processing.
- Export is designed to preserve the original image resolution and avoid visible quality loss.
