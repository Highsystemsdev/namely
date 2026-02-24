/**
 * useFolderPicker — File System Access API hook
 *
 * Provides:
 *  - isFolderPickerSupported: boolean (false on Safari / older browsers)
 *  - pickFolder(): recursively discovers all supported files in a user-selected
 *    directory and returns them as FolderFile objects that include both the
 *    File blob and the FileSystemFileHandle needed for in-place renaming.
 */

export interface FolderFile {
  /** The File blob — can be fed directly into processDocument */
  file: File;
  /** The FileSystemFileHandle for writing the renamed file back to disk */
  handle: FileSystemFileHandle;
  /** The parent FileSystemDirectoryHandle — needed to create the new file and delete the old one */
  parentHandle: FileSystemDirectoryHandle;
  /** Relative path from the root folder, e.g. "subdir/document.pdf" */
  relativePath: string;
}

const ACCEPTED_EXTENSIONS = new Set([".pdf", ".png", ".jpg", ".jpeg", ".heic", ".heif", ".webp"]);
// ZIP files are excluded from folder mode — user is asked to extract them first.

/** True when the browser supports showDirectoryPicker with readwrite mode */
export const isFolderPickerSupported: boolean =
  typeof window !== "undefined" && "showDirectoryPicker" in window;

/**
 * Recursively walk a FileSystemDirectoryHandle and collect all supported files.
 * @param dirHandle  The directory to walk
 * @param pathPrefix Relative path prefix for display (e.g. "subdir/")
 * @param results    Accumulator array
 */
async function walkDirectory(
  dirHandle: FileSystemDirectoryHandle,
  pathPrefix: string,
  results: FolderFile[]
): Promise<void> {
  const iterable = dirHandle as unknown as AsyncIterable<[string, FileSystemHandle]>;
  for await (const [name, entry] of iterable) {
    if (entry.kind === "directory") {
      // Recurse into sub-directories, skip hidden dirs (starting with ".")
      if (!name.startsWith(".")) {
        await walkDirectory(
          entry as FileSystemDirectoryHandle,
          `${pathPrefix}${name}/`,
          results
        );
      }
    } else if (entry.kind === "file") {
      const ext = "." + name.split(".").pop()?.toLowerCase();
      if (ACCEPTED_EXTENSIONS.has(ext)) {
        const fileHandle = entry as FileSystemFileHandle;
        const file = await fileHandle.getFile();
        results.push({
          file,
          handle: fileHandle,
          parentHandle: dirHandle,
          relativePath: `${pathPrefix}${name}`,
        });
      }
    }
  }
}

/**
 * Open a directory picker and return all supported files found recursively.
 * Returns null if the user cancels or if the browser does not support the API.
 */
export async function pickFolder(): Promise<FolderFile[] | null> {
  if (!isFolderPickerSupported) return null;

  let dirHandle: FileSystemDirectoryHandle;
  try {
    dirHandle = await (window as Window & typeof globalThis & {
      showDirectoryPicker: (opts?: { mode?: string }) => Promise<FileSystemDirectoryHandle>;
    }).showDirectoryPicker({ mode: "readwrite" });
  } catch (err) {
    // User cancelled (AbortError) or permission denied
    if (err instanceof Error && err.name === "AbortError") return null;
    throw err;
  }

  const results: FolderFile[] = [];
  await walkDirectory(dirHandle, "", results);
  return results;
}
