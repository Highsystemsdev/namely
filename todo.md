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

## New Features (Round 11 - Excel Support)
- [x] Install SheetJS (xlsx) for browser-side Excel parsing
- [x] Excel text extractor: reads all sheets, extracts cell values as plain text for AI classification
- [x] Accept .xls, .xlsx, .xlsm, .xlt, .xltx, .xltm in upload zone and folder mode
- [x] Feed Excel text into existing AI classification pipeline (same as PDF text extraction)
- [x] Preserve original Excel extension on rename (no conversion)
- [x] Spreadsheet icon (📊) shown for Excel files in the document list
- [x] 18 new vitest tests for Excel extractor (67 total passing)

## New Features (Round 12)
- [x] Add {lender} tag to Serviceability Calc document type template and variables
- [x] Add "Pick files" button alongside "Open folder" — uses standard file input, feeds selected files into the folder rename preview pipeline (downloads renamed files, works in all browsers including Safari)

## UX Improvements (Round 13)
- [x] Redesign upload zone: two separated sections — (1) Upload Files / drop zone, (2) Pick Files or Pick Folder with clear description

## Bug Fixes (Round 14)
- [x] Fix: Pick Folder incorrectly sets isIndividualMode=true causing download instead of in-place rename

## New Features (Round 15)
- [x] Pick Files: replaced hidden file input with showOpenFilePicker (File System Access API) so selected files get writable handles and rename in-place using handle.move()
- [x] Safari fallback: if showOpenFilePicker is unsupported, error toast shown directing user to Chrome/Edge/Firefox

## Bug Fixes (Round 16)
- [x] Fix: FolderRenamePreviewDialog Apply button shows "Download" for Pick Files — now always says "Rename X file(s)" since both modes rename in-place

## New Features (Round 17 - Dynamic Tags)
- [x] MASTER_TAGS registry: 35+ tags with keys, labels, descriptions and examples in documentTypes.ts
- [x] Tag reference popup: "View all available tags" link in Config info box opens searchable popover with click-to-copy
- [x] Per-template "All tags" collapsible section: shows all MASTER_TAGS not in suggested list, click to insert at cursor
- [x] Dynamic missing-field detection: computeMissingFields resolves labels from MASTER_TAGS so any added tag gets a proper human-readable name in warnings

## New Features (Round 18 - Editable Document Type)
- [x] Editable document type dropdown in rename preview dialog (Type column becomes a Select)
- [x] When user changes document type, re-apply the new type's template using already-extracted metadata
- [x] Update confidence display after type change (show "Edited" indicator with pencil icon instead of confidence %)
- [x] Keep existing inline filename editing working alongside the new type selector

## New Features (Round 19 - Signature Detection & Discharge Form)
- [x] Add {signed} to MASTER_TAGS registry with description
- [x] Add Discharge Form document type with template Discharge Form {lender} {name} {date} {signed}
- [x] Update Forge AI extraction prompt to detect signatures and return signed field
- [x] {signed} is a conditional tag: renders as Signed when present, omitted entirely when blank
- [x] Update classifyRouter.ts DOCUMENT_TYPE_LIST and LABEL_TO_ID to include Discharge Form

## New Features (Round 20 - Fix Signature Detection & Loan Offer)
- [x] Diagnose and fix signature detection — AI not returning "Signed" for signed documents
- [x] Strengthen prompt: always include signed field in JSON response, not just when detected
- [x] Ensure signed detection works for both image mode (scanned) and text mode (digital PDF)
- [x] Add "Loan Offer & Mortgage" document type with template "Loan Offer & Mortgage {lender} {name} {date} {signed}"

## New Features (Round 21 - Word Document Support)
- [x] Install mammoth for .docx/.dotx text extraction (browser-compatible)
- [x] Implement wordExtractor.ts for .doc, .docx, .dot, .dotx files
- [x] Wire Word extraction into documentExtractor.ts
- [x] Update accepted file types in Home.tsx upload zone and folder picker
- [x] Update accepted file types in the info banner and file size display
- [x] Write tests for Word extraction logic (14 tests)

## New Features (Round 22 - File Picker Fix & Custom Templates)
- [x] Fix file picker accept attribute to include .doc, .docx, .dot, .dotx
- [x] Add customDocumentTypes array to ConfigContext with full CRUD handlers
- [x] Build Custom Types tab in Configure dialog (add, edit, delete with validation)
- [x] Custom types appear in document type dropdown in rename preview dialog (grouped under "Custom Types")
- [x] Custom template labels are included in the AI classification prompt (server-side)
- [x] handleFolderTypeChange resolves custom types for template re-application
- [x] 14 new vitest tests for custom document type logic (117 total passing)

## New Features (Round 23 - Inline Custom Templates)
- [x] Remove separate Custom Types tab from ConfigDialog (now 2-tab layout: Templates + Lender Names)
- [x] Merge custom types inline into Templates tab, alphabetically sorted with built-in types
- [x] Custom type rows use same expand/collapse card style as built-in rows (dashed border + "custom" badge)
- [x] "Add new template" row always visible at bottom (expand-to-fill, collapses after save)
- [x] Edit name, template, and delete actions available inline when a custom type row is expanded
- [x] 117 tests passing

## Bug Fixes (Round 24 - Custom Template Persistence)
- [x] Fix: custom document types not persisted after Save as Default — ConfigSchema on server was missing customDocumentTypes field, causing Zod to strip it before writing to disk

## New Features (Round 25 - Rebrand to Namely)
- [x] Update app title to "Namely" in all metadata, headers, and page titles
- [x] Generate Namely word logo (teal wordmark with folded-page N detail)
- [x] Deploy logo to CDN and update header img src to CDN URL
- [x] Upload section: white bg, teal icon, teal accent colours
- [x] Separator: solid slate-100 band with bold tracking-widest uppercase text
- [x] Pick Files section: slate-50 bg, slate-100 icon, slate-700 button text for clear distinction
- [x] 117 tests passing
