/*
 * Doc Renamer — Document Types & Templates
 * All ~62 supported document types with their default naming templates and available variables
 */

export interface DocumentVariable {
  key: string;
  label: string;
  description: string;
  example: string;
}

export interface DocumentTypeConfig {
  id: string;
  label: string;
  defaultTemplate: string;
  variables: DocumentVariable[];
}

// Common variables shared across many document types
const nameVar: DocumentVariable = { key: "name", label: "{name}", description: "Person's full name", example: "John Smith" };
const lenderVar: DocumentVariable = { key: "lender", label: "{lender}", description: "Financial institution name", example: "NAB" };
const dateVar: DocumentVariable = { key: "date", label: "{date}", description: "Document date", example: "20-05-2023" };
const accountNumberVar: DocumentVariable = { key: "accountNumber", label: "{accountNumber}", description: "Account number", example: "123456789" };
const balanceVar: DocumentVariable = { key: "balance", label: "{balance}", description: "Account balance", example: "$45,230.00" };
const financialYearVar: DocumentVariable = { key: "financialYear", label: "{financialYear}", description: "Financial year", example: "2022-23" };
const abnVar: DocumentVariable = { key: "abn", label: "{abn}", description: "ABN number", example: "12345678901" };
const companyVar: DocumentVariable = { key: "company", label: "{company}", description: "Company name", example: "Smith Pty Ltd" };
const expiryDateVar: DocumentVariable = { key: "expiryDate", label: "{expiryDate}", description: "Expiry date", example: "20-05-2025" };
const documentNumberVar: DocumentVariable = { key: "documentNumber", label: "{documentNumber}", description: "Document/reference number", example: "ABC123456" };
const totalIncomeVar: DocumentVariable = { key: "totalIncome", label: "{totalIncome}", description: "Total income", example: "$120,000" };
const taxableIncomeVar: DocumentVariable = { key: "taxableIncome", label: "{taxableIncome}", description: "Taxable income", example: "$95,000" };
const propertyAddressVar: DocumentVariable = { key: "propertyAddress", label: "{propertyAddress}", description: "Property address", example: "123 Main St" };
const employerVar: DocumentVariable = { key: "employer", label: "{employer}", description: "Employer name", example: "Acme Corp" };
const payPeriodVar: DocumentVariable = { key: "payPeriod", label: "{payPeriod}", description: "Pay period end date", example: "30-06-2023" };
const grossPayVar: DocumentVariable = { key: "grossPay", label: "{grossPay}", description: "Gross pay amount", example: "$5,000" };
const monthVar: DocumentVariable = { key: "month", label: "{month}", description: "Statement month", example: "June 2023" };
const creditLimitVar: DocumentVariable = { key: "creditLimit", label: "{creditLimit}", description: "Credit limit", example: "$10,000" };
const weeklyRentVar: DocumentVariable = { key: "weeklyRent", label: "{weeklyRent}", description: "Weekly rent amount", example: "$450" };
const valuationAmountVar: DocumentVariable = { key: "valuationAmount", label: "{valuationAmount}", description: "Valuation amount", example: "$750,000" };
const purchasePriceVar: DocumentVariable = { key: "purchasePrice", label: "{purchasePrice}", description: "Purchase price", example: "$650,000" };

export const DOCUMENT_TYPES: DocumentTypeConfig[] = [
  {
    id: "ato-tax-account",
    label: "ATO Tax Account",
    defaultTemplate: "ATO Tax Account {name} {abn} ${totalBalance}",
    variables: [
      nameVar,
      abnVar,
      { key: "statementDate", label: "{statementDate}", description: "Statement date", example: "20-05-2023" },
      { key: "incomeTaxOverdue", label: "{incomeTaxOverdue}", description: "Income tax overdue amount", example: "$1,200" },
      { key: "incomeTaxNotYetDue", label: "{incomeTaxNotYetDue}", description: "Income tax not yet due", example: "$800" },
      { key: "incomeTaxBalance", label: "{incomeTaxBalance}", description: "Income tax balance", example: "$2,000" },
      { key: "activityStatementOverdue", label: "{activityStatementOverdue}", description: "Activity statement overdue", example: "$500" },
      { key: "activityStatementNotYetDue", label: "{activityStatementNotYetDue}", description: "Activity statement not yet due", example: "$300" },
      { key: "activityStatementBalance", label: "{activityStatementBalance}", description: "Activity statement balance", example: "$800" },
      { key: "totalBalance", label: "{totalBalance}", description: "Total balance", example: "$2,800" },
    ],
  },
  {
    id: "birth-certificate",
    label: "Birth Certificate",
    defaultTemplate: "Birth Certificate {name}",
    variables: [nameVar, dateVar, documentNumberVar],
  },
  {
    id: "bnpl-statement",
    label: "BNPL Statement",
    defaultTemplate: "BNPL Statement {name} {lender} {month}",
    variables: [nameVar, lenderVar, monthVar, balanceVar, creditLimitVar],
  },
  {
    id: "business-activity-statement",
    label: "Business Activity Statement",
    defaultTemplate: "BAS {company} {abn} {date}",
    variables: [companyVar, abnVar, dateVar, { key: "gstOwed", label: "{gstOwed}", description: "GST owed", example: "$5,000" }, { key: "period", label: "{period}", description: "BAS period", example: "Q4 2022-23" }],
  },
  {
    id: "centrelink-statement",
    label: "Centrelink Statement",
    defaultTemplate: "Centrelink Statement {name} {date}",
    variables: [nameVar, dateVar, { key: "paymentType", label: "{paymentType}", description: "Payment type", example: "Family Tax Benefit" }, { key: "amount", label: "{amount}", description: "Payment amount", example: "$1,200" }],
  },
  {
    id: "certificate-of-currency",
    label: "Certificate of Currency",
    defaultTemplate: "Certificate of Currency {name} {lender} {expiryDate}",
    variables: [nameVar, lenderVar, expiryDateVar, propertyAddressVar, documentNumberVar],
  },
  {
    id: "child-support-letter",
    label: "Child Support Letter",
    defaultTemplate: "Child Support Letter {name} {date}",
    variables: [nameVar, dateVar, { key: "amount", label: "{amount}", description: "Child support amount", example: "$800/month" }],
  },
  {
    id: "citizenship-certificate",
    label: "Citizenship Certificate",
    defaultTemplate: "Citizenship Certificate {name} {date}",
    variables: [nameVar, dateVar, documentNumberVar],
  },
  {
    id: "company-tax-return",
    label: "Company Tax Return",
    defaultTemplate: "Company Tax Return {company} {abn} {financialYear}",
    variables: [companyVar, abnVar, financialYearVar, totalIncomeVar, taxableIncomeVar],
  },
  {
    id: "conditional-approval-letter",
    label: "Conditional Approval Letter",
    defaultTemplate: "Conditional Approval {name} {lender} {date}",
    variables: [nameVar, lenderVar, dateVar, { key: "loanAmount", label: "{loanAmount}", description: "Loan amount", example: "$500,000" }],
  },
  {
    id: "contract-of-sale",
    label: "Contract of Sale",
    defaultTemplate: "Contract of Sale {name} {propertyAddress} {date}",
    variables: [nameVar, propertyAddressVar, dateVar, purchasePriceVar],
  },
  {
    id: "credit-card-statement",
    label: "Credit Card Statement",
    defaultTemplate: "Credit Card Statement {name} {lender} {month}",
    variables: [nameVar, lenderVar, monthVar, balanceVar, creditLimitVar, accountNumberVar],
  },
  {
    id: "credit-guide",
    label: "Credit Guide",
    defaultTemplate: "Credit Guide {name} {date}",
    variables: [nameVar, dateVar],
  },
  {
    id: "credit-guide-privacy",
    label: "Credit Guide and Privacy Statement",
    defaultTemplate: "Credit Guide and Privacy Statement {name} {date}",
    variables: [nameVar, dateVar],
  },
  {
    id: "credit-proposal-disclosure",
    label: "Credit Proposal Disclosure",
    defaultTemplate: "Credit Proposal Disclosure {name} {date}",
    variables: [nameVar, dateVar, lenderVar],
  },
  {
    id: "credit-report",
    label: "Credit Report",
    defaultTemplate: "Credit Report {name} {date}",
    variables: [nameVar, dateVar, { key: "creditScore", label: "{creditScore}", description: "Credit score", example: "750" }],
  },
  {
    id: "deposit-receipt",
    label: "Deposit Receipt",
    defaultTemplate: "Deposit Receipt {name} {propertyAddress} {date}",
    variables: [nameVar, propertyAddressVar, dateVar, { key: "depositAmount", label: "{depositAmount}", description: "Deposit amount", example: "$50,000" }],
  },
  {
    id: "drivers-license",
    label: "Driver's License",
    defaultTemplate: "Drivers License {name} {expiryDate}",
    variables: [nameVar, expiryDateVar, documentNumberVar, { key: "state", label: "{state}", description: "Issuing state", example: "NSW" }],
  },
  {
    id: "electricity-bill",
    label: "Electricity Bill",
    defaultTemplate: "Electricity Bill {name} {date}",
    variables: [nameVar, dateVar, propertyAddressVar, { key: "amount", label: "{amount}", description: "Bill amount", example: "$250" }],
  },
  {
    id: "employment-contract",
    label: "Employment Contract",
    defaultTemplate: "Employment Contract {name} {employer} {date}",
    variables: [nameVar, employerVar, dateVar, { key: "salary", label: "{salary}", description: "Annual salary", example: "$85,000" }],
  },
  {
    id: "fact-find",
    label: "Fact Find",
    defaultTemplate: "Fact Find {name} {date}",
    variables: [nameVar, dateVar],
  },
  {
    id: "financial-passport",
    label: "Financial Passport",
    defaultTemplate: "Financial Passport {name} {date}",
    variables: [nameVar, dateVar],
  },
  {
    id: "financial-statements",
    label: "Financial Statements",
    defaultTemplate: "Financial Statements {company} {abn} {financialYear}",
    variables: [companyVar, abnVar, financialYearVar, totalIncomeVar],
  },
  {
    id: "first-home-buyer-declaration",
    label: "First Home Buyer Declaration",
    defaultTemplate: "First Home Buyer Declaration {name} {date}",
    variables: [nameVar, dateVar],
  },
  {
    id: "formal-approval-letter",
    label: "Formal Approval Letter",
    defaultTemplate: "Formal Approval {name} {lender} {date}",
    variables: [nameVar, lenderVar, dateVar, { key: "loanAmount", label: "{loanAmount}", description: "Loan amount", example: "$500,000" }],
  },
  {
    id: "gift-letter",
    label: "Gift Letter",
    defaultTemplate: "Gift Letter {name} {date}",
    variables: [nameVar, dateVar, { key: "giftAmount", label: "{giftAmount}", description: "Gift amount", example: "$50,000" }, { key: "donor", label: "{donor}", description: "Donor name", example: "Jane Smith" }],
  },
  {
    id: "hecs-help-statement",
    label: "HECS/HELP Statement",
    defaultTemplate: "HECS HELP Statement {name} {financialYear}",
    variables: [nameVar, financialYearVar, { key: "balance", label: "{balance}", description: "HECS/HELP balance", example: "$25,000" }],
  },
  {
    id: "home-loan-statement",
    label: "Home Loan Statement",
    defaultTemplate: "Home Loan Statement {name} {lender} {month}",
    variables: [nameVar, lenderVar, monthVar, balanceVar, accountNumberVar, propertyAddressVar],
  },
  {
    id: "income-statement",
    label: "Income Statement",
    defaultTemplate: "Income Statement {name} {financialYear}",
    variables: [nameVar, financialYearVar, totalIncomeVar, { key: "employer", label: "{employer}", description: "Employer name", example: "Acme Corp" }],
  },
  {
    id: "individual-tax-return",
    label: "Individual Tax Return",
    defaultTemplate: "Individual Tax Return {name} {financialYear}",
    variables: [nameVar, financialYearVar, totalIncomeVar, taxableIncomeVar, { key: "taxRefund", label: "{taxRefund}", description: "Tax refund amount", example: "$2,500" }],
  },
  {
    id: "line-of-credit-statement",
    label: "Line of Credit Statement",
    defaultTemplate: "Line of Credit Statement {name} {lender} {month}",
    variables: [nameVar, lenderVar, monthVar, balanceVar, creditLimitVar, accountNumberVar],
  },
  {
    id: "marriage-certificate",
    label: "Marriage Certificate",
    defaultTemplate: "Marriage Certificate {name} {date}",
    variables: [nameVar, dateVar, documentNumberVar],
  },
  {
    id: "medicare-card",
    label: "Medicare Card",
    defaultTemplate: "Medicare Card {name} {expiryDate}",
    variables: [nameVar, expiryDateVar, documentNumberVar],
  },
  {
    id: "notice-of-assessment",
    label: "Notice of Assessment",
    defaultTemplate: "Notice of Assessment {name} {financialYear}",
    variables: [nameVar, financialYearVar, taxableIncomeVar, { key: "taxPayable", label: "{taxPayable}", description: "Tax payable", example: "$18,000" }],
  },
  {
    id: "open-banking-account-summary",
    label: "Open Banking Account Summary",
    defaultTemplate: "Open Banking Account Summary {name} {lender} {date}",
    variables: [nameVar, lenderVar, dateVar, balanceVar],
  },
  {
    id: "open-banking-credit-card",
    label: "Open Banking Credit Card",
    defaultTemplate: "Open Banking Credit Card {name} {lender} {date}",
    variables: [nameVar, lenderVar, dateVar, balanceVar, creditLimitVar],
  },
  {
    id: "open-banking-home-loan",
    label: "Open Banking Home Loan",
    defaultTemplate: "Open Banking Home Loan {name} {lender} {date}",
    variables: [nameVar, lenderVar, dateVar, balanceVar],
  },
  {
    id: "open-banking-line-of-credit",
    label: "Open Banking Line of Credit",
    defaultTemplate: "Open Banking Line of Credit {name} {lender} {date}",
    variables: [nameVar, lenderVar, dateVar, balanceVar, creditLimitVar],
  },
  {
    id: "open-banking-personal-loan",
    label: "Open Banking Personal Loan",
    defaultTemplate: "Open Banking Personal Loan {name} {lender} {date}",
    variables: [nameVar, lenderVar, dateVar, balanceVar],
  },
  {
    id: "open-banking-savings",
    label: "Open Banking Savings",
    defaultTemplate: "Open Banking Savings {name} {lender} {date}",
    variables: [nameVar, lenderVar, dateVar, balanceVar, accountNumberVar],
  },
  {
    id: "partnership-tax-return",
    label: "Partnership Tax Return",
    defaultTemplate: "Partnership Tax Return {company} {abn} {financialYear}",
    variables: [companyVar, abnVar, financialYearVar, totalIncomeVar, taxableIncomeVar],
  },
  {
    id: "passport",
    label: "Passport",
    defaultTemplate: "Passport {name} {expiryDate}",
    variables: [nameVar, expiryDateVar, documentNumberVar, { key: "nationality", label: "{nationality}", description: "Nationality", example: "Australian" }],
  },
  {
    id: "payslip",
    label: "Payslip",
    defaultTemplate: "Payslip {name} {employer} {payPeriod}",
    variables: [nameVar, employerVar, payPeriodVar, grossPayVar, { key: "netPay", label: "{netPay}", description: "Net pay amount", example: "$4,200" }],
  },
  {
    id: "personal-loan-statement",
    label: "Personal Loan Statement",
    defaultTemplate: "Personal Loan Statement {name} {lender} {month}",
    variables: [nameVar, lenderVar, monthVar, balanceVar, accountNumberVar],
  },
  {
    id: "pricing-approval",
    label: "Pricing Approval",
    defaultTemplate: "Pricing Approval {name} {lender} {date}",
    variables: [nameVar, lenderVar, dateVar],
  },
  {
    id: "privacy-statement",
    label: "Privacy Statement",
    defaultTemplate: "Privacy Statement {name} {date}",
    variables: [nameVar, dateVar],
  },
  {
    id: "property-valuation",
    label: "Property Valuation",
    defaultTemplate: "Property Valuation {propertyAddress} {valuationAmount} {date}",
    variables: [propertyAddressVar, valuationAmountVar, dateVar, nameVar],
  },
  {
    id: "quickli-servicing",
    label: "Quickli Servicing",
    defaultTemplate: "Quickli Servicing {name} {date}",
    variables: [nameVar, dateVar],
  },
  {
    id: "rates-notice",
    label: "Rates Notice",
    defaultTemplate: "Rates Notice {name} {propertyAddress} {date}",
    variables: [nameVar, propertyAddressVar, dateVar, { key: "amount", label: "{amount}", description: "Rates amount", example: "$1,800" }],
  },
  {
    id: "rental-appraisal",
    label: "Rental Appraisal",
    defaultTemplate: "Rental Appraisal {propertyAddress} {weeklyRent} {date}",
    variables: [propertyAddressVar, weeklyRentVar, dateVar, nameVar],
  },
  {
    id: "rental-statement",
    label: "Rental Statement",
    defaultTemplate: "Rental Statement {name} {propertyAddress} {month}",
    variables: [nameVar, propertyAddressVar, monthVar, weeklyRentVar],
  },
  {
    id: "salary-packaging",
    label: "Salary Packaging",
    defaultTemplate: "Salary Packaging {name} {employer} {financialYear}",
    variables: [nameVar, employerVar, financialYearVar, { key: "packagingAmount", label: "{packagingAmount}", description: "Packaging amount", example: "$9,000" }],
  },
  {
    id: "savings-statement",
    label: "Savings Statement",
    defaultTemplate: "Savings Statement {name} {lender} {month}",
    variables: [nameVar, lenderVar, monthVar, balanceVar, accountNumberVar],
  },
  {
    id: "serviceability-calc",
    label: "Serviceability Calc",
    defaultTemplate: "Serviceability Calc {name} {lender} {date}",
    variables: [nameVar, lenderVar, dateVar],
  },
  {
    id: "settlement-letter",
    label: "Settlement Letter",
    defaultTemplate: "Settlement Letter {name} {lender} {date}",
    variables: [nameVar, lenderVar, dateVar, propertyAddressVar],
  },
  {
    id: "superannuation-statement",
    label: "Superannuation Statement",
    defaultTemplate: "Superannuation Statement {name} {lender} {financialYear}",
    variables: [nameVar, lenderVar, financialYearVar, balanceVar],
  },
  {
    id: "tenancy-agreement",
    label: "Tenancy Agreement",
    defaultTemplate: "Tenancy Agreement {name} {propertyAddress} {date}",
    variables: [nameVar, propertyAddressVar, dateVar, weeklyRentVar],
  },
  {
    id: "transaction-listing",
    label: "Transaction Listing",
    defaultTemplate: "Transaction Listing {name} {lender} {month}",
    variables: [nameVar, lenderVar, monthVar, accountNumberVar],
  },
  {
    id: "trust-deed",
    label: "Trust Deed",
    defaultTemplate: "Trust Deed {company} {date}",
    variables: [companyVar, dateVar, abnVar],
  },
  {
    id: "trust-tax-return",
    label: "Trust Tax Return",
    defaultTemplate: "Trust Tax Return {company} {abn} {financialYear}",
    variables: [companyVar, abnVar, financialYearVar, totalIncomeVar, taxableIncomeVar],
  },
  {
    id: "visa-immigration",
    label: "Visa/Immigration",
    defaultTemplate: "Visa {name} {documentNumber} {expiryDate}",
    variables: [nameVar, documentNumberVar, expiryDateVar, { key: "visaType", label: "{visaType}", description: "Visa type/subclass", example: "Subclass 482" }],
  },
  {
    id: "water-bill",
    label: "Water Bill",
    defaultTemplate: "Water Bill {name} {propertyAddress} {date}",
    variables: [nameVar, propertyAddressVar, dateVar, { key: "amount", label: "{amount}", description: "Bill amount", example: "$180" }],
  },
];

// Lender data
export interface Lender {
  id: string;
  fullName: string;
  abbreviation: string;
  category: string;
}

export const LENDERS: Lender[] = [
  // Major Banks
  { id: "nab", fullName: "National Australia Bank", abbreviation: "NAB", category: "major" },
  { id: "cba", fullName: "Commonwealth Bank of Australia", abbreviation: "CommBank", category: "major" },
  { id: "anz", fullName: "Australia and New Zealand Banking Group", abbreviation: "ANZ", category: "major" },
  { id: "westpac", fullName: "Westpac Banking Corporation", abbreviation: "Westpac", category: "major" },
  { id: "bankwest", fullName: "BankWest", abbreviation: "BankWest", category: "major" },
  { id: "stgeorge", fullName: "St George Bank", abbreviation: "StGeorge", category: "major" },
  { id: "bom", fullName: "Bank of Melbourne", abbreviation: "BOM", category: "major" },
  { id: "banksa", fullName: "BankSA", abbreviation: "BankSA", category: "major" },
  { id: "boq", fullName: "Bank of Queensland", abbreviation: "BOQ", category: "major" },
  { id: "bendigo", fullName: "Bendigo Bank", abbreviation: "Bendigo", category: "major" },
  { id: "suncorp", fullName: "Suncorp Bank", abbreviation: "Suncorp", category: "major" },
  { id: "me", fullName: "ME Bank", abbreviation: "ME", category: "major" },
  { id: "ing", fullName: "ING Australia", abbreviation: "ING", category: "major" },
  { id: "macquarie", fullName: "Macquarie Bank", abbreviation: "Macquarie", category: "major" },
  { id: "amp", fullName: "AMP Bank", abbreviation: "AMP", category: "major" },
  // Regional/Online
  { id: "ubank", fullName: "UBank", abbreviation: "UBank", category: "regional" },
  { id: "86400", fullName: "86 400", abbreviation: "86400", category: "regional" },
  { id: "athena", fullName: "Athena Home Loans", abbreviation: "Athena", category: "regional" },
  { id: "tic-toc", fullName: "Tic:Toc Home Loans", abbreviation: "TicToc", category: "regional" },
  { id: "reduce", fullName: "Reduce Home Loans", abbreviation: "Reduce", category: "regional" },
  { id: "loans-au", fullName: "Loans.com.au", abbreviation: "Loans.com.au", category: "regional" },
  { id: "homestar", fullName: "Homestar Finance", abbreviation: "Homestar", category: "regional" },
  { id: "greater-bank", fullName: "Greater Bank", abbreviation: "Greater Bank", category: "regional" },
  { id: "newcastle-permanent", fullName: "Newcastle Permanent", abbreviation: "Newcastle Perm", category: "regional" },
  { id: "teachers-mutual", fullName: "Teachers Mutual Bank", abbreviation: "Teachers Mutual", category: "regional" },
  { id: "beyond-bank", fullName: "Beyond Bank", abbreviation: "Beyond Bank", category: "regional" },
  { id: "peoples-choice", fullName: "People's Choice Credit Union", abbreviation: "Peoples Choice", category: "regional" },
  { id: "police-bank", fullName: "Police Bank", abbreviation: "Police Bank", category: "regional" },
  { id: "heritage-bank", fullName: "Heritage Bank", abbreviation: "Heritage", category: "regional" },
  { id: "auswide", fullName: "Auswide Bank", abbreviation: "Auswide", category: "regional" },
  { id: "g-h-mutual", fullName: "G&H Mutual Bank", abbreviation: "G&H Mutual", category: "regional" },
  { id: "firstmac", fullName: "Firstmac", abbreviation: "Firstmac", category: "regional" },
  { id: "gateway-bank", fullName: "Gateway Bank", abbreviation: "Gateway", category: "regional" },
  { id: "bank-australia", fullName: "Bank Australia", abbreviation: "Bank Australia", category: "regional" },
  { id: "qbank", fullName: "Qbank", abbreviation: "Qbank", category: "regional" },
  { id: "mcu", fullName: "MCU", abbreviation: "MCU", category: "regional" },
  { id: "move-bank", fullName: "Move Bank", abbreviation: "Move Bank", category: "regional" },
  { id: "easy-street", fullName: "Easy Street Financial Services", abbreviation: "Easy Street", category: "regional" },
  { id: "community-first", fullName: "Community First Credit Union", abbreviation: "Community First", category: "regional" },
  { id: "transport-mutual", fullName: "Transport Mutual Credit Union", abbreviation: "Transport Mutual", category: "regional" },
  // Non-Bank Lenders
  { id: "pepper", fullName: "Pepper Money", abbreviation: "Pepper", category: "nonbank" },
  { id: "liberty", fullName: "Liberty Financial", abbreviation: "Liberty", category: "nonbank" },
  { id: "la-trobe", fullName: "La Trobe Financial", abbreviation: "La Trobe", category: "nonbank" },
  { id: "resimac", fullName: "Resimac", abbreviation: "Resimac", category: "nonbank" },
  { id: "bluestone", fullName: "Bluestone Mortgages", abbreviation: "Bluestone", category: "nonbank" },
  { id: "think-tank", fullName: "Think Tank", abbreviation: "Think Tank", category: "nonbank" },
  { id: "thinktank", fullName: "Thinktank Commercial", abbreviation: "Thinktank", category: "nonbank" },
  { id: "mortgage-house", fullName: "Mortgage House", abbreviation: "Mortgage House", category: "nonbank" },
  { id: "better-mortgage", fullName: "Better Mortgage Management", abbreviation: "BMM", category: "nonbank" },
  { id: "columbus-capital", fullName: "Columbus Capital", abbreviation: "Columbus", category: "nonbank" },
  { id: "granite-home-loans", fullName: "Granite Home Loans", abbreviation: "Granite", category: "nonbank" },
  { id: "homeloans-ltd", fullName: "Homeloans Ltd", abbreviation: "Homeloans", category: "nonbank" },
  { id: "loanave", fullName: "Loanave", abbreviation: "Loanave", category: "nonbank" },
  { id: "metro-finance", fullName: "Metro Finance", abbreviation: "Metro Finance", category: "nonbank" },
  { id: "non-conforming", fullName: "Non Conforming Loans", abbreviation: "NCL", category: "nonbank" },
  { id: "peppermoney", fullName: "Pepper Money (Alt Doc)", abbreviation: "Pepper Alt", category: "nonbank" },
  { id: "prime-capital", fullName: "Prime Capital", abbreviation: "Prime Capital", category: "nonbank" },
  { id: "resi", fullName: "RESI Mortgage Corporation", abbreviation: "RESI", category: "nonbank" },
  { id: "springfield", fullName: "Springfield Finance", abbreviation: "Springfield", category: "nonbank" },
  { id: "state-custodians", fullName: "State Custodians", abbreviation: "State Custodians", category: "nonbank" },
  { id: "widebay", fullName: "Wide Bay Australia", abbreviation: "Wide Bay", category: "nonbank" },
  { id: "wisr", fullName: "Wisr Finance", abbreviation: "Wisr", category: "nonbank" },
  { id: "yellowbrick", fullName: "Yellowbrick Road Finance", abbreviation: "Yellowbrick", category: "nonbank" },
  { id: "zip-money", fullName: "Zip Money", abbreviation: "Zip", category: "nonbank" },
  { id: "acm", fullName: "ACM National Lending", abbreviation: "ACM", category: "nonbank" },
  // Personal Loans
  { id: "plenti", fullName: "Plenti", abbreviation: "Plenti", category: "personal" },
  { id: "harmoney", fullName: "Harmoney", abbreviation: "Harmoney", category: "personal" },
  { id: "moneyplace", fullName: "MoneyPlace", abbreviation: "MoneyPlace", category: "personal" },
  { id: "society-one", fullName: "SocietyOne", abbreviation: "SocietyOne", category: "personal" },
  { id: "symple-loans", fullName: "Symple Loans", abbreviation: "Symple", category: "personal" },
  { id: "latitude", fullName: "Latitude Financial", abbreviation: "Latitude", category: "personal" },
  { id: "now-finance", fullName: "Now Finance", abbreviation: "Now Finance", category: "personal" },
  { id: "money3", fullName: "Money3", abbreviation: "Money3", category: "personal" },
  { id: "nimble", fullName: "Nimble", abbreviation: "Nimble", category: "personal" },
  { id: "cash-converters", fullName: "Cash Converters", abbreviation: "Cash Converters", category: "personal" },
  // Asset Finance
  { id: "angle-finance", fullName: "Angle Finance", abbreviation: "Angle", category: "asset" },
  { id: "capital-finance", fullName: "Capital Finance", abbreviation: "Capital Finance", category: "asset" },
  { id: "de-lage-landen", fullName: "De Lage Landen", abbreviation: "DLL", category: "asset" },
  { id: "finance-one", fullName: "Finance One", abbreviation: "Finance One", category: "asset" },
  { id: "flexi-commercial", fullName: "Flexi Commercial", abbreviation: "Flexi", category: "asset" },
  { id: "get-capital", fullName: "GetCapital", abbreviation: "GetCapital", category: "asset" },
  { id: "grenke", fullName: "Grenke", abbreviation: "Grenke", category: "asset" },
  { id: "judo-bank", fullName: "Judo Bank", abbreviation: "Judo", category: "asset" },
  { id: "metro-asset", fullName: "Metro Asset Finance", abbreviation: "Metro Asset", category: "asset" },
  { id: "moula", fullName: "Moula Money", abbreviation: "Moula", category: "asset" },
  { id: "ondeck", fullName: "OnDeck Australia", abbreviation: "OnDeck", category: "asset" },
  { id: "prospa", fullName: "Prospa", abbreviation: "Prospa", category: "asset" },
  { id: "scotpac", fullName: "ScotPac", abbreviation: "ScotPac", category: "asset" },
  { id: "selfco", fullName: "Selfco Leasing", abbreviation: "Selfco", category: "asset" },
  { id: "shift", fullName: "Shift Financial", abbreviation: "Shift", category: "asset" },
  { id: "silver-chef", fullName: "Silver Chef", abbreviation: "Silver Chef", category: "asset" },
  { id: "thorn", fullName: "Thorn Group", abbreviation: "Thorn", category: "asset" },
  { id: "toyota-finance", fullName: "Toyota Finance Australia", abbreviation: "Toyota Finance", category: "asset" },
  { id: "volkswagen-finance", fullName: "Volkswagen Financial Services", abbreviation: "VW Finance", category: "asset" },
  { id: "westlawn", fullName: "Westlawn Finance", abbreviation: "Westlawn", category: "asset" },
  // Credit Cards
  { id: "amex", fullName: "American Express", abbreviation: "Amex", category: "credit" },
  { id: "citibank", fullName: "Citibank", abbreviation: "Citibank", category: "credit" },
  { id: "diners", fullName: "Diners Club", abbreviation: "Diners", category: "credit" },
  { id: "hsbc", fullName: "HSBC Australia", abbreviation: "HSBC", category: "credit" },
  { id: "bankwest-cc", fullName: "BankWest Credit Card", abbreviation: "BankWest CC", category: "credit" },
  { id: "coles-credit", fullName: "Coles Financial Services", abbreviation: "Coles", category: "credit" },
  { id: "woolworths-credit", fullName: "Woolworths Money", abbreviation: "Woolworths", category: "credit" },
  { id: "28-degrees", fullName: "28 Degrees Card", abbreviation: "28 Degrees", category: "credit" },
  { id: "virgin-money", fullName: "Virgin Money Australia", abbreviation: "Virgin Money", category: "credit" },
  { id: "banksa-cc", fullName: "BankSA Credit Card", abbreviation: "BankSA CC", category: "credit" },
  // BNPL
  { id: "afterpay", fullName: "Afterpay", abbreviation: "Afterpay", category: "bnpl" },
  { id: "zip-pay", fullName: "Zip Pay", abbreviation: "Zip Pay", category: "bnpl" },
  { id: "humm", fullName: "Humm", abbreviation: "Humm", category: "bnpl" },
  { id: "openpay", fullName: "Openpay", abbreviation: "Openpay", category: "bnpl" },
  { id: "laybuy", fullName: "Laybuy", abbreviation: "Laybuy", category: "bnpl" },
  { id: "klarna", fullName: "Klarna", abbreviation: "Klarna", category: "bnpl" },
  { id: "payright", fullName: "Payright", abbreviation: "Payright", category: "bnpl" },
  { id: "splitit", fullName: "Splitit", abbreviation: "Splitit", category: "bnpl" },
  { id: "bundll", fullName: "Bundll", abbreviation: "Bundll", category: "bnpl" },
  { id: "paidy", fullName: "Paidy", abbreviation: "Paidy", category: "bnpl" },
  { id: "sezzle", fullName: "Sezzle", abbreviation: "Sezzle", category: "bnpl" },
  { id: "limepay", fullName: "Limepay", abbreviation: "Limepay", category: "bnpl" },
];

export const LENDER_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "major", label: "Major Banks" },
  { id: "regional", label: "Regional/Online" },
  { id: "nonbank", label: "Non-Bank" },
  { id: "personal", label: "Personal Loans" },
  { id: "asset", label: "Asset Finance" },
  { id: "credit", label: "Credit Cards" },
  { id: "bnpl", label: "BNPL" },
];

export const LENDER_CATEGORY_GROUPS = [
  { id: "major", label: "Home Loans - Major Banks" },
  { id: "regional", label: "Home Loans - Regional/Online" },
  { id: "nonbank", label: "Home Loans - Non-Bank Lenders" },
  { id: "personal", label: "Personal Loans" },
  { id: "asset", label: "Asset/Car Finance" },
  { id: "credit", label: "Credit Cards" },
  { id: "bnpl", label: "Buy Now Pay Later" },
];

// Separator options
export const SEPARATOR_OPTIONS = [
  { value: " - ", label: "Spaced Hyphen ( - )" },
  { value: "-", label: "Hyphen (-)" },
  { value: "_", label: "Underscore (_)" },
  { value: ".", label: "Period (.)" },
  { value: " ", label: "Space ( )" },
];

// Date order options (the arrangement of day/month/year parts)
export const DATE_ORDER_OPTIONS = [
  { value: "DD-MM-YYYY", label: "DD/MM/YYYY (day first)" },
  { value: "MM-DD-YYYY", label: "MM/DD/YYYY (month first)" },
  { value: "YYYY-MM-DD", label: "YYYY/MM/DD (year first)" },
  { value: "DD-MMM-YYYY", label: "DD Mon YYYY (20 May 2023)" },
  { value: "MMMM-YYYY", label: "Month YYYY (May 2023)" },
];

// Date separator options (the character placed between date parts)
export const DATE_SEPARATOR_OPTIONS = [
  { value: "none", label: "None (20052023)" },
  { value: "-", label: "Hyphen (20-05-2023)" },
  { value: "/", label: "Slash (20/05/2023)" },
  { value: ".", label: "Period (20.05.2023)" },
  { value: "_", label: "Underscore (20_05_2023)" },
  { value: " ", label: "Space (20 05 2023)" },
];

// Name format options
export const NAME_FORMAT_OPTIONS = [
  { value: "first-middle-last", label: "First Middle Last (John Michael Smith)" },
  { value: "last-first", label: "Last, First (Smith, John)" },
  { value: "first-last", label: "First Last (John Smith)" },
  { value: "last-first-initial", label: "Last First Initial (Smith J)" },
  { value: "initials", label: "Initials (J.M.S.)" },
];
