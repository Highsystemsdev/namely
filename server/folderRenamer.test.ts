/**
 * Tests for the folderRenamer utility.
 *
 * We test the pure logic of applyFolderRenames using mock FileSystem handles
 * so no real filesystem is touched.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Minimal mock types ────────────────────────────────────────────────────────

function makeMockWritable(failOnWrite = false, failOnClose = false) {
  return {
    write: vi.fn(async () => { if (failOnWrite) throw new Error("Write failed"); }),
    close: vi.fn(async () => { if (failOnClose) throw new Error("Close failed"); }),
    abort: vi.fn(async () => {}),
  };
}

function makeMockFileHandle(name: string, size: number, writable: ReturnType<typeof makeMockWritable>) {
  return {
    kind: "file" as const,
    name,
    getFile: vi.fn(async () => ({ name, size, arrayBuffer: async () => new ArrayBuffer(size) } as unknown as File)),
    createWritable: vi.fn(async () => writable),
  };
}

function makeMockDirHandle(existingFiles: string[] = []) {
  const files = new Map<string, ReturnType<typeof makeMockFileHandle>>();
  for (const name of existingFiles) {
    const w = makeMockWritable();
    files.set(name, makeMockFileHandle(name, 100, w));
  }

  return {
    kind: "directory" as const,
    getFileHandle: vi.fn(async (name: string, opts?: { create?: boolean }) => {
      if (files.has(name)) return files.get(name)!;
      if (opts?.create) {
        const w = makeMockWritable();
        const h = makeMockFileHandle(name, 100, w);
        files.set(name, h);
        return h;
      }
      throw new DOMException("Not found", "NotFoundError");
    }),
    removeEntry: vi.fn(async () => {}),
    _files: files,
  };
}

function makeFolderFile(name: string, size: number, dir: ReturnType<typeof makeMockDirHandle>) {
  const writable = makeMockWritable();
  const handle = makeMockFileHandle(name, size, writable);
  return {
    file: { name, size, arrayBuffer: async () => new ArrayBuffer(size) } as unknown as File,
    handle: handle as unknown as FileSystemFileHandle,
    parentHandle: dir as unknown as FileSystemDirectoryHandle,
    relativePath: name,
  };
}

function makeDoc(id: string, proposedName: string, customName: string | null = null) {
  return {
    id,
    originalName: "original.pdf",
    fileSize: 100,
    fileType: "application/pdf",
    documentTypeId: "payslip",
    documentTypeLabel: "Payslip",
    confidence: 90,
    extractedData: {},
    proposedName,
    customName,
    status: "done" as const,
    file: {} as File,
  };
}

// ── Import the module under test ──────────────────────────────────────────────
// We need to import after mocks are set up
import { applyFolderRenames } from "../client/src/lib/folderRenamer";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("applyFolderRenames", () => {
  it("skips unapproved items", async () => {
    const dir = makeMockDirHandle();
    const folderFile = makeFolderFile("original.pdf", 100, dir);
    const doc = makeDoc("1", "New Name.pdf");

    const results: Array<{ id: string; status: string }> = [];
    await applyFolderRenames(
      [{ folderFile, doc, approved: false }],
      r => results.push(r)
    );

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("skipped");
    expect(dir.removeEntry).not.toHaveBeenCalled();
  });

  it("skips when target name equals original name", async () => {
    const dir = makeMockDirHandle();
    const folderFile = makeFolderFile("original.pdf", 100, dir);
    const doc = makeDoc("1", "original.pdf");

    const results: Array<{ id: string; status: string }> = [];
    await applyFolderRenames(
      [{ folderFile, doc, approved: true }],
      r => results.push(r)
    );

    expect(results[0].status).toBe("skipped");
    expect(dir.removeEntry).not.toHaveBeenCalled();
  });

  it("reports error when write fails and leaves original intact", async () => {
    const dir = makeMockDirHandle();
    // Make the new file handle's writable fail on write
    const badWritable = makeMockWritable(true); // failOnWrite = true
    dir.getFileHandle = vi.fn(async (name: string, opts?: { create?: boolean }) => {
      if (opts?.create) {
        return makeMockFileHandle(name, 100, badWritable) as unknown as FileSystemFileHandle;
      }
      throw new DOMException("Not found", "NotFoundError");
    }) as typeof dir.getFileHandle;

    const folderFile = makeFolderFile("original.pdf", 100, dir);
    const doc = makeDoc("1", "New Name.pdf");

    const results: Array<{ id: string; status: string; message?: string }> = [];
    await applyFolderRenames(
      [{ folderFile, doc, approved: true }],
      r => results.push(r)
    );

    expect(results[0].status).toBe("error");
    expect(results[0].message).toContain("Write failed");
    // Original should NOT have been deleted
    expect(dir.removeEntry).not.toHaveBeenCalledWith("original.pdf");
  });

  it("continues processing remaining items after one failure", async () => {
    const dir1 = makeMockDirHandle();
    const dir2 = makeMockDirHandle();

    // First item will fail
    const badWritable = makeMockWritable(true);
    dir1.getFileHandle = vi.fn(async (_name: string, opts?: { create?: boolean }) => {
      if (opts?.create) return makeMockFileHandle("New1.pdf", 100, badWritable) as unknown as FileSystemFileHandle;
      throw new DOMException("Not found", "NotFoundError");
    }) as typeof dir1.getFileHandle;

    const folderFile1 = makeFolderFile("original1.pdf", 100, dir1);
    const folderFile2 = makeFolderFile("original2.pdf", 100, dir2);
    const doc1 = makeDoc("1", "New1.pdf");
    const doc2 = makeDoc("2", "New2.pdf");

    const results: Array<{ id: string; status: string }> = [];
    await applyFolderRenames(
      [
        { folderFile: folderFile1, doc: doc1, approved: true },
        { folderFile: folderFile2, doc: doc2, approved: true },
      ],
      r => results.push(r)
    );

    expect(results).toHaveLength(2);
    expect(results[0].status).toBe("error");
    expect(results[1].status).toBe("success");
  });

  it("uses customName over proposedName when set", async () => {
    const dir = makeMockDirHandle();
    const folderFile = makeFolderFile("original.pdf", 100, dir);
    const doc = makeDoc("1", "Proposed Name.pdf", "Custom Name.pdf");

    const results: Array<{ id: string; status: string; finalName?: string }> = [];
    await applyFolderRenames(
      [{ folderFile, doc, approved: true }],
      r => results.push(r)
    );

    expect(results[0].status).toBe("success");
    expect(results[0].finalName).toBe("Custom Name.pdf");
    expect(dir.removeEntry).toHaveBeenCalledWith("original.pdf");
  });

  it("appends numeric suffix when target name already exists", async () => {
    // Pre-populate directory with the target name
    const dir = makeMockDirHandle(["New Name.pdf"]);
    const folderFile = makeFolderFile("original.pdf", 100, dir);
    const doc = makeDoc("1", "New Name.pdf");

    const results: Array<{ id: string; status: string; finalName?: string }> = [];
    await applyFolderRenames(
      [{ folderFile, doc, approved: true }],
      r => results.push(r)
    );

    expect(results[0].status).toBe("success");
    expect(results[0].finalName).toBe("New Name (2).pdf");
  });

  it("calls onProgress callback for each item", async () => {
    const dir = makeMockDirHandle();
    const folderFile = makeFolderFile("original.pdf", 100, dir);
    const doc = makeDoc("1", "New Name.pdf");

    const progressCalls: string[] = [];
    await applyFolderRenames(
      [{ folderFile, doc, approved: true }],
      r => progressCalls.push(r.id)
    );

    expect(progressCalls).toEqual(["1"]);
  });
});
