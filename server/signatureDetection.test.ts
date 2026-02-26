/**
 * Tests for the {signed} tag and Discharge Form document type.
 *
 * The {signed} tag is a conditional tag:
 *  - When the AI detects a signature it returns signed: "Signed"
 *  - When unsigned / blank template it returns signed: "" (empty string)
 *  - The existing applyTemplate cleanup removes the empty token and any
 *    resulting double-separators, so the filename is clean in both cases.
 */
import { describe, it, expect } from "vitest";
import { DOCUMENT_TYPES, MASTER_TAGS } from "../client/src/lib/documentTypes";

// ---- applyTemplate (pure logic mirror of client/src/lib/aiProcessor.ts) ----
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

const sep = " - ";
const dischargeType = DOCUMENT_TYPES.find(d => d.id === "discharge-form")!;

describe("Discharge Form document type", () => {
  it("exists in DOCUMENT_TYPES", () => {
    expect(dischargeType).toBeDefined();
    expect(dischargeType.label).toBe("Discharge Form");
  });

  it("has the correct default template", () => {
    expect(dischargeType.defaultTemplate).toBe("Discharge Form {lender} {name} {date} {signed}");
  });

  it("includes lender, name, date, and signed in its variables", () => {
    const keys = dischargeType.variables.map(v => v.key);
    expect(keys).toContain("lender");
    expect(keys).toContain("name");
    expect(keys).toContain("date");
    expect(keys).toContain("signed");
  });
});

describe("{signed} tag — conditional rendering", () => {
  const baseData = {
    lender: "NAB",
    name: "John Smith",
    date: "01-06-2024",
  };

  it("appends 'Signed' when signature is detected", () => {
    const result = applyTemplate(dischargeType.defaultTemplate, { ...baseData, signed: "Signed" }, sep);
    expect(result).toBe("Discharge Form - NAB - John Smith - 01-06-2024 - Signed");
  });

  it("omits 'Signed' and trailing separator when no signature is detected", () => {
    const result = applyTemplate(dischargeType.defaultTemplate, { ...baseData, signed: "" }, sep);
    expect(result).toBe("Discharge Form - NAB - John Smith - 01-06-2024");
    // Must not end with a separator or the word "Signed"
    expect(result).not.toMatch(/ - $/);
    expect(result).not.toContain("Signed");
  });

  it("omits 'Signed' when signed field is absent entirely", () => {
    const result = applyTemplate(dischargeType.defaultTemplate, baseData, sep);
    expect(result).toBe("Discharge Form - NAB - John Smith - 01-06-2024");
  });

  it("works with underscore separator", () => {
    const result = applyTemplate(dischargeType.defaultTemplate, { ...baseData, signed: "Signed" }, "_");
    expect(result).toBe("Discharge Form_NAB_John Smith_01-06-2024_Signed");
  });

  it("works with hyphen separator", () => {
    const result = applyTemplate(dischargeType.defaultTemplate, { ...baseData, signed: "" }, "-");
    expect(result).toBe("Discharge Form-NAB-John Smith-01-06-2024");
  });
});

describe("{signed} tag in MASTER_TAGS", () => {
  it("is present in MASTER_TAGS", () => {
    const signedTag = MASTER_TAGS.find(t => t.key === "signed");
    expect(signedTag).toBeDefined();
    expect(signedTag!.example).toBe("Signed");
  });
});
