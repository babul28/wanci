# Research: Photo Metadata Editor

## Decision
Use a browser-only Vite + React + TypeScript + Tailwind CSS application that processes images entirely in the client.

## Rationale
- The user explicitly requested no backend for image processing.
- Vite + React provides a fast developer experience and supports modern browser apps.
- TypeScript with `strict` mode ensures type safety for image-processing logic and UI state.
- Tailwind CSS enables a clean, minimal UI with consistent styling and fast iteration.
- Browser-based Canvas image export preserves user privacy and eliminates server overhead.

## Alternatives Considered
- Backend image processing service: rejected because the feature requirement is browser-only and the user does not want backend processing.
- Plain JavaScript without React: rejected because the app benefits from React component structure, state management, and maintainability.
- External image processing libraries or cloud services: rejected because they add unnecessary dependency and violate the browser-only constraint.

## Implementation Notes
- Use a file input to accept JPEG and PNG image uploads.
- Load images with `createImageBitmap` or an HTMLImageElement, then render on a hidden canvas at original resolution.
- Apply timestamp and GPS coordinates as text overlays on the canvas before export.
- Preserve original quality by exporting with the same MIME type and by using a high-quality JPEG export setting when needed.
- Provide immediate preview in the UI by rendering the loaded image and overlay in a visible preview component.
- Validate timestamp and coordinates client-side and show clear error states.
