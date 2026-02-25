/**
 * Tests for resolveLenderAbbreviation and computeMissingFields
 * These functions live in client/src/lib/aiProcessor.ts but we test their logic
 * here using equivalent pure-function implementations to avoid browser-only imports.
 */
import { describe, it, expect } from "vitest";
import { LENDERS } from "../client/src/lib/documentTypes";

// ---- resolveLenderAbbreviation (pure logic, no browser deps) ----
function resolveLenderAbbreviation(
  rawLender: string,
  lenderNames: Record<string, string>
): string {
  if (!rawLender) return rawLender;
  const lower = rawLender.toLowerCase().trim();

  const exactMatch = LENDERS.find(l => l.fullName.toLowerCase() === lower);
  if (exactMatch) return lenderNames[exactMatch.id] || exactMatch.abbreviation;

  const abbrMatch = LENDERS.find(l => l.abbreviation.toLowerCase() === lower);
  if (abbrMatch) return lenderNames[abbrMatch.id] || abbrMatch.abbreviation;

  const COMMON_WORDS = new Set(["bank", "the", "and", "of", "for", "in", "at", "by", "to", "a", "an"]);
  const partialMatch = LENDERS.find(l => {
    const lowerFull = l.fullName.toLowerCase();
    const lowerAbbr = l.abbreviation.toLowerCase();
    if (lower.includes(lowerFull) || lowerFull.includes(lower)) return true;
    const firstWord = lowerAbbr.split(/\s+/)[0];
    if (firstWord.length >= 3 && !COMMON_WORDS.has(firstWord)) {
      const wordBoundary = new RegExp(`(^|\\s)${firstWord}(\\s|$|\\b)`);
      if (wordBoundary.test(lower)) return true;
    }
    return false;
  });
  if (partialMatch) return lenderNames[partialMatch.id] || partialMatch.abbreviation;

  return rawLender;
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
describe("resolveLenderAbbreviation", () => {
  const defaultNames = Object.fromEntries(LENDERS.map(l => [l.id, l.abbreviation]));

  it("returns abbreviation for exact full name match", () => {
    expect(resolveLenderAbbreviation("National Australia Bank", defaultNames)).toBe("NAB");
  });

  it("is case-insensitive for full name match", () => {
    expect(resolveLenderAbbreviation("national australia bank", defaultNames)).toBe("NAB");
  });

  it("returns abbreviation for exact abbreviation match", () => {
    expect(resolveLenderAbbreviation("NAB", defaultNames)).toBe("NAB");
  });

  it("matches ING via partial first-word match", () => {
    // AI may return 'ING Banking Limited' which doesn't exactly match 'ING Australia'
    const result = resolveLenderAbbreviation("ING Banking Limited", defaultNames);
    expect(result).toBe("ING");
  });

  it("respects custom lender name overrides", () => {
    const custom = { ...defaultNames, nab: "National" };
    expect(resolveLenderAbbreviation("National Australia Bank", custom)).toBe("National");
  });

  it("returns original string when no match found", () => {
    expect(resolveLenderAbbreviation("Unknown Lender XYZ", defaultNames)).toBe("Unknown Lender XYZ");
  });

  it("returns empty string unchanged", () => {
    expect(resolveLenderAbbreviation("", defaultNames)).toBe("");
  });
});

describe("computeMissingFields", () => {
  const docType = {
    variables: [
      { key: "name", label: "{name}" },
      { key: "lender", label: "{lender}" },
      { key: "date", label: "{date}" },
    ],
  };

  it("returns empty array when all fields are present", () => {
    const result = computeMissingFields(
      "Pricing Approval {name} {lender} {date}",
      { name: "John Smith", lender: "NAB", date: "2024-06-30" },
      docType
    );
    expect(result).toEqual([]);
  });

  it("flags missing date field", () => {
    const result = computeMissingFields(
      "Pricing Approval {name} {lender} {date}",
      { name: "John Smith", lender: "NAB" },
      docType
    );
    expect(result).toEqual(["{date}"]);
  });

  it("flags multiple missing fields", () => {
    const result = computeMissingFields(
      "Pricing Approval {name} {lender} {date}",
      { name: "John Smith" },
      docType
    );
    expect(result).toContain("{lender}");
    expect(result).toContain("{date}");
    expect(result).toHaveLength(2);
  });

  it("treats empty string as missing", () => {
    const result = computeMissingFields(
      "Doc {name} {date}",
      { name: "John Smith", date: "  " },
      docType
    );
    expect(result).toEqual(["{date}"]);
  });

  it("returns empty array for template with no variables", () => {
    const result = computeMissingFields("Static Name", {}, docType);
    expect(result).toEqual([]);
  });
});
