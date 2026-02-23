/*
 * Doc Renamer — Configuration Context
 * Manages global settings: separator, date format, name format, templates, lender names
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { DOCUMENT_TYPES, LENDERS, type Lender } from "@/lib/documentTypes";

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
}

const defaultTemplates = Object.fromEntries(
  DOCUMENT_TYPES.map(d => [d.id, d.defaultTemplate])
);

const defaultLenderNames = Object.fromEntries(
  LENDERS.map(l => [l.id, l.abbreviation])
);

const defaultConfig: Config = {
  separator: " ",
  dateOrder: "DD-MM-YYYY",
  dateSeparator: "-", // 'none' = no separator, '-' = hyphen, etc.
  nameFormat: "first-middle-last",
  convertImagesToPdf: true,
  redactTaxFileNumber: false,
  templates: { ...defaultTemplates },
  lenderNames: { ...defaultLenderNames },
};

const ConfigContext = createContext<ConfigContextType | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Config>(defaultConfig);

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
