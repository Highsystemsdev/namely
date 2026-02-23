/*
 * Doc Renamer — Document Detail Dialog
 * Shows proposed filename, extracted data breakdown, confidence score, and manual edit
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, AlertTriangle, FileText, Edit2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DOCUMENT_TYPES } from "@/lib/documentTypes";
import { applyTemplate, type ProcessedDocument } from "@/lib/aiProcessor";
import { useConfig } from "@/contexts/ConfigContext";

interface DocumentDetailDialogProps {
  document: ProcessedDocument | null;
  onClose: () => void;
  onUpdateName: (id: string, name: string) => void;
  onUpdateDocType: (id: string, docTypeId: string) => void;
}

function ConfidenceIndicator({ confidence }: { confidence: number }) {
  const isHigh = confidence >= 80;
  const isMedium = confidence >= 60 && confidence < 80;
  const isLow = confidence < 60;

  return (
    <div className={cn("flex items-center gap-2", isHigh ? "confidence-high" : isMedium ? "confidence-medium" : "confidence-low")}>
      {isHigh && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
      {isMedium && <AlertTriangle className="h-4 w-4 text-amber-500" />}
      {isLow && <AlertCircle className="h-4 w-4 text-red-500" />}
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">
            {isHigh ? "High confidence" : isMedium ? "Medium confidence" : "Low confidence"}
          </span>
          <span className="text-xs font-semibold">{confidence}%</span>
        </div>
        <div className="confidence-bar">
          <div
            className="confidence-bar-fill"
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function DocumentDetailDialog({ document, onClose, onUpdateName, onUpdateDocType }: DocumentDetailDialogProps) {
  const { config } = useConfig();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  if (!document) return null;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const doc = document!;
  const displayName = doc.customName || doc.proposedName;
  const docType = DOCUMENT_TYPES.find(d => d.id === doc.documentTypeId);

  function startEdit() {
    setNameInput(displayName.replace(/\.[^.]+$/, ""));
    setEditingName(true);
  }

  function saveEdit() {
    const ext = displayName.includes(".") ? "." + displayName.split(".").pop() : "";
    onUpdateName(doc.id, nameInput + ext);
    setEditingName(false);
  }

  function cancelEdit() {
    setEditingName(false);
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <Dialog open={!!document} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Document Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Original filename */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Original filename</Label>
            <p className="text-xs filename-mono bg-muted/50 rounded px-2 py-1.5 truncate">{doc.originalName}</p>
          </div>

          {/* Document type selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Document Type</Label>
            <Select
              value={doc.documentTypeId}
              onValueChange={v => onUpdateDocType(doc.id, v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map(dt => (
                  <SelectItem key={dt.id} value={dt.id} className="text-xs">{dt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Confidence */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Classification Confidence</Label>
            <ConfidenceIndicator confidence={doc.confidence} />
          </div>

          {/* Proposed filename */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Proposed Filename</Label>
              {!editingName && (
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2 gap-1" onClick={startEdit}>
                  <Edit2 className="h-3 w-3" />
                  Edit
                </Button>
              )}
            </div>
            {editingName ? (
              <div className="flex gap-1.5">
                <Input
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="h-8 text-xs font-mono flex-1"
                  onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                  autoFocus
                />
                <Button size="sm" className="h-8 w-8 p-0" onClick={saveEdit}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={cancelEdit}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="bg-slate-900 text-emerald-400 rounded px-3 py-2 text-xs filename-mono break-all">
                {displayName}
              </div>
            )}
            {doc.customName && (
              <p className="text-xs text-amber-600">
                ✎ Manually edited
              </p>
            )}
          </div>

          {/* Extracted data */}
          {Object.keys(doc.extractedData).length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Extracted Data</Label>
              <div className="border border-border rounded-md divide-y divide-border">
                {Object.entries(doc.extractedData).map(([key, value]) => {
                  const variable = docType?.variables.find(v => v.key === key);
                  return (
                    <div key={key} className="flex items-center px-3 py-1.5 gap-3">
                      <span className="text-xs text-muted-foreground w-32 flex-shrink-0">{variable?.description || key}</span>
                      <span className="text-xs filename-mono text-foreground truncate">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* File info */}
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span>{formatBytes(doc.fileSize)}</span>
            <span>•</span>
            <span>{doc.fileType || "Unknown type"}</span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
