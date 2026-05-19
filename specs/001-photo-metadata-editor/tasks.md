# Tasks: Photo Metadata Editor

**Input**: Design documents from `/specs/001-photo-metadata-editor/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/ui-contract.md, research.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the browser-only frontend app and create the base project structure.

- [x] T001 Create `src/` and `tests/` structure with `src/App.tsx`, `src/main.tsx`, `src/styles/index.css`, `tests/unit/`, and `tests/integration/`
- [x] T002 Add Vite, React, TypeScript, Tailwind CSS, `vitest`, and `@testing-library/react` to `package.json`
- [x] T003 Create `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`, and `postcss.config.js` at the repository root
- [x] T004 Create `src/types/index.ts` with `UploadedPhoto`, `OverlayMetadata`, and `ExportResult` type definitions
- [x] T005 Create `src/utils/imageProcessing.ts` and `src/utils/validation.ts` placeholders for browser export and input validation logic
- [x] T006 Create component skeleton files at `src/components/ImageUploader.tsx`, `src/components/MetadataEditor.tsx`, `src/components/PreviewCanvas.tsx`, and `src/components/DownloadControls.tsx`
- [x] T007 Create root styling in `src/styles/index.css` for a clean minimal UI and basic responsive layout

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement shared logic and UI contracts that all user stories depend on.

- [x] T008 Implement `src/types/index.ts` state and entity types used across upload, preview, edit, and export flows
- [x] T009 [P] Implement `src/utils/validation.ts` with timestamp and location coordinate validation rules and clear error messages
- [x] T010 [P] Implement `src/utils/imageProcessing.ts` to render the uploaded image to a canvas, apply overlay text, and export a `Blob` preserving the original MIME type
- [x] T011 [P] Implement `src/components/ImageUploader.tsx` with JPEG/PNG acceptance, upload state handling, and unsupported file feedback
- [x] T012 [P] Implement `src/components/PreviewCanvas.tsx` to render the loaded image and overlay metadata for preview
- [x] T013 Implement `src/components/DownloadControls.tsx` with a download button that triggers client-side export when the image is ready
- [x] T014 Implement `src/components/MetadataEditor.tsx` with form fields for timestamp and location input and inline validation placeholders
- [x] T015 Configure `src/App.tsx` to orchestrate uploaded photo state, metadata state, validation errors, preview rendering, and export readiness

---

## Phase 3: User Story 1 - Upload and export edited photo (Priority: P1) 🎯 MVP

**Goal**: Enable users to upload an image, preview timestamp/location overlays, and download the edited image with preserved quality.

**Independent Test**: Upload a supported JPEG/PNG photo, set timestamp/location values, download the edited photo, and verify the overlay is visible while the resolution is preserved.

- [x] T016 [P] [US1] Implement file selection and supported-format validation in `src/components/ImageUploader.tsx`
- [x] T017 [US1] Implement display of the uploaded image preview and overlay values in `src/App.tsx`
- [x] T018 [US1] Implement download export trigger in `src/components/DownloadControls.tsx`
- [x] T019 [US1] Implement the export flow in `src/utils/imageProcessing.ts` to preserve the original image file format when exporting
- [x] T020 [US1] Add integration test `tests/integration/upload-export.test.ts` covering upload, preview, overlay application, and download readiness

---

## Phase 4: User Story 2 - Edit timestamp and location after upload (Priority: P2)

**Goal**: Allow users to change timestamp and location after uploading the photo and immediately preview the edited result.

**Independent Test**: Upload a photo, change timestamp and coordinates, and verify the preview updates before download.

- [x] T021 [P] [US2] Implement timestamp input and inline validation in `src/components/MetadataEditor.tsx`
- [x] T022 [P] [US2] Implement location coordinate input and inline validation in `src/components/MetadataEditor.tsx`
- [x] T023 [US2] Implement metadata state updates and preview refresh logic in `src/App.tsx`
- [x] T024 [P] [US2] Add unit test coverage in `tests/unit/validation.test.ts` for timestamp and location validation behavior
- [x] T025 [US2] Add integration test `tests/integration/edit-preview.test.ts` verifying preview updates when timestamp or location values change

---

## Phase 5: User Story 3 - Preserve image quality during export (Priority: P3)

**Goal**: Ensure the downloaded edited photo keeps the original resolution and visual quality.

**Independent Test**: Compare the downloaded edited image to the original image for matching resolution and acceptable visual clarity.

- [x] T026 [P] [US3] Enhance `src/utils/imageProcessing.ts` to export images at original resolution and use the same MIME type for JPEG/PNG
- [x] T027 [US3] Enhance `src/components/PreviewCanvas.tsx` so preview rendering matches export quality and positioning of the overlay
- [x] T028 [US3] Add integration test `tests/integration/export-quality.test.ts` verifying exported image resolution and format preservation
- [x] T029 [P] [US3] Add unit test coverage in `tests/unit/imageProcessing.test.ts` for quality-preserving export behavior

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Complete the feature with UX polish, documentation, and cross-story quality checks.

- [x] T030 [P] Update `src/styles/index.css` to improve visual contrast, spacing, and the minimal UI layout
- [x] T031 [P] Update `specs/001-photo-metadata-editor/quickstart.md` with any commands or usage details needed for this feature
- [x] T032 [P] Update `specs/001-photo-metadata-editor/research.md` or `specs/001-photo-metadata-editor/spec.md` with any implementation notes or clarifications discovered during development
- [x] T033 [P] Add accessibility and validation feedback improvements in `src/components/MetadataEditor.tsx` and `src/components/ImageUploader.tsx`
- [x] T034 [P] Add cross-cutting error handling for invalid uploads, malformed inputs, and large file warnings in `src/App.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup**: Must complete before any implementation work begins
- **Phase 2: Foundational**: Blocks all user stories until shared types, validation, image export, and UI contracts are implemented
- **Phase 3+ User Stories**: Can begin after Phase 2 but are independent from each other for verification
- **Phase 6: Polish**: Runs after user stories are functional and improves UI, docs, and cross-cutting behavior

### User Story Dependencies

- **User Story 1 (P1)**: Depends on foundational upload, preview, and export infrastructure
- **User Story 2 (P2)**: Depends on foundational validation and preview infrastructure, but can be tested independently once metadata editing is wired
- **User Story 3 (P3)**: Depends on foundational export infrastructure and the preview contract; can be validated independently

### Parallel Opportunities

- `T009`, `T010`, `T011`, and `T012` in Phase 2 can be worked in parallel because they implement separate shared modules and components
- `T016`, `T021`, and `T022` are parallelizable across UI component work for upload, timestamp input, and location input
- `T024`, `T029`, and other unit tests can be developed in parallel with feature implementation once validation and export logic exist
- Different user stories can be developed in parallel after Phase 2 is complete

## Implementation Strategy

### MVP First

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate the upload/export flow independently
5. Stop and ship the MVP if the core flow is stable

### Incremental Delivery

1. Finish setup and foundation
2. Deliver User Story 1 as the initial MVP
3. Add User Story 2 for live editing and preview behavior
4. Add User Story 3 for quality-preserving export
5. Polish the UI and documentation last

### Notes

- The app must remain browser-only with no backend image processing
- Export should preserve the original image format when supported
- The user story tasks are structured so each story can be implemented and validated independently
