import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the invokeLLM helper so tests don't make real API calls
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            documentType: "Payslip",
            confidence: 95,
            fields: {
              name: "John Smith",
              employer: "Acme Corp",
              payPeriod: "31-01-2025",
              grossPay: "$4,500.00",
            },
          }),
        },
      },
    ],
  }),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("docs.classify", () => {
  it("classifies a text-based payslip and returns structured fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.docs.classify({
      text: "PAYSLIP Employer: Acme Corp Employee: John Smith Pay Period: 31-01-2025 Gross Pay: $4,500.00",
      isImageMode: false,
      filename: "payslip_jan.pdf",
    });

    expect(result.documentTypeId).toBe("payslip");
    expect(result.documentTypeLabel).toBe("Payslip");
    expect(result.confidence).toBe(95);
    expect(result.extractedData.name).toBe("John Smith");
    expect(result.extractedData.employer).toBe("Acme Corp");
  });

  it("returns Unknown type with confidence 0 when LLM returns Unknown", async () => {
    const { invokeLLM } = await import("./_core/llm");
    vi.mocked(invokeLLM).mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              documentType: "Unknown",
              confidence: 0,
              fields: {},
            }),
          },
        },
      ],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.docs.classify({
      text: "some unrecognised document content",
      isImageMode: false,
      filename: "mystery.pdf",
    });

    expect(result.documentTypeId).toBe("unknown");
    expect(result.confidence).toBe(0);
  });

  it("handles image mode input without text", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.docs.classify({
      imageBase64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      isImageMode: true,
      filename: "scan.jpg",
    });

    expect(result.documentTypeId).toBe("payslip");
    expect(result.confidence).toBeGreaterThan(0);
  });
});
