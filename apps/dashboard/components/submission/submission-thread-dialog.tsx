"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowUpRight,
  FlaskConical,
  Inbox,
  Mail,
  Paperclip,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  getSubmissionThread,
  replyInThread,
  simulateCarrierReply,
  type SubmissionThread,
  type ThreadEntry,
} from "@/lib/actions/email-threads";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissionUuid: string;
  recipientId: number | null;
  devMode?: boolean;
};

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SubmissionThreadDialog({
  open,
  onOpenChange,
  submissionUuid,
  recipientId,
  devMode = false,
}: Props) {
  const [thread, setThread] = useState<SubmissionThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [isReplying, startReply] = useTransition();
  const [isSimulating, startSimulate] = useTransition();
  const simFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open || recipientId == null) return;
    setLoading(true);
    setReply("");
    getSubmissionThread(submissionUuid, recipientId)
      .then(setThread)
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : "Couldn't load thread"),
      )
      .finally(() => setLoading(false));
  }, [open, recipientId, submissionUuid]);

  function onSendReply() {
    if (!reply.trim() || recipientId == null) return;
    startReply(async () => {
      try {
        await replyInThread(submissionUuid, recipientId, reply);
        toast.success("Reply sent");
        setReply("");
        const updated = await getSubmissionThread(submissionUuid, recipientId);
        setThread(updated);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Couldn't send reply",
        );
      }
    });
  }

  function onSimulate() {
    if (!reply.trim() || recipientId == null) return;
    startSimulate(async () => {
      try {
        let attachment:
          | { filename: string; contentType: string; base64: string }
          | undefined;
        const file = simFileRef.current?.files?.[0];
        if (file) {
          attachment = {
            filename: file.name,
            contentType: file.type || "application/octet-stream",
            base64: await fileToBase64(file),
          };
        }
        await simulateCarrierReply(
          submissionUuid,
          recipientId,
          reply,
          attachment,
        );
        toast.success("Simulated carrier reply logged");
        setReply("");
        if (simFileRef.current) simFileRef.current.value = "";
        const updated = await getSubmissionThread(submissionUuid, recipientId);
        setThread(updated);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Simulator failed",
        );
      }
    });
  }

  const conversationStarted = !!thread?.conversationId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="border-b p-4">
          <DialogTitle className="flex items-center gap-2">
            <Mail className="size-5" />
            Email thread
          </DialogTitle>
          <DialogDescription>
            {conversationStarted
              ? "Outbound + carrier replies for this conversation."
              : "Thread is pending — the Graph conversationId wasn't captured. Replies can't be matched yet."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Spinner /> Loading thread…
            </div>
          ) : !thread || thread.entries.length === 0 ? (
            <p className="text-muted-foreground text-sm">No messages.</p>
          ) : (
            <div className="space-y-3">
              {thread.entries.map((e) => (
                <ThreadEntryCard key={`${e.kind}-${e.id}`} entry={e} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 border-t p-4">
          <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
            <ArrowUpRight className="size-3.5" />
            Reply in this thread
          </div>
          <Textarea
            rows={4}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={
              conversationStarted
                ? "Type your reply…"
                : devMode
                  ? "Type the simulated carrier reply… (real send requires an outbound first)"
                  : "Conversation not started yet — sending a reply will fail."
            }
            disabled={isReplying || isSimulating}
          />
          {devMode && (
            <div className="bg-muted/40 flex flex-wrap items-center gap-2 rounded-md border border-dashed px-2 py-1.5 text-[11px]">
              <FlaskConical className="size-3.5" />
              <span className="font-medium">Dev simulator —</span>
              <span className="text-muted-foreground">
                attach a fake quote (optional):
              </span>
              <input
                ref={simFileRef}
                type="file"
                className="text-muted-foreground text-[11px] file:mr-2 file:cursor-pointer file:rounded file:border file:border-input file:bg-background file:px-2 file:py-0.5 file:text-[11px] file:font-medium hover:file:bg-accent"
                disabled={isReplying || isSimulating}
              />
            </div>
          )}
        </div>

        <DialogFooter className="m-0 rounded-none border-t p-4">
          <DialogClose
            render={
              <Button
                variant="ghost"
                disabled={isReplying || isSimulating}
                nativeButton
              >
                Close
              </Button>
            }
          />
          {devMode && (
            <Button
              variant="outline"
              onClick={onSimulate}
              disabled={!reply.trim() || isReplying || isSimulating}
            >
              {isSimulating && <Spinner data-icon="inline-start" />}
              {!isSimulating && <FlaskConical data-icon="inline-start" />}
              {isSimulating ? "Logging…" : "Simulate carrier reply"}
            </Button>
          )}
          <Button
            onClick={onSendReply}
            disabled={
              !reply.trim() || isReplying || isSimulating || !conversationStarted
            }
          >
            {isReplying && <Spinner data-icon="inline-start" />}
            {!isReplying && <Send data-icon="inline-start" />}
            {isReplying ? "Sending…" : "Send reply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ThreadEntryCard({ entry }: { entry: ThreadEntry }) {
  if (entry.kind === "outbound") {
    return (
      <div className="rounded-md border bg-primary/5 px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Badge variant="outline" className="text-[10px]">
              Sent
            </Badge>
            <span>
              to {entry.recipientName}{" "}
              <span className="text-muted-foreground font-mono">
                · {entry.recipientEmail}
              </span>
            </span>
          </div>
          <span className="text-muted-foreground text-[10px]">
            {formatTime(entry.sentAt)}
          </span>
        </div>
        <div className="mt-1 text-sm font-semibold">{entry.subject}</div>
        <pre className="mt-2 text-muted-foreground font-sans text-xs whitespace-pre-wrap">
          {entry.body}
        </pre>
      </div>
    );
  }

  return (
    <div
      className={
        "rounded-md border px-3 py-2.5 " +
        (entry.isFromUs ? "bg-primary/5" : "bg-muted/30")
      }
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <Badge
            variant={entry.isFromUs ? "outline" : "default"}
            className="text-[10px]"
          >
            {entry.isFromUs ? "Sent" : "Reply"}
          </Badge>
          {!entry.isFromUs && <Inbox className="size-3.5" />}
          <span>
            {entry.senderName || entry.senderEmail}
            {entry.senderName && (
              <span className="text-muted-foreground font-mono">
                {" "}
                · {entry.senderEmail}
              </span>
            )}
          </span>
        </div>
        <span className="text-muted-foreground text-[10px]">
          {formatTime(entry.receivedAt)}
        </span>
      </div>
      {entry.subject && (
        <div className="mt-1 text-sm font-semibold">{entry.subject}</div>
      )}
      {entry.bodyContentType === "html" ? (
        <div
          className="prose prose-sm mt-2 max-w-none text-xs"
          dangerouslySetInnerHTML={{ __html: entry.body }}
        />
      ) : (
        <pre className="mt-2 text-muted-foreground font-sans text-xs whitespace-pre-wrap">
          {entry.body}
        </pre>
      )}
      {entry.attachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {entry.attachments.map((a) => (
            <a
              key={a.id}
              href={a.downloadUrl}
              className="hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px]"
              download={a.filename}
            >
              <Paperclip className="size-3" />
              <span className="font-medium">{a.filename}</span>
              <span className="text-muted-foreground">
                · {formatBytes(a.sizeBytes)}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
