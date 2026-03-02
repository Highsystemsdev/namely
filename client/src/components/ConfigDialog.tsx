/*
 * Namely — Configuration Dialog
 * Design: Swiss Grid Modernism — clean modal with tabs for Document Templates and Lender Names
 */

import { useState, useRef } from "react";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RotateCcw, ChevronDown, ChevronUp, Search, X, Save, CheckCircle2, Tag, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useConfig, type CustomDocumentType } from "@/contexts/ConfigContext";
import {
  DOCUMENT_TYPES,
  LENDERS,
  LENDER_CATEGORIES,
  LENDER_CATEGORY_GROUPS,
  SEPARATOR_OPTIONS,
  DATE_ORDER_OPTIONS,
  DATE_SEPARATOR_OPTIONS,
  NAME_FORMAT_OPTIONS,
  MASTER_TAGS,
} from "@/lib/documentTypes";
import { applyTemplate } from "@/lib/aiProcessor";
import { cn } from "@/lib/utils";

interface ConfigDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ConfigDialog({ open, onClose }: ConfigDialogProps) {
  const { config, updateSeparator, updateDateOrder, updateDateSeparator, updateNameFormat, updateConvertImages, updateRedactTFN, resetAllTemplates, saveAsDefault, isSaving, addCustomDocumentType, updateCustomDocumentType, deleteCustomDocumentType } = useConfig();
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
                {/* How it works + tag reference */}
                <div className="bg-muted/50 rounded-md p-3 text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground text-xs">How this works:</p>
                    <TagReferencePopover />
                  </div>
                  <ul className="space-y-0.5 list-disc list-inside">
                    <li>Use variables like <code className="bg-background px-1 rounded">{"{name}"}</code>, <code className="bg-background px-1 rounded">{"{date}"}</code>, <code className="bg-background px-1 rounded">{"{lender}"}</code> in your templates</li>
                    <li>Each document type shows its suggested tags — click <strong>All tags</strong> to see every available tag</li>
                    <li>Global settings (Separator, Date Format, Name Format) apply to all document types at once</li>
                    <li>You can reset individual document types or all templates to their defaults at any time</li>
                  </ul>
                </div>

                {/* Global settings */}
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Customise how files are named for each document type. Click a document type to expand and edit its template.</p>
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

                {/* Document type templates — built-in (sorted alphabetically) + custom types inline */}
                <InlineTemplateList />
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

/** Popover showing all available tags with descriptions — linked from the info box */
function TagReferencePopover() {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = MASTER_TAGS.filter(t =>
    !search ||
    t.key.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  function handleCopy(tag: string) {
    navigator.clipboard.writeText(`{${tag}}`).catch(() => {});
    setCopied(tag);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
          <Tag className="h-3 w-3" />
          View all available tags
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3 space-y-2" align="end">
        <p className="text-xs font-semibold">All Available Tags</p>
        <p className="text-xs text-muted-foreground">Click any tag to copy it, then paste into a template.</p>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tags..."
            className="h-7 pl-6 text-xs"
          />
          {search && (
            <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setSearch("")}>
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
        <ScrollArea className="h-64">
          <div className="space-y-1 pr-2">
            {filtered.map(tag => (
              <button
                key={tag.key}
                onClick={() => handleCopy(tag.key)}
                className="w-full flex items-start gap-2 px-2 py-1.5 rounded hover:bg-muted/60 text-left transition-colors group"
              >
                <code className={cn(
                  "text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0 transition-colors",
                  copied === tag.key
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-muted text-primary group-hover:bg-primary/10"
                )}>
                  {`{${tag.key}}`}
                </code>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground leading-tight">{tag.description}</p>
                  <p className="text-xs text-muted-foreground/60 leading-tight">e.g. {tag.example}</p>
                </div>
                {copied === tag.key && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No tags match your search</p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

/**
 * InlineTemplateList — renders built-in document types + custom types in a single
 * alphabetically-sorted list. A persistent "Add new template" row sits at the bottom.
 */
function InlineTemplateList() {
  const { config, addCustomDocumentType, updateCustomDocumentType, deleteCustomDocumentType } = useConfig();

  // Merge built-in and custom types into one sorted list
  const allItems: Array<{ kind: 'builtin'; id: string; label: string } | { kind: 'custom'; id: string; label: string; template: string }> = [
    ...DOCUMENT_TYPES.map(d => ({ kind: 'builtin' as const, id: d.id, label: d.label })),
    ...config.customDocumentTypes.map(ct => ({ kind: 'custom' as const, id: ct.id, label: ct.label, template: ct.template })),
  ].sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="space-y-1">
      {allItems.map(item =>
        item.kind === 'builtin'
          ? <DocumentTemplateRow key={item.id} docTypeId={item.id} />
          : <CustomTemplateRow
              key={item.id}
              customType={{ id: item.id, label: item.label, template: item.template }}
              onUpdate={updateCustomDocumentType}
              onDelete={deleteCustomDocumentType}
              existingLabels={config.customDocumentTypes.map(ct => ct.label)}
            />
      )}
      {/* Always-visible "Add new template" row at the bottom */}
      <AddCustomTemplateRow
        onAdd={addCustomDocumentType}
        existingLabels={config.customDocumentTypes.map(ct => ct.label)}
      />
    </div>
  );
}

/** A custom template row — same card style as DocumentTemplateRow, with edit/delete */
function CustomTemplateRow({
  customType,
  onUpdate,
  onDelete,
  existingLabels,
}: {
  customType: CustomDocumentType;
  onUpdate: (id: string, label: string, template: string) => void;
  onDelete: (id: string) => void;
  existingLabels: string[];
}) {
  const { config } = useConfig();
  const [expanded, setExpanded] = useState(false);
  const [label, setLabel] = useState(customType.label);
  const [template, setTemplate] = useState(customType.template);
  const [labelError, setLabelError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset local state when the customType prop changes (e.g. after save)
  const prevId = useRef(customType.id);
  if (prevId.current !== customType.id) {
    prevId.current = customType.id;
    setLabel(customType.label);
    setTemplate(customType.template);
  }

  const previewName = applyTemplate(
    template,
    Object.fromEntries(MASTER_TAGS.map(t => [t.key, t.example])),
    config.separator,
    config.nameFormat,
    config.dateOrder,
    config.dateSeparator
  );

  function handleSave() {
    const trimmedLabel = label.trim();
    const trimmedTemplate = template.trim();
    if (!trimmedLabel) { setLabelError("Name is required"); return; }
    const duplicate = existingLabels.find(
      l => l.toLowerCase() === trimmedLabel.toLowerCase() && l !== customType.label
    );
    if (duplicate) { setLabelError("A template with this name already exists"); return; }
    setLabelError("");
    onUpdate(customType.id, trimmedLabel, trimmedTemplate);
  }

  function insertVariable(varKey: string) {
    if (!inputRef.current) return;
    const el = inputRef.current;
    const start = el.selectionStart ?? template.length;
    const end = el.selectionEnd ?? template.length;
    const newVal = template.slice(0, start) + `{${varKey}}` + template.slice(end);
    setTemplate(newVal);
    setTimeout(() => {
      el.focus();
      const pos = start + varKey.length + 2;
      el.setSelectionRange(pos, pos);
    }, 0);
  }

  const isDirty = label !== customType.label || template !== customType.template;

  return (
    <div className="border border-dashed border-primary/50 rounded-md overflow-hidden bg-primary/[0.02]">
      <button
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <span className="text-sm font-medium">{customType.label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-primary/70 font-medium">custom</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border bg-muted/20 space-y-3">
          {/* Name field */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Type Name</Label>
            <Input
              value={label}
              onChange={e => { setLabel(e.target.value); setLabelError(""); }}
              className="h-8 text-xs"
              placeholder="e.g. Fact Find"
            />
            {labelError && <p className="text-xs text-destructive">{labelError}</p>}
          </div>
          {/* Template field */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Naming Template</Label>
            <Input
              ref={inputRef}
              value={template}
              onChange={e => setTemplate(e.target.value)}
              className="h-8 text-xs font-mono"
              placeholder="e.g. Fact Find {lender} {name} {date}"
            />
          </div>
          {/* All tags */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground"><span className="font-medium">Tags</span> — click to insert at cursor</p>
            <div className="flex flex-wrap gap-1.5">
              {MASTER_TAGS.map(v => (
                <button key={v.key} className="var-chip" title={`${v.description} · e.g. ${v.example}`} onClick={() => insertVariable(v.key)}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          {/* Preview */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Preview</p>
            <div className="bg-slate-900 text-emerald-400 rounded px-3 py-2 text-xs filename-mono truncate">
              {previewName}.pdf
            </div>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            {isDirty && (
              <Button size="sm" className="h-7 text-xs" onClick={handleSave}>Save changes</Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 text-destructive hover:text-destructive ml-auto"
              onClick={() => onDelete(customType.id)}
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Persistent "Add new template" row always visible at the bottom of the list */
function AddCustomTemplateRow({
  onAdd,
  existingLabels,
}: {
  onAdd: (label: string, template: string) => void;
  existingLabels: string[];
}) {
  const { config } = useConfig();
  const [expanded, setExpanded] = useState(false);
  const [label, setLabel] = useState("");
  const [template, setTemplate] = useState("");
  const [labelError, setLabelError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const previewName = template
    ? applyTemplate(
        template,
        Object.fromEntries(MASTER_TAGS.map(t => [t.key, t.example])),
        config.separator,
        config.nameFormat,
        config.dateOrder,
        config.dateSeparator
      )
    : "";

  function handleAdd() {
    const trimmedLabel = label.trim();
    const trimmedTemplate = template.trim();
    if (!trimmedLabel) { setLabelError("Name is required"); return; }
    const duplicate = existingLabels.find(l => l.toLowerCase() === trimmedLabel.toLowerCase());
    if (duplicate) { setLabelError("A template with this name already exists"); return; }
    if (!trimmedTemplate) { setLabelError(""); return; }
    setLabelError("");
    onAdd(trimmedLabel, trimmedTemplate);
    setLabel("");
    setTemplate("");
    setExpanded(false);
  }

  function insertVariable(varKey: string) {
    if (!inputRef.current) return;
    const el = inputRef.current;
    const start = el.selectionStart ?? template.length;
    const end = el.selectionEnd ?? template.length;
    const newVal = template.slice(0, start) + `{${varKey}}` + template.slice(end);
    setTemplate(newVal);
    setTimeout(() => {
      el.focus();
      const pos = start + varKey.length + 2;
      el.setSelectionRange(pos, pos);
    }, 0);
  }

  return (
    <div className="border border-dashed border-border rounded-md overflow-hidden mt-2">
      <button
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/40 transition-colors text-muted-foreground hover:text-foreground"
        onClick={() => setExpanded(e => !e)}
      >
        <Plus className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="text-sm">{expanded ? "Cancel new template" : "Add new template"}</span>
        {expanded ? <ChevronUp className="h-3.5 w-3.5 ml-auto" /> : <ChevronDown className="h-3.5 w-3.5 ml-auto" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border bg-muted/20 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Type Name</Label>
            <Input
              value={label}
              onChange={e => { setLabel(e.target.value); setLabelError(""); }}
              className="h-8 text-xs"
              placeholder="e.g. Credit Proposal"
              autoFocus
            />
            {labelError && <p className="text-xs text-destructive">{labelError}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Naming Template</Label>
            <Input
              ref={inputRef}
              value={template}
              onChange={e => setTemplate(e.target.value)}
              className="h-8 text-xs font-mono"
              placeholder="e.g. Credit Proposal {lender} {name} {date}"
            />
          </div>
          {/* All tags */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground"><span className="font-medium">Tags</span> — click to insert at cursor</p>
            <div className="flex flex-wrap gap-1.5">
              {MASTER_TAGS.map(v => (
                <button key={v.key} className="var-chip" title={`${v.description} · e.g. ${v.example}`} onClick={() => insertVariable(v.key)}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          {previewName && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Preview</p>
              <div className="bg-slate-900 text-emerald-400 rounded px-3 py-2 text-xs filename-mono truncate">
                {previewName}.pdf
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleAdd}
              disabled={!label.trim() || !template.trim()}
            >
              <Plus className="h-3 w-3" />
              Add template
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => { setExpanded(false); setLabel(""); setTemplate(""); setLabelError(""); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentTemplateRow({ docTypeId }: { docTypeId: string }) {
  const { config, updateTemplate, revertTemplate } = useConfig();
  const [expanded, setExpanded] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const docType = DOCUMENT_TYPES.find(d => d.id === docTypeId)!;
  const template = config.templates[docTypeId] || docType.defaultTemplate;
  const isCustomized = template !== docType.defaultTemplate;

  // Tags already shown in the suggested section
  const suggestedKeys = new Set(docType.variables.map(v => v.key));
  // Additional tags from MASTER_TAGS not in the suggested list
  const additionalTags = MASTER_TAGS.filter(t => !suggestedKeys.has(t.key));

  const previewName = applyTemplate(
    template,
    Object.fromEntries([
      ...docType.variables.map(v => [v.key, v.example]),
      ...MASTER_TAGS.map(t => [t.key, t.example]),
    ]),
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

          {/* Suggested tags */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Suggested tags</span> — click to insert at cursor
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

          {/* All tags (collapsible) */}
          <div className="space-y-1.5">
            <button
              className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
              onClick={() => setShowAllTags(s => !s)}
            >
              <ChevronRight className={cn("h-3 w-3 transition-transform", showAllTags && "rotate-90")} />
              {showAllTags ? "Hide additional tags" : `All tags (${additionalTags.length} more)`}
            </button>
            {showAllTags && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {additionalTags.map(v => (
                  <button
                    key={v.key}
                    className="var-chip opacity-80 hover:opacity-100"
                    title={`${v.description} · e.g. ${v.example}`}
                    onClick={() => insertVariable(v.key)}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            )}
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
                {customisedCount(cat.id) > 0 && (
                  <span className="ml-1 text-primary">({customisedCount(cat.id)})</span>
                )}
              </button>
            ))}
          </div>

          {/* Lender groups */}
          <div className="space-y-2">
            {groupedLenders.map(group => (
              <div key={group.id} className="border border-border rounded-md overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted/40 transition-colors"
                  onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                >
                  <span className="text-xs font-medium">{group.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{group.lenders.length} institutions</span>
                    {expandedGroup === group.id
                      ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                      : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                </button>
                {expandedGroup === group.id && (
                  <div className="border-t border-border divide-y divide-border">
                    {group.lenders.map(lender => {
                      const currentName = config.lenderNames[lender.id] ?? lender.abbreviation;
                      const isCustomized = currentName !== lender.abbreviation;
                      return (
                        <div key={lender.id} className="flex items-center gap-3 px-3 py-2 bg-muted/10">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{lender.fullName}</p>
                            <p className="text-xs text-muted-foreground">Default: {lender.abbreviation}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Input
                              value={currentName}
                              onChange={e => updateLenderName(lender.id, e.target.value)}
                              className={cn("h-7 w-28 text-xs", isCustomized && "border-primary/60")}
                            />
                            {isCustomized && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() => resetLenderName(lender.id)}
                                title="Reset to default"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            {groupedLenders.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No institutions match your search</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
