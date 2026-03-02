/**
 * Namely — Document Extractor
 * Extracts text or renders a base64 image from the first page of a document.
 *
 * Strategy:
 *  1. Digital PDF  → extract raw text via PDF.js text layer (cheap, fast)
 *  2. Scanned PDF  → if text layer is empty/tiny, render page 1 to canvas → base64 JPEG
 *  3. Image files  → read directly as base64 via FileReader
 *  4. Word files   → extract plain text via mammoth (.docx/.dotx/.doc/.dot)
 */

import * as pdfjsLib from "pdfjs-dist";
import { extractExcelText, isExcelFile } from "./excelExtractor";
import { extractWordText, isWordFile } from "./wordExtractor";

// Point the worker at the bundled worker file via Vite's ?url import trick
// We use a CDN URL for the worker to avoid bundling issues with the large worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface ExtractionResult {
  /** Raw text extracted from the document (may be empty for scanned docs) */
  text: string;
  /** Base64-encoded JPEG image of page 1 (set when text is insufficient) */
  imageBase64: string | null;
  /** Whether the document was processed as an image (scanned/image file) */
  isImageMode: boolean;
}

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"];
const MIN_TEXT_LENGTH = 100; // Minimum characters to consider text extraction successful

/**
 * Read a File as a base64 data URL and strip the prefix to get raw base64.
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip "data:image/...;base64," prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Render the first page of a PDF to a base64 JPEG at a reasonable resolution.
 */
async function pdfPageToBase64(pdf: pdfjsLib.PDFDocumentProxy): Promise<string> {
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for clarity

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;

  await page.render({ canvasContext: ctx, viewport }).promise;

  // Convert to JPEG at 85% quality to keep payload size reasonable
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return dataUrl.split(",")[1];
}

/**
 * Extract text content from the first page of a PDF.
 */
async function extractPdfText(pdf: pdfjsLib.PDFDocumentProxy): Promise<string> {
  const page = await pdf.getPage(1);
  const textContent = await page.getTextContent();
  return textContent.items
    .map((item) => ("str" in item ? item.str : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Main entry point: extract text or image from any supported file type.
 */
export async function extractDocumentContent(file: File): Promise<ExtractionResult> {
  const mimeType = file.type.toLowerCase();

  // --- Image files (JPEG, PNG, WEBP, HEIC, HEIF) ---
  if (IMAGE_TYPES.includes(mimeType) || file.name.match(/\.(heic|heif)$/i)) {
    const imageBase64 = await fileToBase64(file);
    return { text: "", imageBase64, isImageMode: true };
  }

  // --- PDF files ---
  if (mimeType === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // Always render page 1 as an image — this allows the AI to detect visual
    // elements like signatures that are not present in the text layer.
    const imageBase64 = await pdfPageToBase64(pdf);
    const text = await extractPdfText(pdf);

    if (text.length >= MIN_TEXT_LENGTH) {
      // Digital PDF: send both text (for field extraction accuracy) and image
      // (for visual signature detection). isImageMode=false means the server
      // will include the image as a supplementary visual alongside the text.
      return { text, imageBase64, isImageMode: false };
    } else {
      // Scanned PDF or image-only PDF — image is the primary source
      return { text, imageBase64, isImageMode: true };
    }
  }

  // --- Excel files (.xls, .xlsx, .xlsm, .xlt, .xltx, .xltm) ---
  if (isExcelFile(file)) {
    const { text } = await extractExcelText(file);
    return { text, imageBase64: null, isImageMode: false };
  }

  // --- Word files (.doc, .docx, .dot, .dotx) ---
  if (isWordFile(file)) {
    const { text } = await extractWordText(file);
    return { text, imageBase64: null, isImageMode: false };
  }

  // --- Fallback: treat as image ---
  try {
    const imageBase64 = await fileToBase64(file);
    return { text: "", imageBase64, isImageMode: true };
  } catch {
    return { text: "", imageBase64: null, isImageMode: false };
  }
}
