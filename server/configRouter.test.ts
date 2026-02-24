/**
 * Tests for the config persistence router (save/load to JSON file)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const DATA_DIR = path.resolve(process.cwd(), "data");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const sampleConfig = {
  separator: " - ",
  dateOrder: "YYYY-MM-DD",
  dateSeparator: "none",
  nameFormat: "first-middle-last",
  convertImagesToPdf: true,
  redactTaxFileNumber: false,
  templates: { "payslip": "{name} {documentType} {date}" },
  lenderNames: { "anz": "ANZ" },
};

describe("config.load and config.saveDefault", () => {
  let originalConfig: string | null = null;

  beforeEach(() => {
    // Back up existing config if present
    if (fs.existsSync(CONFIG_FILE)) {
      originalConfig = fs.readFileSync(CONFIG_FILE, "utf-8");
    } else {
      originalConfig = null;
    }
    // Remove config for clean test state
    if (fs.existsSync(CONFIG_FILE)) fs.unlinkSync(CONFIG_FILE);
  });

  afterEach(() => {
    // Restore original config or remove test file
    if (originalConfig !== null) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(CONFIG_FILE, originalConfig, "utf-8");
    } else if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
    }
  });

  it("load returns null when no config file exists", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.config.load();
    expect(result).toBeNull();
  });

  it("saveDefault writes config to disk and load returns it", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const saveResult = await caller.config.saveDefault(sampleConfig);
    expect(saveResult.success).toBe(true);

    // File should now exist
    expect(fs.existsSync(CONFIG_FILE)).toBe(true);

    // Load should return the saved config
    const loaded = await caller.config.load();
    expect(loaded).not.toBeNull();
    expect(loaded?.separator).toBe(" - ");
    expect(loaded?.dateOrder).toBe("YYYY-MM-DD");
    expect(loaded?.templates["payslip"]).toBe("{name} {documentType} {date}");
    expect(loaded?.lenderNames["anz"]).toBe("ANZ");
  });

  it("load returns null for malformed JSON file", async () => {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, "not valid json", "utf-8");
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.config.load();
    expect(result).toBeNull();
  });

  it("load returns null for JSON that does not match schema", async () => {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ foo: "bar" }), "utf-8");
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.config.load();
    expect(result).toBeNull();
  });

  it("saveDefault overwrites an existing config", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    // Save first config
    await caller.config.saveDefault(sampleConfig);

    // Save updated config
    const updated = { ...sampleConfig, separator: "_", dateOrder: "DD/MM/YYYY" };
    await caller.config.saveDefault(updated);

    const loaded = await caller.config.load();
    expect(loaded?.separator).toBe("_");
    expect(loaded?.dateOrder).toBe("DD/MM/YYYY");
  });
});
