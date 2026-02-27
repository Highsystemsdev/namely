/**
 * Tests for the Word document extractor helpers.
 * These tests cover the isWordFile() detection logic and MIME/extension constants.
 * Full extraction tests require a real .docx file and are covered by integration testing.
 */
import { describe, it, expect } from "vitest";
import { isWordFile, WORD_EXTENSIONS, WORD_MIME_TYPES } from "../client/src/lib/wordExtractor";

function makeFile(name: string, type: string): File {
  return new File(["dummy"], name, { type });
}

describe("WORD_EXTENSIONS", () => {
  it("includes all four expected extensions", () => {
    expect(WORD_EXTENSIONS).toContain(".doc");
    expect(WORD_EXTENSIONS).toContain(".docx");
    expect(WORD_EXTENSIONS).toContain(".dot");
    expect(WORD_EXTENSIONS).toContain(".dotx");
  });
});

describe("WORD_MIME_TYPES", () => {
  it("includes msword MIME type", () => {
    expect(WORD_MIME_TYPES).toContain("application/msword");
  });

  it("includes docx MIME type", () => {
    expect(WORD_MIME_TYPES).toContain(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
  });

  it("includes dotx MIME type", () => {
    expect(WORD_MIME_TYPES).toContain(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.template"
    );
  });
});

describe("isWordFile()", () => {
  it("detects .docx by extension", () => {
    expect(isWordFile(makeFile("report.docx", ""))).toBe(true);
  });

  it("detects .doc by extension", () => {
    expect(isWordFile(makeFile("old-report.doc", ""))).toBe(true);
  });

  it("detects .dot by extension", () => {
    expect(isWordFile(makeFile("template.dot", ""))).toBe(true);
  });

  it("detects .dotx by extension", () => {
    expect(isWordFile(makeFile("template.dotx", ""))).toBe(true);
  });

  it("detects .docx by MIME type even with wrong extension", () => {
    expect(
      isWordFile(
        makeFile(
          "mystery",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
      )
    ).toBe(true);
  });

  it("detects .doc by MIME type (application/msword)", () => {
    expect(isWordFile(makeFile("mystery", "application/msword"))).toBe(true);
  });

  it("does NOT detect .pdf as a Word file", () => {
    expect(isWordFile(makeFile("document.pdf", "application/pdf"))).toBe(false);
  });

  it("does NOT detect .xlsx as a Word file", () => {
    expect(
      isWordFile(
        makeFile(
          "sheet.xlsx",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
      )
    ).toBe(false);
  });

  it("does NOT detect .png as a Word file", () => {
    expect(isWordFile(makeFile("photo.png", "image/png"))).toBe(false);
  });

  it("is case-insensitive for extensions", () => {
    expect(isWordFile(makeFile("REPORT.DOCX", ""))).toBe(true);
    expect(isWordFile(makeFile("TEMPLATE.DOT", ""))).toBe(true);
  });
});
