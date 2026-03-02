/*
 * Namely — Configuration Context
 * Manages global settings: separator, date format, name format, templates, lender names,
 * and user-defined custom document types.
 * Supports "Save as Default" which persists config to a server-side JSON file.
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { DOCUMENT_TYPES, LENDERS, type Lender } from "@/lib/documentTypes";
import { trpc } from "@/lib/trpc";

/** A user-defined document type (not in the built-in DOCUMENT_TYPES list) */
export interface CustomDocumentType {
  /** Unique ID — generated from the label, e.g. "custom-gift-letter-2" */
  id: string;
  /** Human-readable label shown in dropdowns and the rename preview */
  label: string;
  /** Filename template, e.g. "Gift Letter {lender} {name} {date}" */
  template: string;
}

export interface Config {
  separator: string;
  dateOrder: string;
  dateSeparator: string;
  nameFormat: string;
  convertImagesToPdf: boolean;
  redactTaxFileNumber: boolean;
  templates: Record<string, string>;
  lenderNames: Record<string, string>;
  customDocumentTypes: CustomDocumentType[];
}

interface ConfigContextType {
  config: Config;
  updateSeparator: (v: string) => void;
  updateDateOrder: (v: string) => void;
  updateDateSeparator: (v: string) => void;
  updateNameFormat: (v: string) => void;
  updateConvertImages: (v: boolean) => void;
  updateRedactTFN: (v: boolean) => void;
  updateTemplate: (docTypeId: string, template: string) => void;
  revertTemplate: (docTypeId: string) => void;
  resetAllTemplates: () => void;
  updateLenderName: (lenderId: string, name: string) => void;
  resetLenderName: (lenderId: string) => void;
  getLenderName: (lenderId: string) => string;
  // Custom document types
  addCustomDocumentType: (label: string, template: string) => void;
  updateCustomDocumentType: (id: string, label: string, template: string) => void;
  deleteCustomDocumentType: (id: string) => void;
  saveAsDefault: () => Promise<void>;
  isSaving: boolean;
}

const defaultTemplates = Object.fromEntries(
  DOCUMENT_TYPES.map(d => [d.id, d.defaultTemplate])
);

const defaultLenderNames = Object.fromEntries(
  LENDERS.map(l => [l.id, l.abbreviation])
);

export const defaultConfig: Config = {
  separator: " - ",
  dateOrder: "YYYY-MM-DD",
  dateSeparator: "none",
  nameFormat: "first-middle-last",
  convertImagesToPdf: true,
  redactTaxFileNumber: false,
  templates: { ...defaultTemplates },
  lenderNames: { ...defaultLenderNames },
  customDocumentTypes: [],
};

/** Generate a stable, URL-safe ID from a label */
function labelToId(label: string): string {
  return "custom-" + label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Generate a unique ID, appending a numeric suffix if needed */
function uniqueId(label: string, existing: CustomDocumentType[]): string {
  const base = labelToId(label);
  const existingIds = new Set(existing.map(c => c.id));
  if (!existingIds.has(base)) return base;
  let n = 2;
  while (existingIds.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

const ConfigContext = createContext<ConfigContextType | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Config>(defaultConfig);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved config from server on mount
  const { data: savedConfig } = trpc.config.load.useQuery(undefined, {
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (savedConfig) {
      // Merge saved config with defaults to handle any new fields added since last save
      setConfig({
        ...defaultConfig,
        ...savedConfig,
        templates: { ...defaultTemplates, ...(savedConfig as Config).templates },
        lenderNames: { ...defaultLenderNames, ...(savedConfig as Config).lenderNames },
        customDocumentTypes: (savedConfig as Config).customDocumentTypes ?? [],
      });
    }
  }, [savedConfig]);

  const saveDefaultMutation = trpc.config.saveDefault.useMutation();

  const saveAsDefault = useCallback(async () => {
    setIsSaving(true);
    try {
      await saveDefaultMutation.mutateAsync(config as never);
    } finally {
      setIsSaving(false);
    }
  }, [config, saveDefaultMutation]);

  const updateSeparator = useCallback((v: string) => {
    setConfig(c => ({ ...c, separator: v }));
  }, []);

  const updateDateOrder = useCallback((v: string) => {
    setConfig(c => ({ ...c, dateOrder: v }));
  }, []);

  const updateDateSeparator = useCallback((v: string) => {
    setConfig(c => ({ ...c, dateSeparator: v }));
  }, []);

  const updateNameFormat = useCallback((v: string) => {
    setConfig(c => ({ ...c, nameFormat: v }));
  }, []);

  const updateConvertImages = useCallback((v: boolean) => {
    setConfig(c => ({ ...c, convertImagesToPdf: v }));
  }, []);

  const updateRedactTFN = useCallback((v: boolean) => {
    setConfig(c => ({ ...c, redactTaxFileNumber: v }));
  }, []);

  const updateTemplate = useCallback((docTypeId: string, template: string) => {
    setConfig(c => ({ ...c, templates: { ...c.templates, [docTypeId]: template } }));
  }, []);

  const revertTemplate = useCallback((docTypeId: string) => {
    const docType = DOCUMENT_TYPES.find(d => d.id === docTypeId);
    if (docType) {
      setConfig(c => ({ ...c, templates: { ...c.templates, [docTypeId]: docType.defaultTemplate } }));
    }
  }, []);

  const resetAllTemplates = useCallback(() => {
    setConfig(c => ({ ...c, templates: { ...defaultTemplates } }));
  }, []);

  const updateLenderName = useCallback((lenderId: string, name: string) => {
    setConfig(c => ({ ...c, lenderNames: { ...c.lenderNames, [lenderId]: name } }));
  }, []);

  const resetLenderName = useCallback((lenderId: string) => {
    const lender = LENDERS.find(l => l.id === lenderId);
    if (lender) {
      setConfig(c => ({ ...c, lenderNames: { ...c.lenderNames, [lenderId]: lender.abbreviation } }));
    }
  }, []);

  const getLenderName = useCallback((lenderId: string) => {
    return config.lenderNames[lenderId] || LENDERS.find(l => l.id === lenderId)?.abbreviation || lenderId;
  }, [config.lenderNames]);

  const addCustomDocumentType = useCallback((label: string, template: string) => {
    setConfig(c => {
      const id = uniqueId(label, c.customDocumentTypes);
      return {
        ...c,
        customDocumentTypes: [...c.customDocumentTypes, { id, label, template }],
      };
    });
  }, []);

  const updateCustomDocumentType = useCallback((id: string, label: string, template: string) => {
    setConfig(c => ({
      ...c,
      customDocumentTypes: c.customDocumentTypes.map(ct =>
        ct.id === id ? { ...ct, label, template } : ct
      ),
    }));
  }, []);

  const deleteCustomDocumentType = useCallback((id: string) => {
    setConfig(c => ({
      ...c,
      customDocumentTypes: c.customDocumentTypes.filter(ct => ct.id !== id),
    }));
  }, []);

  return (
    <ConfigContext.Provider value={{
      config,
      updateSeparator,
      updateDateOrder,
      updateDateSeparator,
      updateNameFormat,
      updateConvertImages,
      updateRedactTFN,
      updateTemplate,
      revertTemplate,
      resetAllTemplates,
      updateLenderName,
      resetLenderName,
      getLenderName,
      addCustomDocumentType,
      updateCustomDocumentType,
      deleteCustomDocumentType,
      saveAsDefault,
      isSaving,
    }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be used within ConfigProvider");
  return ctx;
}
