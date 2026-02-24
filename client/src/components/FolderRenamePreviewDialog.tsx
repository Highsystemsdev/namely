/**
 * FolderRenamePreviewDialog
 *
 * Shows a full before/after rename preview for all files discovered in the
 * selected folder. The user can toggle individual rows on/off before
 * confirming. Only approved rows are renamed on disk.
 */

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ChevronRight,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  onClose: () => void;
}

export interface ApplyResult {
  id: string;
  status: "success" | "error" | "skipped";
  message?: string;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const isHigh = confidence >= 80;
  const isMedium = confidence >= 60 && confidence < 80;
  return (
    <div className="flex items-center gap-1">
      {isHigh && <CheckCircle2 className="h-3 w-3 text-emerald-600 flex-shrink-0" />}
      {isMedium && <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />}
      {!isHigh && !isMedium && <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />}
      <span className={cn(
        "text-xs font-medium",
        isHigh ? "text-emerald-700" : isMedium ? "text-amber-600" : "text-red-600"
      )}>
        {confidence}%
      </span>
    </div>
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
  onClose,
}: FolderRenamePreviewDialogProps) {
  const approvedCount = items.filter(i => i.approved).length;
  const lowConfidenceCount = items.filter(i => i.doc.confidence < 80).length;

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
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col gap-0 p-0">
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
              Uncheck any rows you want to skip, then click Apply.
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

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {/* Header row */}
          <div className="grid grid-cols-[32px_1fr_1fr_80px_70px_60px] gap-2 px-4 py-2 bg-muted/50 border-b border-border sticky top-0 z-10">
            <div />
            <span className="text-xs font-medium text-muted-foreground">Original Name</span>
            <span className="text-xs font-medium text-muted-foreground">New Name</span>
            <span className="text-xs font-medium text-muted-foreground">Type</span>
            <span className="text-xs font-medium text-muted-foreground">Confidence</span>
            <span className="text-xs font-medium text-muted-foreground">Status</span>
          </div>

          <div className="divide-y divide-border">
            {items.map(item => {
              const result = resultMap.get(item.doc.id);
              const displayName = item.doc.customName || item.doc.proposedName;
              const isLowConf = item.doc.confidence < 80;

              return (
                <div
                  key={item.doc.id}
                  className={cn(
                    "grid grid-cols-[32px_1fr_1fr_80px_70px_60px] gap-2 px-4 py-2.5 items-center",
                    isLowConf && item.approved && !result && "bg-orange-50 border-l-2 border-l-orange-400",
                    !item.approved && "opacity-50 bg-muted/20",
                    result?.status === "success" && "bg-emerald-50",
                    result?.status === "error" && "bg-red-50",
                  )}
                >
                  {/* Checkbox */}
                  <div className="flex items-center justify-center">
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

                  {/* Original name + path */}
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate" title={item.folderFile.relativePath}>
                      {item.folderFile.relativePath}
                    </p>
                  </div>

                  {/* New name */}
                  <div className="min-w-0">
                    <p className={cn(
                      "text-xs filename-mono truncate",
                      isLowConf ? "text-orange-800" : "text-foreground"
                    )} title={displayName}>
                      {displayName}
                    </p>
                  </div>

                  {/* Document type */}
                  <div className="min-w-0">
                    <span className="text-xs text-muted-foreground truncate block">
                      {item.doc.documentTypeLabel}
                    </span>
                  </div>

                  {/* Confidence */}
                  <ConfidenceBadge confidence={item.doc.confidence} />

                  {/* Status */}
                  <div className="flex items-center justify-center">
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
                      Apply {approvedCount} rename{approvedCount !== 1 ? "s" : ""}
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
