export interface AttachedFile {
  name: string;
  mimeType: string;
  kind: "text" | "image" | "document";
  content: string; // text content, data:... URL for images/documents
  size: number;
}

const TEXT_EXTS = new Set([
  "ts","tsx","js","jsx","mjs","cjs","py","go","rs","java","c","cpp","cs","rb","php",
  "html","css","scss","md","txt","json","yaml","yml","xml","sql","sh","env","toml","ini","prisma",
]);
const IMAGE_EXTS = new Set(["jpg","jpeg","png","gif","webp","svg"]);
const DOC_EXTS   = new Set(["pdf","docx","doc"]);

export const ACCEPTED_FILE_TYPES = [
  ...Array.from(TEXT_EXTS).map((e) => `.${e}`),
  ...Array.from(IMAGE_EXTS).map((e) => `.${e}`),
  ...Array.from(DOC_EXTS).map((e) => `.${e}`),
].join(",");

export function getFileKind(filename: string): "text" | "image" | "document" | null {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (TEXT_EXTS.has(ext)) return "text";
  if (IMAGE_EXTS.has(ext)) return "image";
  if (DOC_EXTS.has(ext)) return "document";
  return null;
}

export async function readAttachedFile(file: File): Promise<AttachedFile | null> {
  const kind = getFileKind(file.name);
  if (!kind) return null;

  if (kind === "text") {
    const content = await file.text();
    return { name: file.name, mimeType: file.type || "text/plain", kind, content, size: file.size };
  }

  // images and documents — read as data URL; backend handles extraction for documents
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) =>
      resolve({ name: file.name, mimeType: file.type, kind, content: e.target?.result as string, size: file.size });
    reader.readAsDataURL(file);
  });
}

const MAX_TEXT_CHARS = 12000;

export function buildMessageWithAttachments(text: string, files: AttachedFile[]): string {
  // Only inline text/code files — images and documents are handled separately
  const textFiles = files.filter((f) => f.kind === "text");
  if (!textFiles.length) return text;

  const blocks = textFiles
    .map((f) => {
      const ext = f.name.split(".").pop() ?? "";
      const snippet =
        f.content.length > MAX_TEXT_CHARS
          ? f.content.slice(0, MAX_TEXT_CHARS) + "\n... (truncated — file too large to show in full)"
          : f.content;
      return `\n\n---\n**Attached: ${f.name}**\n\`\`\`${ext}\n${snippet}\n\`\`\``;
    })
    .join("");

  return text + blocks;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
