/**
 * Namely — Document Classification Router
 * Receives extracted text or a base64 image from the frontend,
 * calls the Forge LLM (server-side, secure), and returns structured
 * document classification + field extraction results.
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

// The 62 document types the model must choose from
const DOCUMENT_TYPE_LIST = [
  "ATO Tax Account", "Birth Certificate", "BNPL Statement", "Business Activity Statement",
  "Centrelink Statement", "Certificate of Currency", "Child Support Letter",
  "Citizenship Certificate", "Company Tax Return", "Conditional Approval Letter",
  "Contract of Sale", "Credit Card Statement", "Credit Guide",
  "Credit Guide and Privacy Statement", "Credit Proposal Disclosure", "Credit Report",
  "Deposit Receipt", "Driver's License", "Electricity Bill", "Employment Contract",
  "Fact Find", "Financial Passport", "Financial Statements", "First Home Buyer Declaration",
  "Formal Approval Letter", "Gift Letter", "HECS/HELP Statement", "Home Loan Statement",
  "Income Statement", "Individual Tax Return", "Line of Credit Statement",
  "Marriage Certificate", "Medicare Card", "Notice of Assessment",
  "Open Banking Account Summary", "Open Banking Credit Card", "Open Banking Home Loan",
  "Open Banking Line of Credit", "Open Banking Personal Loan", "Open Banking Savings",
  "Partnership Tax Return", "Passport", "Payslip", "Personal Loan Statement",
  "Pricing Approval", "Privacy Statement", "Property Valuation", "Quickli Servicing",
  "Rates Notice", "Rental Appraisal", "Rental Statement", "Salary Packaging",
  "Savings Statement", "Serviceability Calc", "Settlement Letter",
  "Superannuation Statement", "Tenancy Agreement", "Transaction Listing", "Trust Deed",
  "Trust Tax Return", "Visa/Immigration", "Water Bill", "Discharge Form", "Loan Offer & Mortgage", "Unknown",
];

// Map from document type label to the template ID used in the app
const LABEL_TO_ID: Record<string, string> = {
  "ATO Tax Account": "ato-tax-account",
  "Birth Certificate": "birth-certificate",
  "BNPL Statement": "bnpl-statement",
  "Business Activity Statement": "business-activity-statement",
  "Centrelink Statement": "centrelink-statement",
  "Certificate of Currency": "certificate-of-currency",
  "Child Support Letter": "child-support-letter",
  "Citizenship Certificate": "citizenship-certificate",
  "Company Tax Return": "company-tax-return",
  "Conditional Approval Letter": "conditional-approval-letter",
  "Contract of Sale": "contract-of-sale",
  "Credit Card Statement": "credit-card-statement",
  "Credit Guide": "credit-guide",
  "Credit Guide and Privacy Statement": "credit-guide-privacy",
  "Credit Proposal Disclosure": "credit-proposal-disclosure",
  "Credit Report": "credit-report",
  "Deposit Receipt": "deposit-receipt",
  "Driver's License": "drivers-license",
  "Electricity Bill": "electricity-bill",
  "Employment Contract": "employment-contract",
  "Fact Find": "fact-find",
  "Financial Passport": "financial-passport",
  "Financial Statements": "financial-statements",
  "First Home Buyer Declaration": "first-home-buyer-declaration",
  "Formal Approval Letter": "formal-approval-letter",
  "Gift Letter": "gift-letter",
  "HECS/HELP Statement": "hecs-help-statement",
  "Home Loan Statement": "home-loan-statement",
  "Income Statement": "income-statement",
  "Individual Tax Return": "individual-tax-return",
  "Line of Credit Statement": "line-of-credit-statement",
  "Marriage Certificate": "marriage-certificate",
  "Medicare Card": "medicare-card",
  "Notice of Assessment": "notice-of-assessment",
  "Open Banking Account Summary": "open-banking-account-summary",
  "Open Banking Credit Card": "open-banking-credit-card",
  "Open Banking Home Loan": "open-banking-home-loan",
  "Open Banking Line of Credit": "open-banking-line-of-credit",
  "Open Banking Personal Loan": "open-banking-personal-loan",
  "Open Banking Savings": "open-banking-savings",
  "Partnership Tax Return": "partnership-tax-return",
  "Passport": "passport",
  "Payslip": "payslip",
  "Personal Loan Statement": "personal-loan-statement",
  "Pricing Approval": "pricing-approval",
  "Privacy Statement": "privacy-statement",
  "Property Valuation": "property-valuation",
  "Quickli Servicing": "quickli-servicing",
  "Rates Notice": "rates-notice",
  "Rental Appraisal": "rental-appraisal",
  "Rental Statement": "rental-statement",
  "Salary Packaging": "salary-packaging",
  "Savings Statement": "savings-statement",
  "Serviceability Calc": "serviceability-calc",
  "Settlement Letter": "settlement-letter",
  "Superannuation Statement": "superannuation-statement",
  "Tenancy Agreement": "tenancy-agreement",
  "Transaction Listing": "transaction-listing",
  "Trust Deed": "trust-deed",
  "Trust Tax Return": "trust-tax-return",
  "Visa/Immigration": "visa-immigration",
  "Water Bill": "water-bill",
  "Discharge Form": "discharge-form",
  "Loan Offer & Mortgage": "loan-offer-mortgage",
};

function buildSystemPrompt(customTypeLabels?: string[]): string {
  return `You are an expert document classifier and data extractor for an Australian mortgage broking context.
Your task is to:
1. Identify the document type from the provided list
2. Extract all relevant fields from the document
3. Return a strict JSON response

DOCUMENT TYPES (choose exactly one):
${DOCUMENT_TYPE_LIST.join(", ")}

FIELD EXTRACTION RULES:
- name: Full name of the primary person. ALWAYS return in "Firstname [Middle] Surname" order (e.g. "John Michael Smith", "Sarah J Williams"). Never return "Surname, Firstname" or "SURNAME Firstname" format. For companies, use the company name.
  Document-type name format guidance:
  * Medicare Card, Driver's License, Passport, Birth Certificate, Marriage Certificate, Citizenship Certificate: names are printed as "SURNAME Firstname" or "Firstname Surname" — always convert to "Firstname Surname" order.
  * Notice of Assessment, Individual Tax Return, Company Tax Return, ATO Tax Account: names may appear as "Surname, Firstname Initial" (e.g. "Kennedy, John J") — always convert to "Firstname Initial Surname" (e.g. "John J Kennedy").
  * Payslip, Income Statement, Employment Contract: names are typically "Firstname Surname" — return as-is.
  * For all other documents: return the name in natural "Firstname [Middle] Surname" order.
- date: Primary document date in DD-MM-YYYY format (e.g. "30-06-2023"). ALWAYS attempt to extract a date. If the full date is not visible, return a partial date: year only as "01-01-YYYY", or month and year as "01-MM-YYYY". Only omit entirely if no date information whatsoever is present.
- expiryDate: Expiry date in DD-MM-YYYY format. Apply the same partial-date rule as above.
- payPeriod: Pay period end date in DD-MM-YYYY format. Apply the same partial-date rule as above.
- statementDate: Statement date in DD-MM-YYYY format. Apply the same partial-date rule as above.
- financialYear: Financial year as "YYYY-YY" (e.g. "2022-23")
- month: Statement month as "Month YYYY" (e.g. "June 2023")
- lender: Financial institution full name exactly as it appears on the document (e.g. "National Australia Bank", "ING Banking Limited", "Commonwealth Bank of Australia"). Do NOT abbreviate — return the full name so it can be matched to the correct abbreviation. If no lender is visible, omit this field.
- employer: Employer name
- company: Company or business name
- abn: ABN as 11 digits without spaces (e.g. "12345678901")
- accountNumber: Account number
- balance: Dollar amount with $ sign (e.g. "$45,230.00")
- totalBalance: Total balance with $ sign
- creditLimit: Credit limit with $ sign
- grossPay: Gross pay with $ sign
- totalIncome: Total income with $ sign
- taxableIncome: Taxable income with $ sign
- loanAmount: Loan amount with $ sign
- purchasePrice: Purchase price with $ sign
- valuationAmount: Valuation amount with $ sign
- weeklyRent: Weekly rent with $ sign
- weeklyAmount: Weekly amount with $ sign
- propertyAddress: Full property address
- documentNumber: Document/reference/licence number
- period: Period description (e.g. "Q4 2022-23")
- gstOwed: GST amount with $ sign
- paymentType: Type of Centrelink payment (e.g. "JobSeeker")
- incomeTaxBalance: Income tax balance with $ sign
- activityStatementBalance: Activity statement balance with $ sign
- signed: MANDATORY field — always include this in your response. Carefully examine the document for any signature: handwritten ink signatures, drawn/scribbled marks in signature boxes, digital signature blocks, typed names in signature fields, or any mark clearly intended as a signature. Return "Signed" if ANY signature is present anywhere on the document. Return "" (empty string) if the document is completely unsigned, is a blank template, or has empty signature boxes with no marks. Do NOT omit this field.

SIGNATURE DETECTION GUIDANCE:
- Look for: cursive/handwritten marks, scribbles, initials, printed names in designated signature areas, digital signature images, "Signed by" blocks
- Blank signature lines with nothing on them = unsigned (return "")
- A printed name typed into a signature field = signed (return "Signed")
- Any mark, scribble, or image in a signature box = signed (return "Signed")

RESPONSE FORMAT (strict JSON, no markdown, no explanation):
{
  "documentType": "<exact type from list>",
  "confidence": <0-100 integer>,
  "fields": {
    "signed": "Signed" or "",
    "<other fieldName>": "<value>",
    ...
  }
}

Only include fields (other than signed) that are clearly present in the document. Do not guess or fabricate values.
If you cannot determine the document type, use "Unknown" with confidence 0.${customTypeLabels && customTypeLabels.length > 0 ? `

ADDITIONAL USER-DEFINED DOCUMENT TYPES (also valid classifications, treat with same priority as built-in types):
${customTypeLabels.map(l => `- ${l}`).join("\n")}` : ""}`;
}

export const classifyRouter = router({
  classify: publicProcedure
    .input(
      z.object({
        /** Extracted text from the document (for digital PDFs) */
        text: z.string().optional(),
        /** Base64-encoded JPEG image of page 1 (for scanned PDFs / images) */
        imageBase64: z.string().optional(),
        /** Whether this is image mode */
        isImageMode: z.boolean(),
        /** Original filename for context */
        filename: z.string(),
        /** User-defined custom document type labels to include in classification */
        customTypeLabels: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { text, imageBase64, isImageMode, filename, customTypeLabels } = input;

      // Build user message content
      const userContent: Array<{ type: string; text?: string; image_url?: { url: string; detail: string } }> = [];

      if (isImageMode && imageBase64) {
        // Scanned PDF or image file — image is the primary source
        userContent.push({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`,
            detail: "high",
          },
        });
        userContent.push({
          type: "text",
          text: `Classify and extract data from this document. Original filename: "${filename}"`,
        });
      } else if (text && imageBase64) {
        // Digital PDF — send both text (for field accuracy) and image (for signature detection)
        userContent.push({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`,
            detail: "high",
          },
        });
        userContent.push({
          type: "text",
          text: `Classify and extract data from this document. Use the image to detect signatures and visual elements. Use the text for accurate field extraction.\n\nOriginal filename: "${filename}"\n\nDOCUMENT TEXT:\n${text.slice(0, 8000)}`,
        });
      } else {
        userContent.push({
          type: "text",
          text: `Classify and extract data from this document text.\n\nOriginal filename: "${filename}"\n\nDOCUMENT TEXT:\n${(text || "").slice(0, 8000)}`,
        });
      }

      const result = await invokeLLM({
        messages: [
          { role: "system", content: buildSystemPrompt(customTypeLabels) },
          { role: "user", content: userContent as any },
        ],
        // Note: Do NOT pass response_format — Gemini 2.5 Flash does not support
        // the OpenAI json_object mode. We instruct via the system prompt instead.
      });

      const content = result.choices?.[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error("Empty response from LLM");
      }

      // Gemini may wrap JSON in markdown code fences or thinking tags — extract robustly
      let jsonStr = content.trim();

      // Strip thinking tags if present (e.g. <thinking>...</thinking>)
      jsonStr = jsonStr.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "").trim();

      // Extract JSON from markdown code fences if present
      const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) {
        jsonStr = fenceMatch[1].trim();
      } else {
        // Find the first { and last } to extract raw JSON
        const start = jsonStr.indexOf("{");
        const end = jsonStr.lastIndexOf("}");
        if (start !== -1 && end !== -1 && end > start) {
          jsonStr = jsonStr.slice(start, end + 1);
        }
      }

      let parsed: { documentType: string; confidence: number; fields: Record<string, string> };
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        console.error("[classify] Failed to parse LLM response:", content.slice(0, 500));
        throw new Error(`Failed to parse LLM response as JSON: ${content.slice(0, 200)}`);
      }

      const label = parsed.documentType || "Unknown";
      // Check built-in types first, then resolve custom types by matching the label
      let typeId = LABEL_TO_ID[label];
      if (!typeId && customTypeLabels && customTypeLabels.includes(label)) {
        // Custom type: generate the same ID format used on the client
        typeId = "custom-" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      }
      typeId = typeId || "unknown";
      const confidence = Math.max(0, Math.min(100, parsed.confidence || 0));
      const fields = parsed.fields || {};

      return {
        documentTypeId: typeId,
        documentTypeLabel: label,
        confidence,
        extractedData: fields,
      };
    }),
});
