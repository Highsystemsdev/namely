/**
 * folderRenamer — robust in-place file rename using File System Access API
 *
 * Strategy (copy-verify-delete):
 *  1. Create a new file with the target name in the same directory.
 *  2. Write all bytes from the original file into the new file.
 *  3. Verify the written size matches the original size.
 *  4. Only after successful verification, remove the original file.
 *
 * If any step fails, the original file is left untouched and an error is
 * returned for that item — other items continue processing.
 *
 * Name collision handling:
 *  - If a file with the target name already exists, a numeric suffix is
 *    appended before the extension (e.g. "Statement - John Smith - 2024-01-01 (2).pdf").
 */

import type { FolderFile } from "@/hooks/useFolderPicker";
import type { ProcessedDocument } from "@/lib/aiProcessor";

export interface RenameResult {
  id: string;
  status: "success" | "error" | "skipped";
  message?: string;
  /** The final filename that was used (may differ if a suffix was added) */
  finalName?: string;
}

/**
 * Derive the target filename for a processed document.
 * Uses customName if set, otherwise proposedName.
 */
function targetName(doc: ProcessedDocument): string {
  return doc.customName || doc.proposedName;
}

/**
 * Check whether a file with the given name already exists in the directory.
 * Returns true if it exists, false otherwise.
 */
async function fileExists(
  dirHandle: FileSystemDirectoryHandle,
  name: string
): Promise<boolean> {
  try {
    await dirHandle.getFileHandle(name, { create: false });
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve a unique filename in the directory.
 * If `name` is already taken, appends " (2)", " (3)", etc. before the extension.
 */
async function resolveUniqueName(
  dirHandle: FileSystemDirectoryHandle,
  name: string,
  originalName: string
): Promise<string> {
  // If the target name is the same as the original, no rename needed
  if (name === originalName) return name;

  if (!(await fileExists(dirHandle, name))) return name;

  // Split into stem + extension
  const dotIdx = name.lastIndexOf(".");
  const stem = dotIdx >= 0 ? name.slice(0, dotIdx) : name;
  const ext = dotIdx >= 0 ? name.slice(dotIdx) : "";

  let counter = 2;
  while (counter <= 999) {
    const candidate = `${stem} (${counter})${ext}`;
    if (!(await fileExists(dirHandle, candidate))) return candidate;
    counter++;
  }

  // Fallback: use timestamp suffix
  return `${stem} (${Date.now()})${ext}`;
}

/**
 * Rename a single file in-place using the copy-verify-delete strategy.
 */
async function renameSingleFile(
  folderFile: FolderFile,
  doc: ProcessedDocument
): Promise<RenameResult> {
  const desired = targetName(doc);
  const originalName = folderFile.file.name;

  // No-op: name is already correct
  if (desired === originalName) {
    return { id: doc.id, status: "skipped", message: "Name unchanged", finalName: originalName };
  }

  // Individual file mode (picked via showOpenFilePicker — no parent directory handle).
  // Use FileSystemFileHandle.move(newName) for in-place rename.
  // This is supported in Chrome/Edge 121+ and Firefox 111+.
  if (folderFile.isIndividualFile || !folderFile.parentHandle) {
    if (!folderFile.handle) {
      return { id: doc.id, status: "error", message: "No file handle available for in-place rename." };
    }
    try {
      // FileSystemFileHandle.move() renames the file atomically in-place.
      const handle = folderFile.handle as FileSystemFileHandle & {
        move?: (name: string) => Promise<void>;
      };
      if (typeof handle.move === "function") {
        await handle.move(desired);
        return { id: doc.id, status: "success", finalName: desired };
      }
      // Fallback: copy-verify-delete using the writable stream on the same handle.
      // This overwrites the file content but cannot change the filename — so we
      // inform the user that the browser doesn't support atomic rename.
      return {
        id: doc.id,
        status: "error",
        message: "Your browser does not support in-place file rename for individually picked files. Please use Pick Folder instead, or try Chrome/Edge.",
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { id: doc.id, status: "error", message };
    }
  }

  const dirHandle = folderFile.parentHandle;

  try {
    // Step 1: Resolve a unique target name
    const finalName = await resolveUniqueName(dirHandle, desired, originalName);

    // Step 2: Read original file bytes
    const originalBytes = await folderFile.file.arrayBuffer();
    const originalSize = originalBytes.byteLength;

    // Step 3: Create the new file handle
    const newHandle = await dirHandle.getFileHandle(finalName, { create: true });

    // Step 4: Write bytes to the new file
    let writable: FileSystemWritableFileStream | null = null;
    try {
      writable = await newHandle.createWritable();
      await writable.write(originalBytes);
      await writable.close();
      writable = null;
    } catch (writeErr) {
      // Clean up the partially-written file
      if (writable) {
        try { await writable.abort(); } catch { /* ignore */ }
      }
      try { await dirHandle.removeEntry(finalName); } catch { /* ignore */ }
      throw writeErr;
    }

    // Step 5: Verify written size
    const writtenFile = await newHandle.getFile();
    if (writtenFile.size !== originalSize) {
      // Size mismatch — delete the new file and abort
      try { await dirHandle.removeEntry(finalName); } catch { /* ignore */ }
      throw new Error(
        `Size mismatch after write: expected ${originalSize} bytes, got ${writtenFile.size} bytes`
      );
    }

    // Step 6: Delete the original file (only after successful verification)
    await dirHandle.removeEntry(originalName);

    return { id: doc.id, status: "success", finalName };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { id: doc.id, status: "error", message };
  }
}

/**
 * Rename all approved items sequentially.
 * Reports progress via the onProgress callback after each file.
 */
export async function applyFolderRenames(
  items: Array<{ folderFile: FolderFile; doc: ProcessedDocument; approved: boolean }>,
  onProgress: (result: RenameResult) => void
): Promise<RenameResult[]> {
  const results: RenameResult[] = [];

  for (const item of items) {
    if (!item.approved) {
      const r: RenameResult = { id: item.doc.id, status: "skipped" };
      results.push(r);
      onProgress(r);
      continue;
    }

    const r = await renameSingleFile(item.folderFile, item.doc);
    results.push(r);
    onProgress(r);
  }

  return results;
}
