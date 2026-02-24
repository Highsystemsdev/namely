/**
 * Tests for normaliseNameOrder, applyTemplate separator logic, and the .pdf extension default.
 */
import { describe, expect, it } from "vitest";
import { normaliseNameOrder, applyTemplate } from "../client/src/lib/aiProcessor";

// ─── normaliseNameOrder ────────────────────────────────────────────────────────

describe("normaliseNameOrder", () => {
  it("converts 'Smith, John' to 'John Smith'", () => {
    expect(normaliseNameOrder("Smith, John")).toBe("John Smith");
  });

  it("converts 'WILLIAMS, Sarah Jane' to 'Sarah Jane Williams'", () => {
    expect(normaliseNameOrder("WILLIAMS, Sarah Jane")).toBe("Sarah Jane Williams");
  });

  it("converts 'O'Brien, Patrick' to 'Patrick O'Brien'", () => {
    expect(normaliseNameOrder("O'Brien, Patrick")).toBe("Patrick O'Brien");
  });

  it("handles 'Surname, Firstname Middle' with three tokens", () => {
    expect(normaliseNameOrder("Johnson, Michael Robert")).toBe("Michael Robert Johnson");
  });

  it("converts 'SMITH John' to 'John Smith'", () => {
    expect(normaliseNameOrder("SMITH John")).toBe("John Smith");
  });

  it("converts 'TAYLOR Jessica Anne' to 'Jessica Anne Taylor'", () => {
    expect(normaliseNameOrder("TAYLOR Jessica Anne")).toBe("Jessica Anne Taylor");
  });

  // Critical: single-letter initial must NOT be treated as a surname
  it("does NOT swap 'John J Kennedy' — J is a middle initial, not a surname", () => {
    expect(normaliseNameOrder("John J Kennedy")).toBe("John J Kennedy");
  });

  it("does NOT swap 'Sarah J Williams' — J is a middle initial", () => {
    expect(normaliseNameOrder("Sarah J Williams")).toBe("Sarah J Williams");
  });

  it("leaves 'John Smith' unchanged", () => {
    expect(normaliseNameOrder("John Smith")).toBe("John Smith");
  });

  it("leaves 'Natalia Siwek' unchanged — already correct", () => {
    expect(normaliseNameOrder("Natalia Siwek")).toBe("Natalia Siwek");
  });

  it("leaves 'Sarah Jane Williams' unchanged", () => {
    expect(normaliseNameOrder("Sarah Jane Williams")).toBe("Sarah Jane Williams");
  });

  it("title-cases a fully lowercase name 'john smith'", () => {
    expect(normaliseNameOrder("john smith")).toBe("John Smith");
  });

  it("handles empty string gracefully", () => {
    expect(normaliseNameOrder("")).toBe("");
  });

  it("handles single name token", () => {
    expect(normaliseNameOrder("Madonna")).toBe("Madonna");
  });
});

// ─── applyTemplate separator logic ────────────────────────────────────────────

describe("applyTemplate separator — spaced hyphen", () => {
  const sep = " - ";
  const args = (separator = sep) => ({
    separator,
    nameFormat: "first-middle-last",
    dateOrder: "YYYY-MM-DD",
    dateSeparator: "none",
  });

  it("puts ' - ' between segments but preserves spaces within 'Drivers License'", () => {
    const result = applyTemplate(
      "Drivers License {name} {expiryDate}",
      { name: "John Joseph Kennedy", expiryDate: "20321231" },
      args().separator, args().nameFormat, args().dateOrder, args().dateSeparator
    );
    expect(result).toBe("Drivers License - John Joseph Kennedy - 20321231");
  });

  it("puts ' - ' between segments but preserves spaces within 'Notice of Assessment'", () => {
    const result = applyTemplate(
      "Notice of Assessment {name} {financialYear}",
      { name: "John J Kennedy", financialYear: "2024-25" },
      args().separator, args().nameFormat, args().dateOrder, args().dateSeparator
    );
    expect(result).toBe("Notice of Assessment - John J Kennedy - 2024-25");
  });

  it("handles missing variable without double separator", () => {
    const result = applyTemplate(
      "Notice of Assessment {name} {financialYear}",
      { name: "John J Kennedy" },
      args().separator, args().nameFormat, args().dateOrder, args().dateSeparator
    );
    expect(result).not.toContain(" -  - ");
    expect(result).toBe("Notice of Assessment - John J Kennedy");
  });

  it("plain hyphen separator also preserves spaces within literal text", () => {
    const result = applyTemplate(
      "Drivers License {name} {expiryDate}",
      { name: "John Smith", expiryDate: "20280706" },
      "-", "first-middle-last", "YYYY-MM-DD", "none"
    );
    // Literal text spaces are now preserved with all separators — separator only goes between segments
    expect(result).toBe("Drivers License-John Smith-20280706");
  });

  it("Medicare Card with spaced hyphen preserves name spaces", () => {
    const result = applyTemplate(
      "Medicare Card {name} {expiryDate}",
      { name: "Natalia Siwek", expiryDate: "20290531" },
      args().separator, args().nameFormat, args().dateOrder, args().dateSeparator
    );
    expect(result).toBe("Medicare Card - Natalia Siwek - 20290531");
  });
});
