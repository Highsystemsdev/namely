/**
 * excelExtractor.ts
 *
 * Extracts plain text from Excel files (.xls, .xlsx, .xlsm, .xlt, .xltx, .xltm)
 * using SheetJS (xlsx). The extracted text is passed to the AI classifier the
 * same way PDF text is — no visual rendering required.
 *
 * Strategy:
 *  1. Read the workbook from an ArrayBuffer.
 *  2. For each sheet, convert to CSV (preserves row/column structure).
 *  3. Concatenate all sheets with a header so the AI knows which sheet it is reading.
 *  4. Truncate to a reasonable character limit to avoid oversized prompts.
 */

import * as XLSX from "xlsx";

/** Maximum characters to send to the AI (keeps prompts manageable) */
const MAX_CHARS = 8000;

export interface ExcelExtractResult {
  text: string;
  sheetNames: string[];
  truncated: boolean;
}

/**
 * Extract all text content from an Excel file.
 * @param file - The File object from an input or drag-and-drop event.
 */
export async function extractExcelText(file: File): Promise<ExcelExtractResult> {
  const arrayBuffer = await file.arrayBuffer();

  const workbook = XLSX.read(arrayBuffer, {
    type: "array",
    // Don't execute formulas — we only need values
    cellFormula: false,
    // Include cell text (formatted values like dates, currency)
    cellText: true,
    // Don't parse styles — faster and we don't need them
    cellStyles: false,
  });

  const sheetNames = workbook.SheetNames;
  const parts: string[] = [];

  for (const name of sheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;

    // Convert to CSV — preserves row/column layout better than raw JSON
    const csv = XLSX.utils.sheet_to_csv(sheet, {
      blankrows: false,
      skipHidden: true,
    });

    // Skip sheets that are entirely empty
    const trimmed = csv.trim();
    if (!trimmed || trimmed === ",".repeat(trimmed.length)) continue;

    parts.push(`=== Sheet: ${name} ===\n${trimmed}`);
  }

  const fullText = parts.join("\n\n");

  if (fullText.length <= MAX_CHARS) {
    return { text: fullText, sheetNames, truncated: false };
  }

  return {
    text: fullText.slice(0, MAX_CHARS) + "\n\n[... content truncated ...]",
    sheetNames,
    truncated: true,
  };
}

/**
 * Returns true if the file extension is a supported Excel format.
 */
export function isExcelFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return EXCEL_EXTENSIONS.some(ext => name.endsWith(ext));
}

export const EXCEL_EXTENSIONS = [".xls", ".xlsx", ".xlsm", ".xlt", ".xltx", ".xltm"];

export const EXCEL_MIME_TYPES = [
  "application/vnd.ms-excel",                                          // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel.sheet.macroEnabled.12",                    // .xlsm
  "application/vnd.ms-excel.template",                                 // .xlt
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template", // .xltx
  "application/vnd.ms-excel.template.macroEnabled.12",                 // .xltm
];
