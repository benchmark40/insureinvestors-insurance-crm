"use client";

import { useRef, useState, useTransition } from "react";
import {
  Download,
  File,
  FileText,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  deleteSubmissionDocument,
  uploadSubmissionDocument,
} from "@/lib/actions/documents";

export type DocumentRow = {
  id: number;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string; // ISO
  uploadedByName: string | null;
};

const FORM_BUTTONS: Array<{
  key: string;
  label: string;
  blurb: string;
  primary?: boolean;
}> = [
  {
    key: "supplemental",
    label: "Full Submission Summary",
    blurb: "Cover page + every section, in one PDF",
    primary: true,
  },
  {
    key: "acord-125",
    label: "Commercial Application",
    blurb: "ACORD 125 equivalent — insured, policy, prior coverage",
  },
  {
    key: "acord-126",
    label: "General Liability",
    blurb: "ACORD 126 equivalent — limits, classifications, optional coverages",
  },
  {
    key: "acord-140",
    label: "Property Section",
    blurb: "ACORD 140 equivalent — locations & buildings",
  },
];

export function DocumentsTab({
  submissionUuid,
  documents,
}: {
  submissionUuid: string;
  documents: DocumentRow[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <FormsSection submissionUuid={submissionUuid} />
      <UploadSection submissionUuid={submissionUuid} documents={documents} />
    </div>
  );
}

// =============================================================================
// Section 1 — PDF downloads
// =============================================================================

function FormsSection({ submissionUuid }: { submissionUuid: string }) {
  return (
    <SectionCard
      icon={FileText}
      title="Download Forms"
      subtitle="Server-generated PDFs filled with this submission's data"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {FORM_BUTTONS.map((f) => (
          <a
            key={f.key}
            href={`/api/forms/${f.key}/${submissionUuid}`}
            target="_blank"
            rel="noopener"
            className={
              "group flex items-center justify-between rounded-md border p-4 transition-colors " +
              (f.primary
                ? "bg-primary/5 border-primary/30 hover:border-primary/60"
                : "hover:bg-accent/30")
            }
          >
            <div className="flex items-center gap-3">
              <span
                className={
                  "flex size-10 items-center justify-center rounded-md " +
                  (f.primary
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary")
                }
              >
                {f.primary ? (
                  <Sparkles className="size-5" />
                ) : (
                  <FileText className="size-5" />
                )}
              </span>
              <div>
                <p className="text-sm font-semibold">{f.label}</p>
                <p className="text-muted-foreground text-xs">{f.blurb}</p>
              </div>
            </div>
            <Download className="text-muted-foreground group-hover:text-primary size-4 shrink-0" />
          </a>
        ))}
      </div>
    </SectionCard>
  );
}

// =============================================================================
// Section 2 — Drag-drop uploads
// =============================================================================

function UploadSection({
  submissionUuid,
  documents,
}: {
  submissionUuid: string;
  documents: DocumentRow[];
}) {
  const [, startTransition] = useTransition();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.set("submissionUuid", submissionUuid);
        form.set("file", file);
        try {
          await uploadSubmissionDocument(form);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Couldn't upload file";
          toast.error(`${file.name}: ${message}`);
        }
      }
      toast.success(
        files.length === 1
          ? "Uploaded"
          : `Uploaded ${files.length} files`,
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <SectionCard
      icon={Upload}
      title="Attachments"
      subtitle="Anything else relevant — loss runs, financials, statements of value"
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!dragging) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed py-10 px-6 text-center transition-colors " +
          (dragging
            ? "border-primary bg-primary/10"
            : "border-muted-foreground/30 hover:border-primary/50 hover:bg-accent/20")
        }
      >
        {uploading ? (
          <Loader2 className="text-primary size-6 animate-spin" />
        ) : (
          <Upload className="text-muted-foreground size-6" />
        )}
        <p className="text-sm font-medium">
          {uploading
            ? "Uploading…"
            : dragging
              ? "Drop to upload"
              : "Drop files here, or click to browse"}
        </p>
        <p className="text-muted-foreground text-xs">
          Up to 20MB each · PDF / Office docs / images
        </p>
      </div>

      {documents.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
                <th className="px-3 py-2 text-left">File</th>
                <th className="px-3 py-2 text-right">Size</th>
                <th className="px-3 py-2 text-left">Uploaded</th>
                <th className="w-24 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-accent/20">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <File className="text-muted-foreground size-4 shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {doc.filename}
                        </p>
                        <p className="text-muted-foreground truncate text-[10px]">
                          {doc.mimeType}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="text-muted-foreground px-3 py-2 text-right text-xs tabular-nums">
                    {humanSize(doc.sizeBytes)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-xs">{fmtDateTime(doc.uploadedAt)}</div>
                    {doc.uploadedByName && (
                      <div className="text-muted-foreground text-[10px]">
                        by {doc.uploadedByName}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        nativeButton={false}
                        aria-label="Download"
                        render={
                          <a
                            href={`/api/documents/${doc.id}`}
                            target="_blank"
                            rel="noopener"
                          />
                        }
                      >
                        <Download className="size-3.5" />
                      </Button>
                      <DeleteButton id={doc.id} filename={doc.filename} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {documents.length === 0 && !uploading && (
        <p className="text-muted-foreground mt-3 text-center text-xs">
          No files yet — drop something above to get started.
        </p>
      )}

      {documents.length > 0 && (
        <div className="text-muted-foreground mt-2 flex items-center justify-between text-xs">
          <Badge variant="secondary" className="text-[10px]">
            {documents.length} file{documents.length === 1 ? "" : "s"}
          </Badge>
          <span>
            {humanSize(documents.reduce((s, d) => s + d.sizeBytes, 0))} total
          </span>
        </div>
      )}
    </SectionCard>
  );
}

function DeleteButton({ id, filename }: { id: number; filename: string }) {
  const [, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Delete"
      className="text-muted-foreground hover:text-destructive"
      onClick={() => {
        if (!confirm(`Remove "${filename}"?`)) return;
        startTransition(async () => {
          try {
            await deleteSubmissionDocument(id);
            toast.success("Deleted");
          } catch {
            toast.error("Couldn't delete file");
          }
        });
      }}
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}

// =============================================================================
// Shared
// =============================================================================

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="bg-muted/40 flex items-center gap-3 border-b px-5 py-3">
        <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-md">
          <Icon className="size-4" />
        </span>
        <div className="flex-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide">
            {title}
          </h3>
          {subtitle && (
            <p className="text-muted-foreground text-[11px]">{subtitle}</p>
          )}
        </div>
      </div>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

function humanSize(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
