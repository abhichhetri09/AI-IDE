import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getWorkspaceHandle,
  createWorkspaceFile,
  createWorkspaceDirectory,
  deleteWorkspaceEntry,
} from "@/lib/workspace";

interface FilesProps {
  workspaceId: string;
}

interface CreateDialogProps {
  type: "file" | "folder";
  parentPath: string;
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

const CreateDialog = ({ type, parentPath, isOpen, onClose, onCreate }: CreateDialogProps) => {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim());
      setName("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New {type === "file" ? "File" : "Folder"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === "file" ? "filename.txt" : "folder-name"}
              autoFocus
            />
            {parentPath && (
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Will be created in: {parentPath}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function Files({ workspaceId }: FilesProps) {
  const [createDialog, setCreateDialog] = useState<{
    type: "file" | "folder";
    parentPath: string;
    isOpen: boolean;
  }>({
    type: "file",
    parentPath: "",
    isOpen: false,
  });

  const handleNewFile = async (parentPath: string = "") => {
    setCreateDialog({
      type: "file",
      parentPath,
      isOpen: true,
    });
  };

  const handleNewFolder = async (parentPath: string = "") => {
    setCreateDialog({
      type: "folder",
      parentPath,
      isOpen: true,
    });
  };

  const handleCreate = async (name: string) => {
    try {
      const dirHandle = await getWorkspaceHandle(workspaceId);
      if (!dirHandle) {
        throw new Error("Could not access workspace directory");
      }

      const path = createDialog.parentPath ? `${createDialog.parentPath}/${name}` : name;

      if (createDialog.type === "file") {
        await createWorkspaceFile(dirHandle, path);
      } else {
        await createWorkspaceDirectory(dirHandle, path);
      }

      toast.success(`${createDialog.type === "file" ? "File" : "Folder"} created successfully`);
    } catch (err) {
      toast.error(`Failed to create ${createDialog.type}`);
    }
  };

  const handleDelete = async (path: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const dirHandle = await getWorkspaceHandle(workspaceId);
      if (!dirHandle) {
        throw new Error("Could not access workspace directory");
      }

      await deleteWorkspaceEntry(dirHandle, path);
      toast.success("Item deleted successfully");
    } catch (err) {
      toast.error("Failed to delete item");
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-[var(--border-color)]">
        <button
          onClick={() => handleNewFile()}
          className="flex items-center gap-1 px-2 py-1 text-sm hover:bg-[var(--bg-lighter)] rounded"
          title="New File"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>New File</span>
        </button>
        <button
          onClick={() => handleNewFolder()}
          className="flex items-center gap-1 px-2 py-1 text-sm hover:bg-[var(--bg-lighter)] rounded"
          title="New Folder"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>New Folder</span>
        </button>
      </div>

      {/* Create Dialog */}
      <CreateDialog
        type={createDialog.type}
        parentPath={createDialog.parentPath}
        isOpen={createDialog.isOpen}
        onClose={() => setCreateDialog((prev) => ({ ...prev, isOpen: false }))}
        onCreate={handleCreate}
      />
    </div>
  );
}
