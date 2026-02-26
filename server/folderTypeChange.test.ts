/**
 * Tests for the document type change logic used in FolderRenamePreviewDialog.
 * The handleFolderTypeChange handler in Home.tsx:
 *   1. Looks up the new document type
 *   2. Re-applies the template for the new type using already-extracted data
 *   3. Recomputes missing fields for the new template
 *   4. Sets userOverriddenType = true
 *
 * We test the pure functions (applyTemplate, computeMissingFields) that power
 * this behaviour, plus the integration of the two.
 */
import { describe, it, expect } from "vitest";
import { DOCUMENT_TYPES } from "../client/src/lib/documentTypes";

// ---- applyTemplate (pure logic, mirrors client/src/lib/aiProcessor.ts) ----
function applyTemplate(
  template: string,
  extractedData: Record<string, string>,
  separator: string
): string {
  const parts = template.split(/(\{[^}]+\})/g);
  const segments = parts.map(p => p.trim()).filter(p => p.length > 0);
  let result = segments.join(separator);

  for (const [key, value] of Object.entries(extractedData)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }

  // Remove unresolved variables and clean up double-separators
  result = result.replace(/\{[^}]+\}/g, "");
  const escapedSep = separator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  result = result.replace(new RegExp(`(${escapedSep}){2,}`, "g"), separator);
  result = result.replace(new RegExp(`^(${escapedSep})+|(${escapedSep})+$`, "g"), "");
  result = result.replace(/^[\s\-_.]+|[\s\-_.]+$/g, "").trim();
  result = result.replace(/[/\\:*?"<>|]/g, "").trim();
  return result;
}

// ---- computeMissingFields (pure logic) ----
function computeMissingFields(
  template: string,
  extractedData: Record<string, string>,
  docType: { variables: Array<{ key: string; label: string }> }
): string[] {
  const tokenMatches = template.match(/\{([^}]+)\}/g) || [];
  const requiredKeys = tokenMatches.map(t => t.slice(1, -1));
  return requiredKeys
    .filter(key => {
      const value = extractedData[key];
      return !value || value.trim() === "";
    })
    .map(key => {
      const varDef = docType.variables.find(v => v.key === key);
      return varDef ? varDef.label : `{${key}}`;
    });
}

// ---- Tests ----

describe("Document type change — template re-application", () => {
  const sep = " - ";
  const extractedData = {
    name: "John Smith",
    lender: "NAB",
    date: "2024-06-30",
    employer: "Acme Corp",
  };

  it("re-applies the new template using existing extracted data", () => {
    const newType = DOCUMENT_TYPES.find(d => d.id === "payslip");
    expect(newType).toBeDefined();
    const result = applyTemplate(newType!.defaultTemplate, extractedData, sep);
    // Payslip template uses {name} and {employer} — both present in extractedData
    expect(result).toContain("John Smith");
    expect(result).toContain("Acme Corp");
  });

  it("produces a different filename when switching from one type to another", () => {
    const payslip = DOCUMENT_TYPES.find(d => d.id === "payslip");
    const taxReturn = DOCUMENT_TYPES.find(d => d.id === "individual-tax-return");
    expect(payslip).toBeDefined();
    expect(taxReturn).toBeDefined();

    const nameA = applyTemplate(payslip!.defaultTemplate, extractedData, sep);
    const nameB = applyTemplate(taxReturn!.defaultTemplate, extractedData, sep);
    // Templates differ so the resulting names should differ
    expect(nameA).not.toBe(nameB);
  });

  it("preserves extracted data that is not in the new template (no corruption)", () => {
    const newType = DOCUMENT_TYPES.find(d => d.id === "savings-statement");
    expect(newType).toBeDefined();
    const result = applyTemplate(newType!.defaultTemplate, extractedData, sep);
    // Result should be a valid non-empty string
    expect(result.length).toBeGreaterThan(0);
    // Should not contain raw {variable} tokens
    expect(result).not.toMatch(/\{[^}]+\}/);
  });
});

describe("Document type change — missing field recomputation", () => {
  it("reports no missing fields when all template vars are present", () => {
    const docType = DOCUMENT_TYPES.find(d => d.id === "payslip")!;
    // Payslip template: "Payslip {name} {employer} {payPeriod}"
    const data = { name: "John Smith", employer: "Acme Corp", payPeriod: "2024-06-30" };
    const missing = computeMissingFields(docType.defaultTemplate, data, docType);
    expect(missing).toEqual([]);
  });

  it("reports missing fields after switching to a type with more required vars", () => {
    // Switch to a type that requires {lender} — if lender is absent, it should be flagged
    const docType = DOCUMENT_TYPES.find(d => d.id === "home-loan-statement")!;
    const dataWithoutLender = { name: "John Smith", date: "2024-06-30" };
    const missing = computeMissingFields(docType.defaultTemplate, dataWithoutLender, docType);
    // lender is in the template but not in data, so it should appear in missing
    if (docType.defaultTemplate.includes("{lender}")) {
      expect(missing.some(m => m.toLowerCase().includes("lender"))).toBe(true);
    }
  });

  it("reports no missing fields when switching to a simpler type", () => {
    // drivers-license template: "Drivers License {name} {expiryDate}"
    const docType = DOCUMENT_TYPES.find(d => d.id === "drivers-license")!;
    const data = { name: "John Smith", expiryDate: "2027-06" };
    const missing = computeMissingFields(docType.defaultTemplate, data, docType);
    expect(missing).toEqual([]);
  });
});

describe("DOCUMENT_TYPES registry", () => {
  it("contains at least 60 document types", () => {
    expect(DOCUMENT_TYPES.length).toBeGreaterThanOrEqual(60);
  });

  it("every document type has a unique id", () => {
    const ids = DOCUMENT_TYPES.map(d => d.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("every document type has a non-empty label and defaultTemplate", () => {
    for (const dt of DOCUMENT_TYPES) {
      expect(dt.label.length, `${dt.id} label`).toBeGreaterThan(0);
      expect(dt.defaultTemplate.length, `${dt.id} defaultTemplate`).toBeGreaterThan(0);
    }
  });
});
