/**
 * Doc Renamer — Word Document Extractor
 * Extracts plain text from .docx and .dotx files using mammoth (browser build).
 * .doc and .dot (legacy binary format) are also handled: mammoth can read
 * many .doc files, but falls back gracefully if the format is unsupported.
 */

import mammoth from "mammoth";

/** File extensions treated as Word documents */
export const WORD_EXTENSIONS = [".doc", ".docx", ".dot", ".dotx"];

/** MIME types for Word documents */
export const WORD_MIME_TYPES = [
  "application/msword",                                                          // .doc / .dot
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",    // .docx
  "application/vnd.openxmlformats-officedocument.wordprocessingml.template",    // .dotx
];

/**
 * Returns true if the file is a Word document based on its extension or MIME type.
 */
export function isWordFile(file: File): boolean {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (WORD_EXTENSIONS.includes(ext)) return true;
  if (WORD_MIME_TYPES.includes(file.type.toLowerCase())) return true;
  return false;
}

/**
 * Extract plain text from a Word document (.doc, .docx, .dot, .dotx).
 * Returns the extracted text, or an empty string if extraction fails.
 */
export async function extractWordText(file: File): Promise<{ text: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value
      .replace(/\s+/g, " ")
      .trim();
    return { text };
  } catch (err) {
    console.warn("[wordExtractor] Failed to extract text from Word file:", file.name, err);
    return { text: "" };
  }
}
