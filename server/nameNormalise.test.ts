/**
 * Tests for normaliseNameOrder, applyTemplate separator logic, and the .pdf extension default.
 */
import { describe, expect, it } from "vitest";
import { normaliseNameOrder, applyTemplate } from "../client/src/lib/aiProcessor";

// ─── normaliseNameOrder ────────────────────────────────────────────────────────

describe("normaliseNameOrder", () => {
  // Pattern 1: comma-separated "Surname, Firstname"
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

  // Pattern 2: all-caps first token "SURNAME Firstname" (3+ chars only)
  it("converts 'SMITH John' to 'John Smith'", () => {
    expect(normaliseNameOrder("SMITH John")).toBe("John Smith");
  });

  it("converts 'TAYLOR Jessica Anne' to 'Jessica Anne Taylor'", () => {
    expect(normaliseNameOrder("TAYLOR Jessica Anne")).toBe("Jessica Anne Taylor");
  });

  // Critical fix: single-letter initial must NOT be treated as a surname
  it("does NOT swap 'John J Kennedy' — J is a middle initial, not a surname", () => {
    expect(normaliseNameOrder("John J Kennedy")).toBe("John J Kennedy");
  });

  it("does NOT swap 'Sarah J Williams' — J is a middle initial", () => {
    expect(normaliseNameOrder("Sarah J Williams")).toBe("Sarah J Williams");
  });

  // Pattern 3: already correct "Firstname Surname"
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

describe("applyTemplate separator", () => {
  const defaultArgs = {
    separator: "-",
    nameFormat: "first-middle-last",
    dateOrder: "DD-MM-YYYY",
    dateSeparator: "-",
  };

  it("puts hyphen between segments but NOT within a multi-word name", () => {
    const result = applyTemplate(
      "Drivers Licence {name} {date}",
      { name: "John Smith", date: "06-07-2028" },
      defaultArgs.separator,
      defaultArgs.nameFormat,
      defaultArgs.dateOrder,
      defaultArgs.dateSeparator
    );
    // Expected: "Drivers-Licence-John Smith-06-07-2028"
    expect(result).toBe("Drivers-Licence-John Smith-06-07-2028");
  });

  it("puts hyphen between segments but NOT within a three-word name", () => {
    const result = applyTemplate(
      "Payslip {name} {date}",
      { name: "John Michael Smith", date: "31-01-2025" },
      defaultArgs.separator,
      defaultArgs.nameFormat,
      defaultArgs.dateOrder,
      defaultArgs.dateSeparator
    );
    expect(result).toBe("Payslip-John Michael Smith-31-01-2025");
  });

  it("collapses double separators when a variable is missing", () => {
    const result = applyTemplate(
      "Notice of Assessment {name} {financialYear}",
      { name: "John J Kennedy" },
      defaultArgs.separator,
      defaultArgs.nameFormat,
      defaultArgs.dateOrder,
      defaultArgs.dateSeparator
    );
    // financialYear is missing, so no double separator should appear
    expect(result).not.toContain("--");
    expect(result).toBe("Notice-of-Assessment-John J Kennedy");
  });

  it("works correctly with space separator (no change to values)", () => {
    const result = applyTemplate(
      "Payslip {name} {date}",
      { name: "John Smith", date: "31-01-2025" },
      " ",
      defaultArgs.nameFormat,
      defaultArgs.dateOrder,
      defaultArgs.dateSeparator
    );
    expect(result).toBe("Payslip John Smith 31-01-2025");
  });
});
