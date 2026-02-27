/**
 * Doc Renamer — AI Document Processor
 * Real AI-powered document classification and data extraction via Forge API (GPT-4o).
 * Uses PDF.js for text extraction and Vision API for scanned/image documents.
 */

import { DOCUMENT_TYPES, LENDERS, MASTER_TAGS, type DocumentTypeConfig } from "./documentTypes";
import { extractDocumentContent } from "./documentExtractor";
import { extractWithForge } from "./forgeExtractor";
import type { CustomDocumentType } from "@/contexts/ConfigContext";

export interface ExtractedData {
  [key: string]: string;
}

export interface ProcessedDocument {
  id: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  documentTypeId: string;
  documentTypeLabel: string;
  confidence: number; // 0-100
  extractedData: ExtractedData;
  proposedName: string;
  customName: string | null;
  status: "processing" | "done" | "error";
  errorMessage?: string;
  /** Template variables that were required but not extracted by the AI */
  missingFields: string[];
  /** True when the user manually changed the document type in the preview dialog */
  userOverriddenType?: boolean;
  file: File;
}

// Sample extracted data for demonstration purposes
const SAMPLE_NAMES = [
  "John Michael Smith",
  "Sarah Jane Williams",
  "Michael Robert Johnson",
  "Emily Rose Brown",
  "David James Wilson",
  "Jessica Anne Taylor",
  "Christopher Lee Anderson",
  "Amanda Grace Thomas",
];

const SAMPLE_EMPLOYERS = [
  "Acme Corporation",
  "Global Tech Solutions",
  "Pacific Industries",
  "Metro Services Group",
  "Sunrise Healthcare",
];

const SAMPLE_ADDRESSES = [
  "12 Harbour View Drive, Sydney NSW 2000",
  "45 Collins Street, Melbourne VIC 3000",
  "8 Queen Street, Brisbane QLD 4000",
  "23 St Georges Terrace, Perth WA 6000",
  "100 King William Street, Adelaide SA 5000",
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomABN(): string {
  const digits = Array.from({ length: 11 }, () => Math.floor(Math.random() * 10));
  return digits.join(" ").replace(/(\d{2}) (\d{3}) (\d{3}) (\d{3})/, "$1 $2 $3 $4");
}

function randomAccountNumber(): string {
  return Math.floor(Math.random() * 900000000 + 100000000).toString();
}

function randomAmount(min: number, max: number): string {
  const amount = Math.floor(Math.random() * (max - min) + min);
  return `$${amount.toLocaleString()}`;
}

function randomDate(): string {
  const year = 2022 + Math.floor(Math.random() * 3);
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, "0");
  return `${day}-${month}-${year}`;
}

function randomExpiryDate(): string {
  const year = 2025 + Math.floor(Math.random() * 5);
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
  return `${month}-${year}`;
}

function randomFinancialYear(): string {
  const year = 2020 + Math.floor(Math.random() * 4);
  return `${year}-${String(year + 1).slice(2)}`;
}

function randomMonth(): string {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const year = 2022 + Math.floor(Math.random() * 3);
  return `${randomFrom(months)} ${year}`;
}

function generateExtractedData(docType: DocumentTypeConfig): ExtractedData {
  const data: ExtractedData = {};
  const name = randomFrom(SAMPLE_NAMES);
  const lender = randomFrom(LENDERS.filter(l => l.category === "major"));

  for (const variable of docType.variables) {
    switch (variable.key) {
      case "name": data.name = name; break;
      case "lender": data.lender = lender.abbreviation; break;
      case "date": data.date = randomDate(); break;
      case "expiryDate": data.expiryDate = randomExpiryDate(); break;
      case "financialYear": data.financialYear = randomFinancialYear(); break;
      case "month": data.month = randomMonth(); break;
      case "abn": data.abn = randomABN(); break;
      case "company": data.company = randomFrom(SAMPLE_EMPLOYERS) + " Pty Ltd"; break;
      case "accountNumber": data.accountNumber = randomAccountNumber(); break;
      case "balance": data.balance = randomAmount(5000, 500000); break;
      case "creditLimit": data.creditLimit = randomAmount(5000, 50000); break;
      case "totalBalance": data.totalBalance = randomAmount(1000, 50000); break;
      case "totalIncome": data.totalIncome = randomAmount(50000, 300000); break;
      case "taxableIncome": data.taxableIncome = randomAmount(40000, 250000); break;
      case "grossPay": data.grossPay = randomAmount(3000, 15000); break;
      case "netPay": data.netPay = randomAmount(2500, 12000); break;
      case "employer": data.employer = randomFrom(SAMPLE_EMPLOYERS); break;
      case "payPeriod": data.payPeriod = randomDate(); break;
      case "propertyAddress": data.propertyAddress = randomFrom(SAMPLE_ADDRESSES); break;
      case "valuationAmount": data.valuationAmount = randomAmount(400000, 2000000); break;
      case "purchasePrice": data.purchasePrice = randomAmount(350000, 1500000); break;
      case "weeklyRent": data.weeklyRent = `$${Math.floor(Math.random() * 800 + 300)}`; break;
      case "documentNumber": data.documentNumber = `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 9000000 + 1000000)}`; break;
      case "taxRefund": data.taxRefund = randomAmount(500, 8000); break;
      case "taxPayable": data.taxPayable = randomAmount(5000, 50000); break;
      case "creditScore": data.creditScore = String(Math.floor(Math.random() * 300 + 500)); break;
      case "loanAmount": data.loanAmount = randomAmount(200000, 1500000); break;
      case "depositAmount": data.depositAmount = randomAmount(20000, 200000); break;
      case "giftAmount": data.giftAmount = randomAmount(10000, 100000); break;
      case "donor": data.donor = randomFrom(SAMPLE_NAMES); break;
      case "state": data.state = randomFrom(["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]); break;
      case "nationality": data.nationality = "Australian"; break;
      case "visaType": data.visaType = randomFrom(["Subclass 482", "Subclass 189", "Subclass 190", "Subclass 820"]); break;
      case "paymentType": data.paymentType = randomFrom(["Family Tax Benefit", "JobSeeker", "Age Pension", "Disability Support"]); break;
      case "amount": data.amount = randomAmount(100, 5000); break;
      case "gstOwed": data.gstOwed = randomAmount(1000, 20000); break;
      case "period": data.period = randomFrom(["Q1 2022-23", "Q2 2022-23", "Q3 2022-23", "Q4 2022-23"]); break;
      case "salary": data.salary = randomAmount(60000, 200000); break;
      case "packagingAmount": data.packagingAmount = randomAmount(5000, 15000); break;
      case "incomeTaxOverdue": data.incomeTaxOverdue = randomAmount(0, 5000); break;
      case "incomeTaxNotYetDue": data.incomeTaxNotYetDue = randomAmount(0, 3000); break;
      case "incomeTaxBalance": data.incomeTaxBalance = randomAmount(0, 8000); break;
      case "activityStatementOverdue": data.activityStatementOverdue = randomAmount(0, 2000); break;
      case "activityStatementNotYetDue": data.activityStatementNotYetDue = randomAmount(0, 1500); break;
      case "activityStatementBalance": data.activityStatementBalance = randomAmount(0, 3500); break;
      case "statementDate": data.statementDate = randomDate(); break;
      default: data[variable.key] = variable.example;
    }
  }
  return data;
}

export function applyTemplate(
  template: string,
  extractedData: ExtractedData,
  separator: string,
  nameFormat: string,
  dateOrder: string,
  dateSeparator: string
): string {
  // Step 1: Apply the separator at SEGMENT BOUNDARIES only.
  // A segment is either a {variable} token or a run of literal text words.
  // The separator goes between segments, NOT within a multi-word literal like
  // "Drivers License" or "Notice of Assessment".
  //
  // Strategy:
  //   1. Split the template into alternating [literal, {var}, literal, {var}, ...] parts.
  //   2. Treat each contiguous literal block as ONE segment (preserve internal spaces).
  //   3. Join all segments with the separator.
  //   4. Trim any leading/trailing separator that results from empty literals.
  let workTemplate = template;
  {
    const parts = workTemplate.split(/(\{[^}]+\})/g); // keeps {var} tokens
    // Merge consecutive literal parts (shouldn't happen but be safe)
    // Each part is either a literal string or a {variable}.
    // We want: separator between each non-empty part.
    const segments = parts.map(p => p.trim()).filter(p => p.length > 0);
    workTemplate = segments.join(separator);
  }

  let result = workTemplate;

  // Step 2: Apply name formatting — normalise order first, then apply user's format preference
  if (extractedData.name) {
    const normalised = normaliseNameOrder(extractedData.name);
    const formatted = formatName(normalised, nameFormat);
    result = result.replace(/\{name\}/g, formatted);
  }

  // Step 3: Apply date formatting
  if (extractedData.date) {
    result = result.replace(/\{date\}/g, formatDate(extractedData.date, dateOrder, dateSeparator));
  }
  if (extractedData.expiryDate) {
    result = result.replace(/\{expiryDate\}/g, formatDate(extractedData.expiryDate, dateOrder, dateSeparator));
  }
  if (extractedData.payPeriod) {
    result = result.replace(/\{payPeriod\}/g, formatDate(extractedData.payPeriod, dateOrder, dateSeparator));
  }
  if (extractedData.statementDate) {
    result = result.replace(/\{statementDate\}/g, formatDate(extractedData.statementDate, dateOrder, dateSeparator));
  }

  // Step 4: Replace all remaining variables
  for (const [key, value] of Object.entries(extractedData)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }

  // Step 5: Remove any unresolved variables and clean up double-separators
  result = result.replace(/\{[^}]+\}/g, "");
  {
    const escapedSep = separator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Collapse multiple consecutive separators into one (from removed variables)
    // e.g. " -  - " → " - " when a variable was empty
    result = result.replace(new RegExp(`(${escapedSep}){2,}`, "g"), separator);
    // Strip leading/trailing separators (do this BEFORE trim so partial separators are caught)
    result = result.replace(new RegExp(`^(${escapedSep})+|(${escapedSep})+$`, "g"), "");
    // Also strip any partial separator remnants at the edges (e.g. trailing " -" or "- ")
    result = result.replace(/^[\s\-_.]+|[\s\-_.]+$/g, "").trim();
  }

  // Step 6: Sanitize filename characters
  result = result.replace(/[/\\:*?"<>|]/g, "").trim();

  return result;
}

/**
 * Normalise a name to "Firstname Surname" order.
 *
 * Handles three common patterns from documents:
 *  1. "Surname, Firstname [Middle]"  — comma signals surname-first
 *  2. "SURNAME Firstname"            — all-caps first token signals surname
 *  3. "Firstname [Middle] Surname"   — already correct, return as-is
 */
export function normaliseNameOrder(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  // Pattern 1: "Surname, Firstname" or "Surname, Firstname Middle"
  if (trimmed.includes(",")) {
    const [surnamePart, givenPart] = trimmed.split(",", 2);
    const surname = surnamePart.trim();
    const given = (givenPart || "").trim();
    if (given) {
      // Normalise each part to title case
      const toTitle = (s: string) =>
        s.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      return `${toTitle(given)} ${toTitle(surname)}`;
    }
    return trimmed; // can't determine order, return unchanged
  }

  // Pattern 2: "SURNAME Firstname" — first token is all-uppercase (2+ chars)
  const tokens = trimmed.split(/\s+/);
  if (tokens.length >= 2) {
    const first = tokens[0];
    // All-caps token of 3+ chars = surname (avoids treating single initials like 'J' as surnames)
    if (first.length >= 3 && first === first.toUpperCase() && /^[A-Z]+$/.test(first)) {
      const surname = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
      const given = tokens
        .slice(1)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
      return `${given} ${surname}`;
    }
  }

  // Pattern 3: already "Firstname [Middle] Surname" — return with title-case normalisation
  return tokens
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatName(name: string, format: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0] || "";
  const last = parts[parts.length - 1] || "";
  const middle = parts.length > 2 ? parts.slice(1, -1).join(" ") : "";

  switch (format) {
    case "last-first":
      return middle ? `${last}, ${first} ${middle}` : `${last}, ${first}`;
    case "first-last":
      return `${first} ${last}`;
    case "last-first-initial":
      return `${last} ${first[0]}`;
    case "initials":
      return parts.map(p => p[0] + ".").join("");
    default: // first-middle-last
      return name;
  }
}

function formatDate(date: string, dateOrder: string, dateSeparator: string): string {
  // Parse input date in DD-MM-YYYY format
  const parts = date.split(/[-/]/);
  if (parts.length < 3) return date;
  const [dd, mm, yyyy] = parts;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthFull = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthIdx = parseInt(mm) - 1;
  const sep = dateSeparator === "none" ? "" : dateSeparator;

  // Special named-month formats ignore the separator
  switch (dateOrder) {
    case "DD-MMM-YYYY": return `${dd} ${monthNames[monthIdx] || mm} ${yyyy}`;
    case "MMMM-YYYY": return `${monthFull[monthIdx] || mm} ${yyyy}`;
    case "MM-DD-YYYY": return `${mm}${sep}${dd}${sep}${yyyy}`;
    case "YYYY-MM-DD": return `${yyyy}${sep}${mm}${sep}${dd}`;
    default: return `${dd}${sep}${mm}${sep}${yyyy}`; // DD-MM-YYYY
  }
}

// Determine document type from filename heuristics (simulated AI)
function guessDocumentType(filename: string): { typeId: string; confidence: number } {
  const lower = filename.toLowerCase().replace(/[^a-z0-9\s]/g, " ");

  const patterns: Array<{ pattern: RegExp; typeId: string; confidence: number }> = [
    { pattern: /payslip|pay\s*slip|salary\s*slip/, typeId: "payslip", confidence: 95 },
    { pattern: /tax\s*return|individual\s*tax/, typeId: "individual-tax-return", confidence: 90 },
    { pattern: /company\s*tax/, typeId: "company-tax-return", confidence: 90 },
    { pattern: /trust\s*tax/, typeId: "trust-tax-return", confidence: 90 },
    { pattern: /partnership\s*tax/, typeId: "partnership-tax-return", confidence: 88 },
    { pattern: /notice\s*of\s*assessment|noa/, typeId: "notice-of-assessment", confidence: 92 },
    { pattern: /driver|licence|license|dl\b/, typeId: "drivers-license", confidence: 88 },
    { pattern: /passport/, typeId: "passport", confidence: 95 },
    { pattern: /medicare/, typeId: "medicare-card", confidence: 92 },
    { pattern: /birth\s*cert/, typeId: "birth-certificate", confidence: 93 },
    { pattern: /marriage\s*cert/, typeId: "marriage-certificate", confidence: 93 },
    { pattern: /bank\s*statement|savings|transaction/, typeId: "savings-statement", confidence: 82 },
    { pattern: /home\s*loan|mortgage\s*statement/, typeId: "home-loan-statement", confidence: 88 },
    { pattern: /credit\s*card/, typeId: "credit-card-statement", confidence: 87 },
    { pattern: /personal\s*loan/, typeId: "personal-loan-statement", confidence: 85 },
    { pattern: /line\s*of\s*credit/, typeId: "line-of-credit-statement", confidence: 85 },
    { pattern: /superannuation|super\s*statement/, typeId: "superannuation-statement", confidence: 88 },
    { pattern: /income\s*statement|payment\s*summary/, typeId: "income-statement", confidence: 87 },
    { pattern: /employment\s*contract/, typeId: "employment-contract", confidence: 90 },
    { pattern: /rental\s*statement|rent\s*statement/, typeId: "rental-statement", confidence: 87 },
    { pattern: /rental\s*appraisal/, typeId: "rental-appraisal", confidence: 88 },
    { pattern: /tenancy/, typeId: "tenancy-agreement", confidence: 87 },
    { pattern: /contract\s*of\s*sale|sale\s*contract/, typeId: "contract-of-sale", confidence: 90 },
    { pattern: /valuation/, typeId: "property-valuation", confidence: 88 },
    { pattern: /rates\s*notice/, typeId: "rates-notice", confidence: 88 },
    { pattern: /electricity|power\s*bill/, typeId: "electricity-bill", confidence: 85 },
    { pattern: /water\s*bill/, typeId: "water-bill", confidence: 85 },
    { pattern: /ato|tax\s*account/, typeId: "ato-tax-account", confidence: 87 },
    { pattern: /bas|business\s*activity/, typeId: "business-activity-statement", confidence: 88 },
    { pattern: /centrelink/, typeId: "centrelink-statement", confidence: 90 },
    { pattern: /hecs|help\s*statement/, typeId: "hecs-help-statement", confidence: 90 },
    { pattern: /gift\s*letter/, typeId: "gift-letter", confidence: 92 },
    { pattern: /deposit\s*receipt/, typeId: "deposit-receipt", confidence: 90 },
    { pattern: /formal\s*approval|unconditional\s*approval/, typeId: "formal-approval-letter", confidence: 88 },
    { pattern: /conditional\s*approval/, typeId: "conditional-approval-letter", confidence: 88 },
    { pattern: /settlement/, typeId: "settlement-letter", confidence: 87 },
    { pattern: /credit\s*report/, typeId: "credit-report", confidence: 90 },
    { pattern: /financial\s*statements?/, typeId: "financial-statements", confidence: 85 },
    { pattern: /trust\s*deed/, typeId: "trust-deed", confidence: 90 },
    { pattern: /visa|immigration/, typeId: "visa-immigration", confidence: 87 },
    { pattern: /citizenship/, typeId: "citizenship-certificate", confidence: 90 },
    { pattern: /open\s*banking/, typeId: "open-banking-account-summary", confidence: 85 },
    { pattern: /afterpay|zip|humm|bnpl|buy\s*now/, typeId: "bnpl-statement", confidence: 83 },
  ];

  for (const { pattern, typeId, confidence } of patterns) {
    if (pattern.test(lower)) {
      // Add some randomness to confidence
      const jitter = Math.floor(Math.random() * 8) - 3;
      return { typeId, confidence: Math.min(100, Math.max(60, confidence + jitter)) };
    }
  }

  // Random fallback for unrecognized files
  const fallbacks = ["payslip", "savings-statement", "individual-tax-return", "home-loan-statement"];
  const typeId = randomFrom(fallbacks);
  return { typeId, confidence: Math.floor(Math.random() * 25 + 55) };
}

/**
 * Match a raw lender string (as returned by the AI) to a configured abbreviation.
 * Tries full-name match, then abbreviation match, then partial substring match.
 * Returns the configured abbreviation if found, or the original string unchanged.
 */
export function resolveLenderAbbreviation(
  rawLender: string,
  lenderNames: Record<string, string>
): string {
  if (!rawLender) return rawLender;
  const lower = rawLender.toLowerCase().trim();

  // 1. Exact full-name match (case-insensitive)
  const exactMatch = LENDERS.find(l => l.fullName.toLowerCase() === lower);
  if (exactMatch) return lenderNames[exactMatch.id] || exactMatch.abbreviation;

  // 2. Exact abbreviation match (case-insensitive)
  const abbrMatch = LENDERS.find(l => l.abbreviation.toLowerCase() === lower);
  if (abbrMatch) return lenderNames[abbrMatch.id] || abbrMatch.abbreviation;

  // 3. Partial substring match — the AI may return a slightly different form
  //    e.g. "ING Banking Limited" should match "ING Australia"
  //    We only use word-boundary matching to avoid false positives like
  //    "Unknown" matching "Now Finance" ("now" inside "unknown").
  const COMMON_WORDS = new Set(["bank", "the", "and", "of", "for", "in", "at", "by", "to", "a", "an"]);
  const partialMatch = LENDERS.find(l => {
    const lowerFull = l.fullName.toLowerCase();
    const lowerAbbr = l.abbreviation.toLowerCase();
    // Full-name substring (directional)
    if (lower.includes(lowerFull) || lowerFull.includes(lower)) return true;
    // First word of abbreviation must be a whole word in the raw string
    const firstWord = lowerAbbr.split(/\s+/)[0];
    if (firstWord.length >= 3 && !COMMON_WORDS.has(firstWord)) {
      // Use word-boundary regex to avoid partial matches
      const wordBoundary = new RegExp(`(^|\\s)${firstWord}(\\s|$|\\b)`);
      if (wordBoundary.test(lower)) return true;
    }
    return false;
  });
  if (partialMatch) return lenderNames[partialMatch.id] || partialMatch.abbreviation;

  // 4. No match — return as-is
  return rawLender;
}

/**
 * Determine which template variables were required but not extracted.
 * Parses {variable} tokens from the template and checks extractedData.
 * Label resolution checks the doc type's own variables first, then falls
 * back to MASTER_TAGS so dynamically-added tags get proper human-readable names.
 */
export function computeMissingFields(
  template: string,
  extractedData: ExtractedData,
  docType: { variables: Array<{ key: string; label: string }> }
): string[] {
  // Find all {variable} tokens in the template
  const tokenMatches = template.match(/\{([^}]+)\}/g) || [];
  const requiredKeys = tokenMatches.map(t => t.slice(1, -1));

  return requiredKeys.filter(key => {
    const value = extractedData[key];
    return !value || value.trim() === "";
  }).map(key => {
    // Check doc type's own variables first, then MASTER_TAGS, then fall back to raw key
    const docVar = docType.variables.find(v => v.key === key);
    if (docVar) return docVar.label;
    const masterVar = MASTER_TAGS.find(v => v.key === key);
    if (masterVar) return masterVar.label;
    return `{${key}}`;
  });
}

export async function processDocument(
  file: File,
  templates: Record<string, string>,
  separator: string,
  nameFormat: string,
  dateOrder: string,
  dateSeparator: string,
  lenderNames: Record<string, string> = {},
  customDocumentTypes: CustomDocumentType[] = []
): Promise<ProcessedDocument> {
  const id = Math.random().toString(36).slice(2);
  // Preserve the original file extension — no conversion is performed,
  // so renaming a JPEG to .pdf would produce a corrupt file.
  const originalExt = file.name.includes(".")
    ? "." + file.name.split(".").pop()!.toLowerCase()
    : "";
  const ext = originalExt;

  // Step 1: Extract text or render image from the document
  const extraction = await extractDocumentContent(file);

  // Step 2: Call Forge API to classify and extract fields
  const customTypeLabels = customDocumentTypes.map(ct => ct.label);
  const forgeResult = await extractWithForge(extraction, file.name, customTypeLabels);

  // Step 3: Find the matching document type config — check built-in types first, then custom types
  const builtInDocType = DOCUMENT_TYPES.find(d => d.id === forgeResult.documentTypeId);
  const customDocType = customDocumentTypes.find(ct => ct.id === forgeResult.documentTypeId);
  const docType = builtInDocType
    ? { id: builtInDocType.id, label: builtInDocType.label, defaultTemplate: builtInDocType.defaultTemplate, variables: builtInDocType.variables }
    : customDocType
      ? { id: customDocType.id, label: customDocType.label, defaultTemplate: customDocType.template, variables: [] as [] }
      : { id: DOCUMENT_TYPES[0].id, label: DOCUMENT_TYPES[0].label, defaultTemplate: DOCUMENT_TYPES[0].defaultTemplate, variables: DOCUMENT_TYPES[0].variables };

  // Step 3b: Resolve lender abbreviation if a lender was extracted
  const resolvedData = { ...forgeResult.extractedData };
  if (resolvedData.lender) {
    resolvedData.lender = resolveLenderAbbreviation(resolvedData.lender, lenderNames);
  }

  // Step 4: Apply naming template — custom types use their own template directly
  const template = customDocType
    ? customDocType.template
    : (templates[forgeResult.documentTypeId] || docType.defaultTemplate);
  const proposedName = applyTemplate(
    template,
    resolvedData,
    separator,
    nameFormat,
    dateOrder,
    dateSeparator
  );

  // Step 5: Compute missing fields
  const missingFields = computeMissingFields(template, resolvedData, docType);

  return {
    id,
    originalName: file.name,
    fileSize: file.size,
    fileType: file.type || "application/octet-stream",
    documentTypeId: forgeResult.documentTypeId,
    documentTypeLabel: forgeResult.documentTypeLabel,
    confidence: forgeResult.confidence,
    extractedData: resolvedData,
    proposedName: proposedName + ext,
    customName: null,
    status: "done",
    missingFields,
    file,
  };
}
