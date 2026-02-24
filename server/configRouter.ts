/**
 * Doc Renamer — Configuration Persistence Router
 * Saves and loads the user's configuration to/from a JSON file on the server.
 * The file is stored at data/config.json relative to the project root.
 */

import fs from "fs";
import path from "path";
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";

// Store config in a data directory at the project root
const DATA_DIR = path.resolve(process.cwd(), "data");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");

const ConfigSchema = z.object({
  separator: z.string(),
  dateOrder: z.string(),
  dateSeparator: z.string(),
  nameFormat: z.string(),
  convertImagesToPdf: z.boolean(),
  redactTaxFileNumber: z.boolean(),
  templates: z.record(z.string(), z.string()),
  lenderNames: z.record(z.string(), z.string()),
});

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export const configRouter = router({
  /** Load saved config from disk. Returns null if no saved config exists. */
  load: publicProcedure.query(() => {
    try {
      if (!fs.existsSync(CONFIG_FILE)) return null;
      const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      // Validate shape — if it doesn't match, return null so defaults are used
      const result = ConfigSchema.safeParse(parsed);
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }),

  /** Save current config to disk as the new default. */
  saveDefault: publicProcedure
    .input(ConfigSchema)
    .mutation(({ input }) => {
      try {
        ensureDataDir();
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(input, null, 2), "utf-8");
        return { success: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to save config: ${msg}`);
      }
    }),
});
