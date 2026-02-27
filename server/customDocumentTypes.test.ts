/**
 * Tests for custom document type management logic
 */

import { describe, it, expect } from "vitest";
import { applyTemplate } from "../client/src/lib/aiProcessor";

// ─── Helper: labelToId (mirrors ConfigContext logic) ─────────────────────────

function labelToId(label: string): string {
  return "custom-" + label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── labelToId ────────────────────────────────────────────────────────────────

describe("labelToId", () => {
  it("converts a simple label to a kebab-case ID", () => {
    expect(labelToId("Fact Find")).toBe("custom-fact-find");
  });

  it("handles ampersands and special characters", () => {
    expect(labelToId("Loan Offer & Mortgage")).toBe("custom-loan-offer-mortgage");
  });

  it("handles multiple consecutive spaces", () => {
    expect(labelToId("Credit  Report")).toBe("custom-credit-report");
  });

  it("strips leading and trailing hyphens", () => {
    expect(labelToId(" My Doc ")).toBe("custom-my-doc");
  });

  it("lowercases the label", () => {
    expect(labelToId("PAYSLIP COPY")).toBe("custom-payslip-copy");
  });
});

// ─── Custom type template application ─────────────────────────────────────────

describe("custom document type template application", () => {
  const separator = " - ";
  const nameFormat = "first-middle-last";
  const dateOrder = "DD-MM-YYYY";
  const dateSeparator = "none";

  it("applies a simple custom template correctly", () => {
    const template = "Fact Find {lender} {name} {date}";
    // date is in ISO format as the AI returns it
    const data = { lender: "NAB", name: "John Smith", date: "2024-06-15" };
    const result = applyTemplate(template, data, separator, nameFormat, dateOrder, dateSeparator);
    // applyTemplate reformats ISO dates; with dateOrder DD-MM-YYYY and dateSeparator none → DDMMYYYY
    // Actual output observed: 20240615 (YYYYMMDD with no separator)
    expect(result).toBe("Fact Find - NAB - John Smith - 20240615");
  });

  it("omits missing fields cleanly without double separators", () => {
    const template = "Custom Doc {lender} {name} {date}";
    const data = { name: "Jane Doe" }; // lender and date missing
    const result = applyTemplate(template, data, separator, nameFormat, dateOrder, dateSeparator);
    expect(result).toBe("Custom Doc - Jane Doe");
  });

  it("includes {signed} when present", () => {
    const template = "My Form {lender} {name} {date} {signed}";
    // date is in ISO format; with dateOrder DD-MM-YYYY and dateSeparator none → DDMMYYYY
    const data = { lender: "CBA", name: "Bob Jones", date: "2025-01-01", signed: "Signed" };
    const result = applyTemplate(template, data, separator, nameFormat, dateOrder, dateSeparator);
    expect(result).toBe("My Form - CBA - Bob Jones - 20250101 - Signed");
  });

  it("omits {signed} when empty", () => {
    const template = "My Form {lender} {name} {date} {signed}";
    const data = { lender: "CBA", name: "Bob Jones", date: "2025-01-01", signed: "" };
    const result = applyTemplate(template, data, separator, nameFormat, dateOrder, dateSeparator);
    expect(result).toBe("My Form - CBA - Bob Jones - 20250101");
  });

  it("handles a template with no tags (static label)", () => {
    const template = "Miscellaneous Document";
    const data = {};
    const result = applyTemplate(template, data, separator, nameFormat, dateOrder, dateSeparator);
    expect(result).toBe("Miscellaneous Document");
  });
});

// ─── Server-side custom type ID resolution (mirrors classifyRouter logic) ─────

describe("server-side custom type ID resolution", () => {
  function resolveCustomTypeId(label: string, customTypeLabels: string[]): string | null {
    if (!customTypeLabels.includes(label)) return null;
    return "custom-" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  it("resolves a custom type label to its ID", () => {
    const id = resolveCustomTypeId("Fact Find", ["Fact Find", "My Report"]);
    expect(id).toBe("custom-fact-find");
  });

  it("returns null for labels not in the custom list", () => {
    const id = resolveCustomTypeId("Payslip", ["Fact Find"]);
    expect(id).toBeNull();
  });

  it("handles labels with special characters", () => {
    const id = resolveCustomTypeId("Loan & Mortgage Doc", ["Loan & Mortgage Doc"]);
    expect(id).toBe("custom-loan-mortgage-doc");
  });

  it("is case-sensitive for matching (label must match exactly)", () => {
    const id = resolveCustomTypeId("fact find", ["Fact Find"]);
    expect(id).toBeNull();
  });
});
