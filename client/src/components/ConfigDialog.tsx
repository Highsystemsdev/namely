/*
 * Doc Renamer — Configuration Dialog
 * Design: Swiss Grid Modernism — clean modal with tabs for Document Templates and Lender Names
 */

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RotateCcw, ChevronDown, ChevronUp, Search, X, Save, CheckCircle2 } from "lucide-react";
import { useConfig } from "@/contexts/ConfigContext";
import {
  DOCUMENT_TYPES,
  LENDERS,
  LENDER_CATEGORIES,
  LENDER_CATEGORY_GROUPS,
  SEPARATOR_OPTIONS,
  DATE_ORDER_OPTIONS,
  DATE_SEPARATOR_OPTIONS,
  NAME_FORMAT_OPTIONS,
} from "@/lib/documentTypes";
import { applyTemplate } from "@/lib/aiProcessor";
import { cn } from "@/lib/utils";

interface ConfigDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ConfigDialog({ open, onClose }: ConfigDialogProps) {
  const { config, updateSeparator, updateDateOrder, updateDateSeparator, updateNameFormat, updateConvertImages, updateRedactTFN, resetAllTemplates, saveAsDefault, isSaving } = useConfig();
  const [savedFeedback, setSavedFeedback] = useState(false);

  async function handleSaveDefault() {
    await saveAsDefault();
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content aria-describedby={undefined} className="fixed top-[50%] left-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full max-w-3xl max-w-[calc(100%-2rem)] bg-background rounded-lg border shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 flex flex-col" style={{height:'90vh'}}>
        <div className="px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogPrimitive.Title className="text-lg font-semibold">Configuration</DialogPrimitive.Title>
            <span className="text-xs text-muted-foreground">Changes apply immediately to all future document uploads</span>
          </div>
        </div>

        <Tabs defaultValue="templates" className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <TabsList className="mx-6 mt-4 mb-0 flex-shrink-0 grid grid-cols-2 h-9">
            <TabsTrigger value="templates">Document Templates</TabsTrigger>
            <TabsTrigger value="lenders">Lender Names</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="flex-1 min-h-0 flex flex-col mt-0 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="px-6 py-4 space-y-5">
                {/* How it works */}
                <div className="bg-muted/50 rounded-md p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground text-xs">How this works:</p>
                  <ul className="space-y-0.5 list-disc list-inside">
                    <li>Use variables like <code className="bg-background px-1 rounded">{"{name}"}</code>, <code className="bg-background px-1 rounded">{"{date}"}</code>, <code className="bg-background px-1 rounded">{"{documentType}"}</code> in your templates</li>
                    <li>Global settings (Separator, Date Format, Name Format) apply to all document types at once</li>
                    <li>You can reset individual document types or all templates to their defaults at any time</li>
                  </ul>
                </div>

                {/* Global settings */}
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Customise how files are named for each document type. Use variables like <code className="bg-muted px-1 rounded">{"{name}"}</code>, <code className="bg-muted px-1 rounded">{"{documentType}"}</code>, etc.</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Separator</Label>
                      <Select value={config.separator} onValueChange={updateSeparator}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SEPARATOR_OPTIONS.map(o => (
                            <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Date Order</Label>
                      <Select value={config.dateOrder} onValueChange={updateDateOrder}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DATE_ORDER_OPTIONS.map((o: {value: string; label: string}) => (
                            <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Date Separator</Label>
                      <Select value={config.dateSeparator} onValueChange={updateDateSeparator}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DATE_SEPARATOR_OPTIONS.map((o: {value: string; label: string}) => (
                            <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Name Format</Label>
                      <Select value={config.nameFormat} onValueChange={updateNameFormat}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NAME_FORMAT_OPTIONS.map(o => (
                            <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch id="convert-images" checked={config.convertImagesToPdf} onCheckedChange={updateConvertImages} />
                      <Label htmlFor="convert-images" className="text-xs cursor-pointer">Convert images to PDF</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="redact-tfn" checked={config.redactTaxFileNumber} onCheckedChange={updateRedactTFN} />
                      <Label htmlFor="redact-tfn" className="text-xs cursor-pointer">Redact tax file number</Label>
                    </div>
                    <Button variant="outline" size="sm" className="ml-auto h-7 text-xs gap-1.5 text-destructive hover:text-destructive" onClick={resetAllTemplates}>
                      <RotateCcw className="h-3 w-3" />
                      Reset All
                    </Button>
                  </div>
                </div>

                {/* Document type templates */}
                <div className="space-y-1">
                  {DOCUMENT_TYPES.map(docType => (
                    <DocumentTemplateRow key={docType.id} docTypeId={docType.id} />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="lenders" className="flex-1 min-h-0 flex flex-col mt-0 overflow-hidden">
            <LenderNamesTab />
          </TabsContent>
        </Tabs>

        <div className="px-6 py-3 border-t border-border flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={handleSaveDefault}
              disabled={isSaving}
            >
              {savedFeedback ? (
                <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />Saved!</>
              ) : (
                <><Save className="h-3.5 w-3.5" />{isSaving ? "Saving..." : "Save as Default"}</>
              )}
            </Button>
            <span className="text-xs text-muted-foreground">Saves your current settings to disk so they load automatically next time</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

function DocumentTemplateRow({ docTypeId }: { docTypeId: string }) {
  const { config, updateTemplate, revertTemplate } = useConfig();
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const docType = DOCUMENT_TYPES.find(d => d.id === docTypeId)!;
  const template = config.templates[docTypeId] || docType.defaultTemplate;
  const isCustomized = template !== docType.defaultTemplate;

  const previewName = applyTemplate(
    template,
    Object.fromEntries(docType.variables.map(v => [v.key, v.example])),
    config.separator,
    config.nameFormat,
    config.dateOrder,
    config.dateSeparator
  );

  function insertVariable(varKey: string) {
    if (!inputRef.current) return;
    const el = inputRef.current;
    const start = el.selectionStart ?? template.length;
    const end = el.selectionEnd ?? template.length;
    const newVal = template.slice(0, start) + `{${varKey}}` + template.slice(end);
    updateTemplate(docTypeId, newVal);
    setTimeout(() => {
      el.focus();
      const pos = start + varKey.length + 2;
      el.setSelectionRange(pos, pos);
    }, 0);
  }

  return (
    <div className={cn("border border-border rounded-md overflow-hidden", isCustomized && "border-primary/40")}>
      <button
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <span className="text-sm font-medium">{docType.label}</span>
        <div className="flex items-center gap-2">
          {isCustomized && <span className="text-xs text-primary font-medium">customised</span>}
          {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border bg-muted/20 space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Naming Template</Label>
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground px-2" onClick={() => revertTemplate(docTypeId)}>
                <RotateCcw className="h-3 w-3 mr-1" />
                Revert to Default
              </Button>
            </div>
            <Input
              ref={inputRef}
              value={template}
              onChange={e => updateTemplate(docTypeId, e.target.value)}
              className="h-8 text-xs font-mono"
              placeholder={docType.defaultTemplate}
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              Click a tag to insert at cursor position
            </p>
            <div className="flex flex-wrap gap-1.5">
              {docType.variables.map(v => (
                <button
                  key={v.key}
                  className="var-chip"
                  title={v.description}
                  onClick={() => insertVariable(v.key)}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Preview</p>
            <div className="bg-slate-900 text-emerald-400 rounded px-3 py-2 text-xs filename-mono truncate">
              {previewName}.pdf
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LenderNamesTab() {
  const { config, updateLenderName, resetLenderName } = useConfig();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const filteredLenders = LENDERS.filter(l => {
    const matchesSearch = !search || l.fullName.toLowerCase().includes(search.toLowerCase()) || l.abbreviation.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "all" || l.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedLenders = LENDER_CATEGORY_GROUPS.map(group => ({
    ...group,
    lenders: filteredLenders.filter(l => l.category === group.id),
  })).filter(g => g.lenders.length > 0);

  const customisedCount = (category: string) =>
    LENDERS.filter(l => (category === "all" || l.category === category) && config.lenderNames[l.id] !== l.abbreviation).length;

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-6 py-4 space-y-4">
          {/* How it works */}
          <div className="bg-muted/50 rounded-md p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground text-xs">How this works:</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>When a document mentions an institution (even with typos or variations), it will be matched to one of these institutions</li>
              <li>The display name you set here will appear in the generated filename</li>
              <li>You can reset individual institutions or all institutions to their defaults</li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">Customise how lender names appear in your filenames. These settings also improve document extraction accuracy.</p>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search institutions..."
              className="h-8 pl-8 text-xs"
            />
            {search && (
              <button className="absolute right-2.5 top-1/2 -translate-y-1/2" onClick={() => setSearch("")}>
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-1.5">
            {LENDER_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">Showing {filteredLenders.length} institutions</p>

          {/* Grouped lenders */}
          <div className="space-y-1">
            {groupedLenders.map(group => {
              const isExpanded = expandedGroup === group.id;
              const customised = group.lenders.filter(l => config.lenderNames[l.id] !== l.abbreviation).length;
              return (
                <div key={group.id} className="border border-border rounded-md overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/40 transition-colors"
                    onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                  >
                    <span className="text-sm font-medium">{group.label} ({group.lenders.length})</span>
                    <div className="flex items-center gap-2">
                      {customised > 0 && <span className="text-xs text-primary font-medium">{customised} customised</span>}
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border divide-y divide-border">
                      {group.lenders.map(lender => {
                        const currentName = config.lenderNames[lender.id] || lender.abbreviation;
                        const isCustomised = currentName !== lender.abbreviation;
                        return (
                          <div key={lender.id} className="flex items-center px-3 py-2 gap-3 bg-muted/10">
                            <span className="text-xs text-muted-foreground flex-1 min-w-0 truncate">{lender.fullName}</span>
                            <div className="flex items-center gap-1.5">
                              <Input
                                value={currentName}
                                onChange={e => updateLenderName(lender.id, e.target.value)}
                                className="h-7 w-32 text-xs"
                              />
                              {isCustomised && (
                                <button
                                  onClick={() => resetLenderName(lender.id)}
                                  className="text-muted-foreground hover:text-foreground transition-colors"
                                  title="Reset to default"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
