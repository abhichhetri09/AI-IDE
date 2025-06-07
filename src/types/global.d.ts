interface FileSystemPermissionDescriptor {
  mode?: "read" | "readwrite";
}

interface FileSystemPermissionResult {
  state: "granted" | "denied" | "prompt";
}

interface FileSystemHandle {
  kind: "file" | "directory";
  name: string;
  resolve(possibleAncestor?: FileSystemHandle): Promise<string[]>;
  requestPermission(
    descriptor?: FileSystemPermissionDescriptor,
  ): Promise<"granted" | "denied" | "prompt">;
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: "directory";
  getDirectoryHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
  resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null>;
  values(): AsyncIterableIterator<FileSystemDirectoryHandle | FileSystemFileHandle>;
  entries(): AsyncIterableIterator<[string, FileSystemDirectoryHandle | FileSystemFileHandle]>;
  keys(): AsyncIterableIterator<string>;
}

interface Window {
  showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
  _workspace_handles: {
    [key: string]: FileSystemDirectoryHandle;
  };
}
