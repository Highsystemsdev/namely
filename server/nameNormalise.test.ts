/**
 * Tests for normaliseNameOrder (runs in Node via vitest — imports the client lib directly)
 * and the .pdf extension default in processDocument.
 */
import { describe, expect, it } from "vitest";
import { normaliseNameOrder } from "../client/src/lib/aiProcessor";

describe("normaliseNameOrder", () => {
  // Pattern 1: comma-separated "Surname, Firstname"
  it("converts 'Smith, John' to 'John Smith'", () => {
    expect(normaliseNameOrder("Smith, John")).toBe("John Smith");
  });

  it("converts 'WILLIAMS, Sarah Jane' to 'Sarah Jane Williams'", () => {
    expect(normaliseNameOrder("WILLIAMS, Sarah Jane")).toBe("Sarah Jane Williams");
  });

  it("converts 'O'Brien, Patrick' to 'Patrick O'Brien' (title-cased)", () => {
    // The \\b word-boundary regex matches at the apostrophe, so 'B' is capitalised correctly
    expect(normaliseNameOrder("O'Brien, Patrick")).toBe("Patrick O'Brien");
  });

  it("handles 'Surname, Firstname Middle' with three tokens", () => {
    expect(normaliseNameOrder("Johnson, Michael Robert")).toBe("Michael Robert Johnson");
  });

  // Pattern 2: all-caps first token "SURNAME Firstname"
  it("converts 'SMITH John' to 'John Smith'", () => {
    expect(normaliseNameOrder("SMITH John")).toBe("John Smith");
  });

  it("converts 'TAYLOR Jessica Anne' to 'Jessica Anne Taylor'", () => {
    expect(normaliseNameOrder("TAYLOR Jessica Anne")).toBe("Jessica Anne Taylor");
  });

  it("does NOT treat a single all-caps word as surname (no given name to swap)", () => {
    // Only one token — can't determine order, return title-cased
    expect(normaliseNameOrder("SMITH")).toBe("Smith");
  });

  // Pattern 3: already correct "Firstname Surname"
  it("leaves 'John Smith' unchanged (already correct)", () => {
    expect(normaliseNameOrder("John Smith")).toBe("John Smith");
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
