# Doc Renamer TODO

## Core Features
- [x] Upload zone (drag & drop + click) for PDF, PNG, JPG, HEIC, HEIF, WEBP, ZIP
- [x] 62 document types with default naming templates
- [x] AI classification via backend tRPC route (Forge/Gemini Vision + text)
- [x] PDF text extraction using pdfjs-dist v4
- [x] Image rendering to base64 for scanned PDFs and image files
- [x] Confidence score display (High/Medium/Low with icons)
- [x] Inline filename editing
- [x] Document detail dialog (extracted fields, type selector, name editor)
- [x] Individual file download
- [x] Bulk ZIP download (all processed documents)
- [x] Remove individual / remove all documents

## Configuration
- [x] Per-document-type naming templates with variable chips and live preview
- [x] Global separator setting (hyphen, underscore, space, period, none)
- [x] Date Order setting (DD/MM/YYYY, MM/DD/YYYY, YYYY/MM/DD, etc.)
- [x] Date Separator setting (hyphen, slash, period, underscore, space, none)
- [x] Name Format setting (First Last, Last First, First Only, etc.)
- [x] 117 lender institutions in 7 categories with editable abbreviations
- [x] Convert to PDF toggle
- [x] Redact Tax File Number toggle (text-based redaction on download)
- [x] Config dialog scroll fix (Close button always visible)

## Backend / Infrastructure
- [x] Full-stack upgrade (Express + tRPC backend)
- [x] Secure Forge API key (BUILT_IN_FORGE_API_KEY server-side only)
- [x] tRPC classify mutation with Zod input validation
- [x] Vitest tests for classify router (3 tests passing)

## Bug Fixes
- [x] Fix: LLM response parsing failure — removed unsupported json_object response_format for Gemini, added robust JSON extraction (strips thinking tags, code fences)

## In Progress
- [x] Default output extension to .pdf regardless of input file type
- [x] Normalise extracted names to Firstname Surname order (handles "Surname, Firstname" and "SURNAME Firstname" patterns)

## Completed Fixes (Round 2)
- [x] Fix: name normalisation incorrectly reorders middle-initial names (e.g. 'John J Kennedy' → 'J Kennedy John')
- [x] Fix: name normalisation incorrectly reverses already-correct names (e.g. 'Natalia Siwek' → 'Siwek Natalia')
- [x] Fix: separator applied between every word instead of only between template variable segments
- [x] Fix: AI system prompt updated with document-type-aware name order guidance (Medicare, Passport, ATO, etc.)

## Pending / Future
- [ ] Persist configuration to localStorage (survives page refresh)
- [ ] True PDF TFN redaction using pdf-lib (currently text-only)
- [ ] ZIP file unpacking (process individual files inside uploaded ZIPs)
- [ ] Batch processing progress indicator

## Completed Fixes (Round 3)
- [x] Fix: separator now only inserted at segment boundaries — literal text like "Drivers License" and "Notice of Assessment" preserves internal spaces
- [x] Add: spaced hyphen ' - ' as a separator option (now the default)
- [x] Update: defaults changed to spaced hyphen, YYYY-MM-DD date order, no date separator, First Middle Last name format

## New Features (Round 4)
- [x] Low-confidence row highlight: rows with confidence < 80% highlighted in orange with readable text contrast
- [x] Config persistence: "Save as Default" button in ConfigDialog writes config to server-side JSON file; loaded on startup
- [x] Info bar text update: second line changed to "Please extract documents from .zip files before uploading."

## New Features (Round 5 - Folder Mode)
- [x] useFolderPicker hook: showDirectoryPicker with readwrite mode, recursive directory walk, returns FolderFile objects with handles
- [x] folderRenamer utility: copy-verify-delete strategy, size verification, collision handling with numeric suffix, per-file error isolation
- [x] FolderRenamePreviewDialog: full before/after table, per-row approve/skip checkboxes, low-confidence orange highlight, progress indicators
- [x] Home.tsx: Open folder button in upload zone, feeds folder files into existing AI pipeline, wires preview dialog and apply renames
- [x] Safari/unsupported browser fallback: folder button hidden, polite note shown
- [x] 7 new vitest tests for folderRenamer (37 total passing)

## Bug Fixes (Round 6)
- [x] Fix: showDirectoryPicker blocked in cross-origin iframe — detect iframe context, show "Open in new tab" guidance instead of error

## Bug Fixes (Round 7)
- [x] Fix: preserve original file extension instead of forcing .pdf (jpeg stays jpeg, pdf stays pdf)
- [x] Fix: long filenames truncated in rename preview table — both tables now use break-all wrapping and horizontal scroll

## UX Improvements (Round 8)
- [x] FolderRenamePreviewDialog: default width 80vw, user-resizable in both dimensions

## New Features (Round 9)
- [x] Inline filename editing in FolderRenamePreviewDialog: click new name to edit, Enter/blur to confirm, Escape to cancel
- [x] New logo and favicon: simplified file-with-pencil icon (teal background, white file + yellow-tipped pencil)

## New Features (Round 10)
- [x] Stronger AI extraction prompt: date fields always attempted (partial dates if full date unavailable), lender returns full name for matching
- [x] Missing-tag detection: computeMissingFields compares template variables vs extracted data; missingFields added to ProcessedDocument
- [x] Missing-tag badges in upload table: amber "N missing" badge with tooltip listing field names
- [x] Missing-tag badges in folder preview dialog: amber "Missing: {field}" badge below document type
- [x] Lender abbreviation matching: resolveLenderAbbreviation tries exact full-name, abbreviation, then word-boundary partial match; applied in processDocument before template substitution
- [x] 12 new vitest tests for resolveLenderAbbreviation and computeMissingFields (49 total passing)
