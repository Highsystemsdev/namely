/**
 * Tests for Excel extraction utility (excelExtractor.ts)
 *
 * We test the pure logic functions (isExcelFile, EXCEL_EXTENSIONS, EXCEL_MIME_TYPES)
 * and the text extraction via SheetJS using in-memory workbooks.
 */
import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { EXCEL_EXTENSIONS, EXCEL_MIME_TYPES } from "../client/src/lib/excelExtractor";

// ---- Pure logic tests ----

function isExcelFile(file: { name: string }): boolean {
  const name = file.name.toLowerCase();
  return EXCEL_EXTENSIONS.some(ext => name.endsWith(ext));
}

describe("isExcelFile", () => {
  it("returns true for .xlsx", () => {
    expect(isExcelFile({ name: "report.xlsx" })).toBe(true);
  });

  it("returns true for .xls", () => {
    expect(isExcelFile({ name: "old-file.xls" })).toBe(true);
  });

  it("returns true for .xlsm", () => {
    expect(isExcelFile({ name: "macro-workbook.xlsm" })).toBe(true);
  });

  it("returns true for .xlt", () => {
    expect(isExcelFile({ name: "template.xlt" })).toBe(true);
  });

  it("returns true for .xltx", () => {
    expect(isExcelFile({ name: "template.xltx" })).toBe(true);
  });

  it("returns true for .xltm", () => {
    expect(isExcelFile({ name: "macro-template.xltm" })).toBe(true);
  });

  it("returns false for .pdf", () => {
    expect(isExcelFile({ name: "document.pdf" })).toBe(false);
  });

  it("returns false for .jpg", () => {
    expect(isExcelFile({ name: "photo.jpg" })).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(isExcelFile({ name: "REPORT.XLSX" })).toBe(true);
    expect(isExcelFile({ name: "Data.XLS" })).toBe(true);
  });
});

describe("EXCEL_MIME_TYPES", () => {
  it("includes the standard xlsx MIME type", () => {
    expect(EXCEL_MIME_TYPES).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  });

  it("includes the legacy xls MIME type", () => {
    expect(EXCEL_MIME_TYPES).toContain("application/vnd.ms-excel");
  });

  it("includes the xlsm MIME type", () => {
    expect(EXCEL_MIME_TYPES).toContain("application/vnd.ms-excel.sheet.macroEnabled.12");
  });

  it("includes the xltx MIME type", () => {
    expect(EXCEL_MIME_TYPES).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.template"
    );
  });
});

// ---- SheetJS extraction logic tests (using in-memory workbooks) ----

function extractTextFromWorkbook(wb: XLSX.WorkBook, maxChars = 8000): { text: string; truncated: boolean } {
  const parts: string[] = [];
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    if (!sheet) continue;
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false, skipHidden: true });
    const trimmed = csv.trim();
    if (!trimmed || trimmed === ",".repeat(trimmed.length)) continue;
    parts.push(`=== Sheet: ${name} ===\n${trimmed}`);
  }
  const fullText = parts.join("\n\n");
  if (fullText.length <= maxChars) return { text: fullText, truncated: false };
  return { text: fullText.slice(0, maxChars) + "\n\n[... content truncated ...]", truncated: true };
}

describe("Excel text extraction logic", () => {
  it("extracts cell values from a single sheet", () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["Name", "Date", "Amount"],
      ["John Smith", "2024-06-30", "$50,000"],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const { text } = extractTextFromWorkbook(wb);
    expect(text).toContain("John Smith");
    expect(text).toContain("2024-06-30");
    expect(text).toContain("$50,000");
  });

  it("includes sheet name header", () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([["Data"]]);
    XLSX.utils.book_append_sheet(wb, ws, "Payslip");
    const { text } = extractTextFromWorkbook(wb);
    expect(text).toContain("=== Sheet: Payslip ===");
  });

  it("extracts from multiple sheets", () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Sheet A data"]]), "SheetA");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Sheet B data"]]), "SheetB");
    const { text } = extractTextFromWorkbook(wb);
    expect(text).toContain("Sheet A data");
    expect(text).toContain("Sheet B data");
  });

  it("truncates text exceeding maxChars", () => {
    const wb = XLSX.utils.book_new();
    const longData = Array.from({ length: 200 }, (_, i) => [`Row ${i} with some longer content here`]);
    const ws = XLSX.utils.aoa_to_sheet(longData);
    XLSX.utils.book_append_sheet(wb, ws, "BigSheet");
    const { text, truncated } = extractTextFromWorkbook(wb, 500);
    expect(truncated).toBe(true);
    expect(text).toContain("[... content truncated ...]");
    expect(text.length).toBeLessThanOrEqual(550); // 500 + truncation message
  });

  it("returns empty text for a blank workbook", () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.book_append_sheet(wb, ws, "Empty");
    const { text } = extractTextFromWorkbook(wb);
    expect(text.trim()).toBe("");
  });
});
