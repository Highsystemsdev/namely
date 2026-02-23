/*
 * Doc Renamer — Main Page
 * Design: Swiss Grid Modernism — structured utility interface
 * Layout: Header + upload zone + document list with inline actions
 */

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Upload,
  Settings2,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  X,
  Edit2,
  ChevronRight,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfigDialog } from "@/components/ConfigDialog";
import { DocumentDetailDialog } from "@/components/DocumentDetailDialog";
import { processDocument, applyTemplate, type ProcessedDocument } from "@/lib/aiProcessor";
import { DOCUMENT_TYPES } from "@/lib/documentTypes";
import { useConfig } from "@/contexts/ConfigContext";

const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/heic", "image/heif", "image/webp", "application/zip"];
const ACCEPTED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".heic", ".heif", ".webp", ".zip"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_ZIP_SIZE = 25 * 1024 * 1024; // 25MB

function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) return "🖼";
  if (fileType === "application/zip") return "📦";
  return "📄";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const isHigh = confidence >= 80;
  const isMedium = confidence >= 60 && confidence < 80;

  return (
    <div className="flex items-center gap-1.5 min-w-[80px]">
      {isHigh && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />}
      {isMedium && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
      {!isHigh && !isMedium && <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />}
      <span className={cn(
        "text-xs font-medium",
        isHigh ? "text-emerald-700" : isMedium ? "text-amber-600" : "text-red-600"
      )}>
        {confidence}%
      </span>
    </div>
  );
}

export default function Home() {
  const { config } = useConfig();
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [configOpen, setConfigOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<ProcessedDocument | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processingCount = documents.filter(d => d.status === "processing").length;
  const doneCount = documents.filter(d => d.status === "done").length;

  async function handleFiles(files: FileList | File[]) {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];

    for (const file of fileArray) {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      const isZip = file.type === "application/zip" || ext === ".zip";
      const maxSize = isZip ? MAX_ZIP_SIZE : MAX_FILE_SIZE;

      if (!ACCEPTED_EXTENSIONS.includes(ext) && !ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`Unsupported file type: ${file.name}`);
        continue;
      }
      if (file.size > maxSize) {
        toast.error(`File too large: ${file.name} (max ${isZip ? "25MB" : "50MB"})`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Add processing placeholders
    const placeholders: ProcessedDocument[] = validFiles.map(f => ({
      id: Math.random().toString(36).slice(2),
      originalName: f.name,
      fileSize: f.size,
      fileType: f.type,
      documentTypeId: "",
      documentTypeLabel: "",
      confidence: 0,
      extractedData: {},
      proposedName: "",
      customName: null,
      status: "processing",
      file: f,
    }));

    setDocuments(prev => [...prev, ...placeholders]);

    // Process each file
    for (let i = 0; i < validFiles.length; i++) {
      const placeholder = placeholders[i];
      try {
        const result = await processDocument(
          validFiles[i],
          config.templates,
          config.separator,
          config.nameFormat,
          config.dateOrder,
          config.dateSeparator
        );
        setDocuments(prev => prev.map(d => d.id === placeholder.id ? result : d));
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error('[DocRenamer] Processing error for', validFiles[i].name, ':', errMsg, err);
        setDocuments(prev => prev.map(d => d.id === placeholder.id ? {
          ...d,
          status: "error",
          errorMessage: errMsg || "Processing failed",
        } : d));
      }
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [config]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  function removeDocument(id: string) {
    setDocuments(prev => prev.filter(d => d.id !== id));
  }

  function removeAll() {
    setDocuments([]);
  }

  function updateDocumentName(id: string, name: string) {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, customName: name } : d));
    if (selectedDoc?.id === id) {
      setSelectedDoc(prev => prev ? { ...prev, customName: name } : null);
    }
  }

  function updateDocumentType(id: string, docTypeId: string) {
    const docType = DOCUMENT_TYPES.find(d => d.id === docTypeId);
    if (!docType) return;
    setDocuments(prev => prev.map(d => {
      if (d.id !== id) return d;
      const template = config.templates[docTypeId] || docType.defaultTemplate;
      const newName = applyTemplate(template, d.extractedData, config.separator, config.nameFormat, config.dateOrder, config.dateSeparator);
      const ext = d.proposedName.includes(".") ? "." + d.proposedName.split(".").pop() : "";
      return {
        ...d,
        documentTypeId: docTypeId,
        documentTypeLabel: docType.label,
        proposedName: newName + ext,
        customName: null,
      };
    }));
    if (selectedDoc?.id === id) {
      const doc = documents.find(d => d.id === id);
      if (doc) {
        const template = config.templates[docTypeId] || docType.defaultTemplate;
        const newName = applyTemplate(template, doc.extractedData, config.separator, config.nameFormat, config.dateOrder, config.dateSeparator);
        const ext = doc.proposedName.includes(".") ? "." + doc.proposedName.split(".").pop() : "";
        setSelectedDoc({ ...doc, documentTypeId: docTypeId, documentTypeLabel: docType.label, proposedName: newName + ext, customName: null });
      }
    }
  }

  // Redact Australian TFN patterns (9 digits, optionally space-separated)
  async function getFileForDownload(doc: ProcessedDocument): Promise<Blob> {
    if (!config.redactTaxFileNumber) return doc.file;
    const TFN_PATTERN = /\b(\d{3}[\s-]?\d{3}[\s-]?\d{3})\b/g;
    try {
      const text = await doc.file.text();
      if (TFN_PATTERN.test(text)) {
        const redacted = text.replace(TFN_PATTERN, "XXX XXX XXX");
        return new Blob([redacted], { type: doc.file.type });
      }
    } catch {
      // Binary file — return as-is
    }
    return doc.file;
  }

  async function downloadAll() {
    const doneDocs = documents.filter(d => d.status === "done");
    if (doneDocs.length === 0) return;

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      for (const doc of doneDocs) {
        const name = doc.customName || doc.proposedName;
        const fileBlob = await getFileForDownload(doc);
        zip.file(name, fileBlob);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = "renamed-documents.zip";
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${doneDocs.length} documents`);
    } catch {
      // Fallback: download individually
      for (const doc of doneDocs) {
        const name = doc.customName || doc.proposedName;
        const url = URL.createObjectURL(doc.file);
        const a = window.document.createElement("a");
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  }

  async function downloadSingle(doc: ProcessedDocument) {
    const name = doc.customName || doc.proposedName;
    const fileBlob = await getFileForDownload(doc);
    const url = URL.createObjectURL(fileBlob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function startInlineEdit(doc: ProcessedDocument) {
    const name = (doc.customName || doc.proposedName).replace(/\.[^.]+$/, "");
    setEditingId(doc.id);
    setEditValue(name);
  }

  function saveInlineEdit(doc: ProcessedDocument) {
    const ext = (doc.customName || doc.proposedName).includes(".")
      ? "." + (doc.customName || doc.proposedName).split(".").pop()
      : "";
    updateDocumentName(doc.id, editValue + ext);
    setEditingId(null);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-primary flex items-center justify-center flex-shrink-0">
              <FileText className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-none">Doc Renamer</h1>
              <p className="text-xs text-muted-foreground mt-0.5">AI-powered document detection and renaming tool</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {documents.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {doneCount} of {documents.length} processed
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-6 space-y-5">
        {/* Info banner */}
        <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-md px-4 py-3">
          <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700 space-y-0.5">
            <p>Your documents are processed locally and are not saved. Refreshing the page will remove uploaded documents.</p>
            <p>Please upload zip files or extract documents from zip files before uploading.</p>
          </div>
        </div>

        {/* Doc Renamer section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Doc Renamer</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setConfigOpen(true)}
              >
                <Settings2 className="h-3.5 w-3.5" />
                Configure
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={downloadAll}
                disabled={doneCount === 0}
              >
                <Download className="h-3.5 w-3.5" />
                Download all documents
              </Button>
              {documents.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive"
                  onClick={removeAll}
                >
                  Remove all
                </Button>
              )}
            </div>
          </div>

          {/* Upload zone */}
          <div
            className={cn("drop-zone cursor-pointer", isDragOver && "drag-over")}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors",
                isDragOver ? "bg-primary/10" : "bg-muted"
              )}>
                <Upload className={cn("h-5 w-5 transition-colors", isDragOver ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                <button
                  className="text-primary hover:underline font-semibold"
                  onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                >
                  + Upload
                </button>
                <span className="text-muted-foreground">Or drop files</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Supports PDF, PNG, JPG, HEIC, HEIF, WEBP, ZIP (Max 50MB per file, 25MB per ZIP)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_EXTENSIONS.join(",")}
              className="hidden"
              onChange={e => e.target.files && handleFiles(e.target.files)}
            />
          </div>

          {/* Document list */}
          {documents.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden bg-white">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_2fr_100px_80px] gap-3 px-4 py-2.5 bg-muted/50 border-b border-border">
                <span className="text-xs font-medium text-muted-foreground">Original File</span>
                <span className="text-xs font-medium text-muted-foreground">Renamed To</span>
                <span className="text-xs font-medium text-muted-foreground">Type</span>
                <span className="text-xs font-medium text-muted-foreground">Confidence</span>
              </div>

              {/* Document rows */}
              <div className="divide-y divide-border">
                {documents.map(doc => (
                  <DocumentRow
                    key={doc.id}
                    doc={doc}
                    isEditing={editingId === doc.id}
                    editValue={editValue}
                    onEditValueChange={setEditValue}
                    onStartEdit={() => startInlineEdit(doc)}
                    onSaveEdit={() => saveInlineEdit(doc)}
                    onCancelEdit={() => setEditingId(null)}
                    onRemove={() => removeDocument(doc.id)}
                    onDownload={() => downloadSingle(doc)}
                    onViewDetails={() => setSelectedDoc(doc)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Dialogs */}
      <ConfigDialog open={configOpen} onClose={() => setConfigOpen(false)} />
      <DocumentDetailDialog
        document={selectedDoc}
        onClose={() => setSelectedDoc(null)}
        onUpdateName={updateDocumentName}
        onUpdateDocType={updateDocumentType}
      />
    </div>
  );
}

interface DocumentRowProps {
  doc: ProcessedDocument;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (v: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onRemove: () => void;
  onDownload: () => void;
  onViewDetails: () => void;
}

function DocumentRow({
  doc,
  isEditing,
  editValue,
  onEditValueChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onRemove,
  onDownload,
  onViewDetails,
}: DocumentRowProps) {
  const displayName = doc.customName || doc.proposedName;

  if (doc.status === "processing") {
    return (
      <div className="grid grid-cols-[1fr_2fr_100px_80px] gap-3 px-4 py-3 items-center">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm">{getFileIcon(doc.fileType)}</span>
          <span className="text-xs text-muted-foreground truncate">{doc.originalName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary flex-shrink-0" />
          <span className="text-xs text-muted-foreground">Analysing with AI...</span>
        </div>
        <div />
        <div />
      </div>
    );
  }

  if (doc.status === "error") {
    return (
      <div className="grid grid-cols-[1fr_2fr_100px_80px] gap-3 px-4 py-3 items-center">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm">⚠️</span>
          <span className="text-xs text-muted-foreground truncate">{doc.originalName}</span>
        </div>
        <span className="text-xs text-destructive">{doc.errorMessage || "Processing failed"}</span>
        <div />
        <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="doc-row group grid grid-cols-[1fr_2fr_100px_80px] gap-3 px-4 py-3 items-center">
      {/* Original name */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm flex-shrink-0">{getFileIcon(doc.fileType)}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs text-muted-foreground truncate cursor-default">{doc.originalName}</span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs max-w-xs">
            {doc.originalName} ({formatBytes(doc.fileSize)})
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Renamed to */}
      <div className="flex items-center gap-1.5 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <input
              value={editValue}
              onChange={e => onEditValueChange(e.target.value)}
              className="flex-1 min-w-0 h-7 px-2 text-xs filename-mono border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              onKeyDown={e => { if (e.key === "Enter") onSaveEdit(); if (e.key === "Escape") onCancelEdit(); }}
              autoFocus
            />
            <button onClick={onSaveEdit} className="text-emerald-600 hover:text-emerald-700 transition-colors flex-shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </button>
            <button onClick={onCancelEdit} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs filename-mono text-foreground truncate cursor-default flex-1 min-w-0">
                  {displayName}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-xs font-mono">
                {displayName}
              </TooltipContent>
            </Tooltip>
            {doc.customName && (
              <span className="text-xs text-amber-500 flex-shrink-0" title="Manually edited">✎</span>
            )}
            {/* Action buttons - visible on hover */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={onStartEdit} className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded">
                    <Edit2 className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Edit filename</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={onViewDetails} className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded">
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">View details</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={onDownload} className="p-1 text-muted-foreground hover:text-primary transition-colors rounded">
                    <Download className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Download file</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={onRemove} className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded">
                    <X className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Remove</TooltipContent>
              </Tooltip>
            </div>
          </>
        )}
      </div>

      {/* Document type */}
      <div className="min-w-0">
        <span className="text-xs text-muted-foreground truncate block">{doc.documentTypeLabel}</span>
      </div>

      {/* Confidence */}
      <ConfidenceBadge confidence={doc.confidence} />
    </div>
  );
}
