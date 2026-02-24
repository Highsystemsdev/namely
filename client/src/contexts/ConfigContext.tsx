/*
 * Doc Renamer — Configuration Context
 * Manages global settings: separator, date format, name format, templates, lender names
 * Supports "Save as Default" which persists config to a server-side JSON file.
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { DOCUMENT_TYPES, LENDERS, type Lender } from "@/lib/documentTypes";
import { trpc } from "@/lib/trpc";

export interface Config {
  separator: string;
  dateOrder: string;
  dateSeparator: string;
  nameFormat: string;
  convertImagesToPdf: boolean;
  redactTaxFileNumber: boolean;
  templates: Record<string, string>;
  lenderNames: Record<string, string>;
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
};

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
        templates: { ...defaultTemplates, ...savedConfig.templates },
        lenderNames: { ...defaultLenderNames, ...savedConfig.lenderNames },
      });
    }
  }, [savedConfig]);

  const saveDefaultMutation = trpc.config.saveDefault.useMutation();

  const saveAsDefault = useCallback(async () => {
    setIsSaving(true);
    try {
      await saveDefaultMutation.mutateAsync(config);
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
