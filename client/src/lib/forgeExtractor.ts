/**
 * Doc Renamer — Document Extractor (via Backend tRPC)
 * Calls the server-side classify procedure which uses the secure BUILT_IN_FORGE_API_KEY.
 * Uses the tRPC vanilla client to ensure correct request format.
 */

import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../../server/routers";
import type { ExtractionResult } from "./documentExtractor";
import type { ExtractedData } from "./aiProcessor";

export interface ForgeExtractionResult {
  documentTypeId: string;
  documentTypeLabel: string;
  confidence: number;
  extractedData: ExtractedData;
}

// Lazy singleton vanilla tRPC client (no React required)
let _client: ReturnType<typeof createTRPCClient<AppRouter>> | null = null;

function getClient() {
  if (!_client) {
    _client = createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
          fetch(input, init) {
            return globalThis.fetch(input, {
              ...(init ?? {}),
              credentials: "include",
            });
          },
        }),
      ],
    });
  }
  return _client;
}

/**
 * Calls the backend /api/trpc/docs.classify procedure.
 * The backend holds the BUILT_IN_FORGE_API_KEY securely.
 * @param customTypeLabels Optional array of user-defined document type labels to include in classification
 */
export async function extractWithForge(
  extraction: ExtractionResult,
  filename: string,
  customTypeLabels?: string[]
): Promise<ForgeExtractionResult> {
  const client = getClient();

  const result = await client.docs.classify.mutate({
    text: extraction.isImageMode ? undefined : extraction.text,
    // Always send the image when available — even for text-mode PDFs.
    // This lets the AI visually detect signatures that are not in the text layer.
    imageBase64: extraction.imageBase64 ?? undefined,
    isImageMode: extraction.isImageMode,
    filename,
    customTypeLabels: customTypeLabels && customTypeLabels.length > 0 ? customTypeLabels : undefined,
  });

  return result as ForgeExtractionResult;
}
