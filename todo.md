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

## Pending / Future
- [ ] Persist configuration to localStorage (survives page refresh)
- [ ] True PDF TFN redaction using pdf-lib (currently text-only)
- [ ] ZIP file unpacking (process individual files inside uploaded ZIPs)
- [ ] Batch processing progress indicator
