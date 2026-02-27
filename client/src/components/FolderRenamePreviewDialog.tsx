/**
 * FolderRenamePreviewDialog
 *
 * Shows a full before/after rename preview for all files discovered in the
 * selected folder. The user can:
 *  - Toggle individual rows on/off before confirming
 *  - Click any "New Name" cell to edit it inline (Enter/blur = confirm, Escape = cancel)
 *  - Change the Document Type via a dropdown — the filename is re-generated automatically
 * Only approved rows are renamed on disk.
 */

import { useMemo, useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ChevronRight,
  Loader2,
  FolderOpen,
  Pencil,
  UserPen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DOCUMENT_TYPES } from "@/lib/documentTypes";
import { useConfig } from "@/contexts/ConfigContext";
import type { ProcessedDocument } from "@/lib/aiProcessor";
import type { FolderFile } from "@/hooks/useFolderPicker";

export interface FolderRenameItem {
  folderFile: FolderFile;
  doc: ProcessedDocument;
  /** Whether this row is approved for renaming (default true) */
  approved: boolean;
}

interface FolderRenamePreviewDialogProps {
  open: boolean;
  items: FolderRenameItem[];
  isApplying: boolean;
  applyResults: ApplyResult[];
  onApprovalChange: (id: string, approved: boolean) => void;
  onApproveAll: () => void;
  onApplyRenames: () => void;
  onNameChange: (id: string, newName: string) => void;
  /** Called when the user selects a different document type for a row */
  onTypeChange: (id: string, newTypeId: string) => void;
  onClose: () => void;
  /** True when files were picked individually (not from a folder) — Apply downloads instead of renames in-place */
  isIndividualMode?: boolean;
}

export interface ApplyResult {
  id: string;
  status: "success" | "error" | "skipped";
  message?: string;
}

function ConfidenceBadge({
  confidence,
  userOverridden,
}: {
  confidence: number;
  userOverridden?: boolean;
}) {
  if (userOverridden) {
    return (
      <div className="flex items-center gap-1 flex-shrink-0" title="Document type changed by user">
        <UserPen className="h-3 w-3 text-primary" />
        <span className="text-xs font-medium text-primary">Edited</span>
      </div>
    );
  }
  const isHigh = confidence >= 80;
  const isMedium = confidence >= 60 && confidence < 80;
  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      {isHigh && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
      {isMedium && <AlertTriangle className="h-3 w-3 text-amber-500" />}
      {!isHigh && !isMedium && <AlertCircle className="h-3 w-3 text-red-500" />}
      <span
        className={cn(
          "text-xs font-medium",
          isHigh ? "text-emerald-700" : isMedium ? "text-amber-600" : "text-red-600"
        )}
      >
        {confidence}%
      </span>
    </div>
  );
}

/** Inline-editable new-name cell */
function EditableNameCell({
  value,
  isLowConf,
  disabled,
  onChange,
}: {
  value: string;
  isLowConf: boolean;
  disabled: boolean;
  onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep draft in sync if parent value changes while not editing
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  function startEdit() {
    if (disabled) return;
    setDraft(value);
    setEditing(true);
  }

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onChange(trimmed);
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (editing) {
    return (
      <div className="flex items-center gap-1 min-w-0">
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
          className="flex-1 min-w-0 h-6 px-1.5 text-xs font-mono border border-primary rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          onMouseDown={e => {
            e.preventDefault();
            commit();
          }}
          className="text-emerald-600 hover:text-emerald-700 flex-shrink-0"
          tabIndex={-1}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
        </button>
        <button
          onMouseDown={e => {
            e.preventDefault();
            cancel();
          }}
          className="text-muted-foreground hover:text-foreground flex-shrink-0"
          tabIndex={-1}
        >
          <AlertCircle className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startEdit}
      disabled={disabled}
      className={cn(
        "group flex items-start gap-1 min-w-0 text-left w-full",
        !disabled && "cursor-pointer hover:opacity-80"
      )}
      title={disabled ? undefined : "Click to edit filename"}
    >
      <span
        className={cn(
          "text-xs font-mono break-all leading-relaxed flex-1 min-w-0",
          isLowConf ? "text-orange-800" : "text-foreground"
        )}
      >
        {value}
      </span>
      {!disabled && (
        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
      )}
    </button>
  );
}

/** Dropdown to change the document type for a single row */
function DocTypeSelect({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (newTypeId: string) => void;
}) {
  const { config } = useConfig();
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        className="h-7 text-xs px-2 py-0 min-w-0 w-full border-muted-foreground/30 focus:ring-1"
        title="Change document type"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-72 text-xs">
        {DOCUMENT_TYPES.map(dt => (
          <SelectItem key={dt.id} value={dt.id} className="text-xs">
            {dt.label}
          </SelectItem>
        ))}
        {config.customDocumentTypes.length > 0 && (
          <>
            <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              Custom Types
            </div>
            {config.customDocumentTypes.map(ct => (
              <SelectItem key={ct.id} value={ct.id} className="text-xs">
                {ct.label}
              </SelectItem>
            ))}
          </>
        )}
      </SelectContent>
    </Select>
  );
}

export function FolderRenamePreviewDialog({
  open,
  items,
  isApplying,
  applyResults,
  onApprovalChange,
  onApproveAll,
  onApplyRenames,
  onNameChange,
  onTypeChange,
  onClose,
  isIndividualMode = false,
}: FolderRenamePreviewDialogProps) {
  const approvedCount = items.filter(i => i.approved).length;
  const lowConfidenceCount = items.filter(i => i.doc.confidence < 80 && !i.doc.userOverriddenType).length;

  const resultMap = useMemo(() => {
    const m = new Map<string, ApplyResult>();
    for (const r of applyResults) m.set(r.id, r);
    return m;
  }, [applyResults]);

  const isDone = applyResults.length > 0 && !isApplying;
  const successCount = applyResults.filter(r => r.status === "success").length;
  const errorCount = applyResults.filter(r => r.status === "error").length;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v && !isApplying) onClose(); }}>
      {/* 80vw wide by default, user-resizable in both axes */}
      <DialogContent
        className="flex flex-col gap-0 p-0 overflow-hidden"
        style={{
          width: "80vw",
          maxWidth: "none",
          height: "80vh",
          maxHeight: "none",
          resize: "both",
          minWidth: "480px",
          minHeight: "320px",
        }}
      >
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            <DialogTitle className="text-base">
              {isDone ? "Rename Complete" : "Review Proposed Renames"}
            </DialogTitle>
          </div>
          {!isDone && (
            <p className="text-xs text-muted-foreground mt-1">
              {items.length} file{items.length !== 1 ? "s" : ""} found.{" "}
              {lowConfidenceCount > 0 && (
                <span className="text-amber-600">
                  {lowConfidenceCount} below 80% confidence — please review carefully.{" "}
                </span>
              )}
              Uncheck rows to skip, click a new name to edit it, or change the document type if the AI got it wrong.
            </p>
          )}
          {isDone && (
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-emerald-600 font-medium">{successCount} renamed</span>
              {errorCount > 0 && (
                <span className="text-destructive font-medium"> · {errorCount} failed</span>
              )}
            </p>
          )}
        </DialogHeader>

        {/* Table — horizontally scrollable so very long names never get cut off */}
        <div className="flex-1 overflow-auto">
          <div className="min-w-[760px]">
            {/* Header row */}
            <div className="grid grid-cols-[32px_minmax(160px,1fr)_minmax(200px,1.4fr)_minmax(140px,180px)_80px_56px] gap-3 px-4 py-2 bg-muted/50 border-b border-border sticky top-0 z-10">
              <div />
              <span className="text-xs font-medium text-muted-foreground">Original Name</span>
              <span className="text-xs font-medium text-muted-foreground">
                New Name{!isDone && <span className="text-muted-foreground/60 font-normal"> (click to edit)</span>}
              </span>
              <span className="text-xs font-medium text-muted-foreground">Type</span>
              <span className="text-xs font-medium text-muted-foreground">Confidence</span>
              <span className="text-xs font-medium text-muted-foreground">Status</span>
            </div>

            <div className="divide-y divide-border">
              {items.map(item => {
                const result = resultMap.get(item.doc.id);
                const displayName = item.doc.customName || item.doc.proposedName;
                const isLowConf = item.doc.confidence < 80 && !item.doc.userOverriddenType;

                return (
                  <div
                    key={item.doc.id}
                    className={cn(
                      "grid grid-cols-[32px_minmax(160px,1fr)_minmax(200px,1.4fr)_minmax(140px,180px)_80px_56px] gap-3 px-4 py-3 items-start",
                      isLowConf && item.approved && !result && "bg-orange-50 border-l-2 border-l-orange-400",
                      !item.approved && "opacity-50 bg-muted/20",
                      result?.status === "success" && "bg-emerald-50",
                      result?.status === "error" && "bg-red-50"
                    )}
                  >
                    {/* Checkbox */}
                    <div className="flex items-center justify-center pt-0.5">
                      {!isDone ? (
                        <Checkbox
                          checked={item.approved}
                          onCheckedChange={v => onApprovalChange(item.doc.id, !!v)}
                          disabled={isApplying}
                          className="h-3.5 w-3.5"
                        />
                      ) : (
                        <div />
                      )}
                    </div>

                    {/* Original path — wraps onto multiple lines if needed */}
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground break-all leading-relaxed">
                        {item.folderFile.relativePath}
                      </p>
                    </div>

                    {/* New name — inline editable */}
                    <div className="min-w-0">
                      <EditableNameCell
                        value={displayName}
                        isLowConf={isLowConf}
                        disabled={isApplying || isDone}
                        onChange={newName => onNameChange(item.doc.id, newName)}
                      />
                      {/* Missing fields badge */}
                      {item.doc.missingFields && item.doc.missingFields.length > 0 && (
                        <span
                          className="inline-flex items-center gap-0.5 mt-1 text-[10px] font-medium text-amber-700 bg-amber-100 border border-amber-300 rounded px-1 py-0.5 cursor-default"
                          title={`Could not extract: ${item.doc.missingFields.join(", ")}`}
                        >
                          <AlertTriangle className="h-2.5 w-2.5 flex-shrink-0" />
                          Missing: {item.doc.missingFields.join(", ")}
                        </span>
                      )}
                    </div>

                    {/* Document type — editable dropdown */}
                    <div className="min-w-0">
                      {isDone ? (
                        <span className="text-xs text-muted-foreground break-words leading-relaxed block">
                          {item.doc.documentTypeLabel}
                        </span>
                      ) : (
                        <DocTypeSelect
                          value={item.doc.documentTypeId}
                          disabled={isApplying}
                          onChange={newTypeId => onTypeChange(item.doc.id, newTypeId)}
                        />
                      )}
                    </div>

                    {/* Confidence / override indicator */}
                    <div className="pt-0.5">
                      <ConfidenceBadge
                        confidence={item.doc.confidence}
                        userOverridden={item.doc.userOverriddenType}
                      />
                    </div>

                    {/* Status */}
                    <div className="flex items-start justify-center pt-0.5">
                      {isApplying && item.approved && !result && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      )}
                      {result?.status === "success" && (
                        <span title="Renamed successfully">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        </span>
                      )}
                      {result?.status === "error" && (
                        <span title={result.message}>
                          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                        </span>
                      )}
                      {result?.status === "skipped" && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-border flex-shrink-0 flex items-center justify-between">
          {!isDone ? (
            <>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={onApproveAll}
                  disabled={isApplying}
                >
                  Select all
                </Button>
                <span className="text-xs text-muted-foreground">
                  {approvedCount} of {items.length} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={onClose}
                  disabled={isApplying}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={onApplyRenames}
                  disabled={isApplying || approvedCount === 0}
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Renaming…
                    </>
                  ) : (
                    <>
                      <ChevronRight className="h-3.5 w-3.5" />
                      {`Rename ${approvedCount} file${approvedCount !== 1 ? "s" : ""}`}
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-end w-full">
              <Button size="sm" className="h-8 text-xs" onClick={onClose}>
                Done
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
