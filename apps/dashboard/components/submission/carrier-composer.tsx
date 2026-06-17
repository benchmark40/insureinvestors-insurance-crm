"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { FileText, Mail, Paperclip, Search, Send, Upload } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  listRecipientCompanies,
  sendSubmissionToCarriers,
  type RecipientCompanies,
} from "@/lib/actions/carriers";
import {
  listSubmissionAttachables,
  type SubmissionAttachables,
} from "@/lib/actions/attachables";
import { type FormType } from "@/lib/pdf/render";

type Personnel = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
};

type Company = {
  id: number;
  name: string;
  naic: string;
  personnel: Personnel[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissionUuid: string;
  customerName: string;
};

const SECTION_LABELS: Record<keyof RecipientCompanies, string> = {
  carriers: "Carriers",
  wholesalers: "Wholesalers",
};

const DEFAULT_BODY = (customerName: string) =>
  `Hi,

We have a new submission we'd love to put in front of you:

  • Named insured: ${customerName}
  • Commercial property + general liability quoting

The supplemental and acord forms are attached. Happy to walk through anything that's helpful — please let us know if you're a market for this risk.

Thanks,
The InsureInvestors team`;

const EMPTY: RecipientCompanies = { carriers: [], wholesalers: [] };
const EMPTY_ATTACH: SubmissionAttachables = { forms: [], uploads: [] };

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function CarrierComposer({
  open,
  onOpenChange,
  submissionUuid,
  customerName,
}: Props) {
  const [companies, setCompanies] = useState<RecipientCompanies>(EMPTY);
  const [attachables, setAttachables] = useState<SubmissionAttachables>(EMPTY_ATTACH);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [selectedForms, setSelectedForms] = useState<Set<FormType>>(
    () => new Set(["supplemental", "acord-125"] as FormType[]),
  );
  const [selectedUploads, setSelectedUploads] = useState<Set<number>>(new Set());
  const [subject, setSubject] = useState(`New submission — ${customerName}`);
  const [body, setBody] = useState(DEFAULT_BODY(customerName));
  const [query, setQuery] = useState("");
  const [includeNoContacts, setIncludeNoContacts] = useState(false);

  // Load companies + attachables lazily once the dialog opens.
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      listRecipientCompanies(),
      listSubmissionAttachables(submissionUuid),
    ])
      .then(([c, a]) => {
        setCompanies(c);
        setAttachables(a);
      })
      .finally(() => setLoading(false));
  }, [open, submissionUuid]);

  // Reset state on each open.
  useEffect(() => {
    if (open) {
      setSubject(`New submission — ${customerName}`);
      setBody(DEFAULT_BODY(customerName));
      setSelected(new Set());
      setSelectedForms(new Set(["supplemental", "acord-125"] as FormType[]));
      setSelectedUploads(new Set());
      setQuery("");
      setIncludeNoContacts(false);
    }
  }, [open, customerName]);

  function toggleForm(type: FormType) {
    setSelectedForms((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  function toggleUpload(id: number) {
    setSelectedUploads((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggle(personnelId: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(personnelId)) next.delete(personnelId);
      else next.add(personnelId);
      return next;
    });
  }

  const hasQuery = query.trim().length > 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    function filterList(list: Company[]): Company[] {
      // Always keep companies that already have a selected contact, so users
      // never lose track of their picks while typing a new search.
      return list.filter((c) => {
        const hasSelected = c.personnel.some((p) => selected.has(p.id));
        if (hasSelected) return true;
        if (!q) return false;
        if (!includeNoContacts && c.personnel.length === 0) return false;
        if (c.name.toLowerCase().includes(q)) return true;
        return c.personnel.some(
          (p) =>
            p.email.toLowerCase().includes(q) ||
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(q),
        );
      });
    }
    return {
      carriers: filterList(companies.carriers),
      wholesalers: filterList(companies.wholesalers),
    };
  }, [companies, query, includeNoContacts, selected]);

  function onSend() {
    if (selected.size === 0) {
      toast.error("Pick at least one recipient.");
      return;
    }
    startTransition(async () => {
      try {
        await sendSubmissionToCarriers(submissionUuid, {
          personnelIds: Array.from(selected),
          subject,
          body,
          attachments: {
            forms: Array.from(selectedForms),
            uploadIds: Array.from(selectedUploads),
          },
        });
        toast.success(
          `Sent to ${selected.size} contact${selected.size === 1 ? "" : "s"}`,
        );
        onOpenChange(false);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Couldn't send. Try again.",
        );
      }
    });
  }

  const totalCount = companies.carriers.length + companies.wholesalers.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b p-4">
          <DialogTitle className="flex items-center gap-2">
            <Mail className="size-5" />
            Email submission
          </DialogTitle>
          <DialogDescription>
            Each contact gets a SubmissionRecipient row. The email is sent via
            Outlook from{" "}
            <span className="font-mono">submissions@insureinvestors.com</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Recipients</FieldLabel>
              <FieldDescription>
                Pick the contacts you want to receive this submission.
              </FieldDescription>

              {loading ? (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Spinner /> Loading recipient panel…
                </div>
              ) : totalCount === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No companies seeded. Run{" "}
                  <code className="bg-muted rounded px-1 py-0.5 text-xs">
                    bun db:seed
                  </code>{" "}
                  from the monorepo root.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="text-muted-foreground absolute top-1/2 left-2 size-4 -translate-y-1/2" />
                      <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search carrier, wholesaler, or contact"
                        className="pl-8"
                      />
                    </div>
                    <Label
                      htmlFor="include-no-contacts"
                      className="text-muted-foreground flex items-center gap-2 text-xs whitespace-nowrap"
                    >
                      <Switch
                        id="include-no-contacts"
                        checked={includeNoContacts}
                        onCheckedChange={setIncludeNoContacts}
                      />
                      Show no-contact
                    </Label>
                  </div>

                  {!hasQuery && selected.size === 0 ? (
                    <p className="text-muted-foreground rounded-md border border-dashed px-3 py-6 text-center text-sm">
                      Start typing to find a carrier, wholesaler, or contact.
                      <br />
                      <span className="text-xs">
                        {companies.carriers.length} carriers ·{" "}
                        {companies.wholesalers.length} wholesalers on file.
                      </span>
                    </p>
                  ) : (
                    <div className="max-h-72 space-y-3 overflow-y-auto rounded-md border p-2">
                      {(Object.keys(SECTION_LABELS) as Array<keyof RecipientCompanies>).map(
                        (key) => (
                          <RecipientSection
                            key={key}
                            label={SECTION_LABELS[key]}
                            companies={filtered[key]}
                            totalInGroup={companies[key].length}
                            selected={selected}
                            onToggle={toggle}
                          />
                        ),
                      )}
                    </div>
                  )}
                </div>
              )}
            </Field>

            <Field>
              <FieldLabel>
                <Paperclip className="size-3.5" data-icon="inline-start" />
                Attachments
              </FieldLabel>
              <FieldDescription>
                ACORD forms render from this submission&apos;s data. Uploads come
                from the Documents tab. Total payload capped at ~3 MB.
              </FieldDescription>
              <div className="space-y-3 rounded-md border p-2">
                <AttachableGroup
                  icon={<FileText className="size-3" />}
                  label="Forms"
                >
                  {attachables.forms.map((f) => (
                    <AttachableRow
                      key={f.type}
                      id={`form-${f.type}`}
                      checked={selectedForms.has(f.type)}
                      onToggle={() => toggleForm(f.type)}
                      label={f.label}
                      meta="generated PDF"
                    />
                  ))}
                </AttachableGroup>
                <AttachableGroup
                  icon={<Upload className="size-3" />}
                  label="Uploaded documents"
                  emptyHint="No documents uploaded to this submission."
                  empty={attachables.uploads.length === 0}
                >
                  {attachables.uploads.map((u) => (
                    <AttachableRow
                      key={u.id}
                      id={`upload-${u.id}`}
                      checked={selectedUploads.has(u.id)}
                      onToggle={() => toggleUpload(u.id)}
                      label={u.filename}
                      meta={`${formatBytes(u.sizeBytes)} · ${u.mimeType || "file"}`}
                    />
                  ))}
                </AttachableGroup>
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="composer-subject">Subject</FieldLabel>
              <Input
                id="composer-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="composer-body">Body</FieldLabel>
              <Textarea
                id="composer-body"
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="font-mono text-xs"
              />
            </Field>
          </FieldGroup>
        </div>

        <DialogFooter className="m-0 rounded-none border-t p-4">
          <DialogClose
            render={
              <Button variant="ghost" disabled={isPending} nativeButton>
                Cancel
              </Button>
            }
          />
          <Button onClick={onSend} disabled={isPending}>
            {isPending && <Spinner data-icon="inline-start" />}
            {!isPending && <Send data-icon="inline-start" />}
            {isPending
              ? "Sending…"
              : `Send to ${selected.size || "—"} contact${selected.size === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AttachableGroup({
  icon,
  label,
  empty,
  emptyHint,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  empty?: boolean;
  emptyHint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-muted-foreground mb-1 flex items-center gap-1.5 px-0.5 text-[10px] font-semibold uppercase">
        {icon}
        <span>{label}</span>
      </div>
      {empty ? (
        <p className="text-muted-foreground rounded-md border border-dashed px-2 py-1.5 text-[11px]">
          {emptyHint ?? "Nothing here."}
        </p>
      ) : (
        <div className="divide-y rounded-md border">{children}</div>
      )}
    </div>
  );
}

function AttachableRow({
  id,
  checked,
  onToggle,
  label,
  meta,
}: {
  id: string;
  checked: boolean;
  onToggle: () => void;
  label: string;
  meta?: string;
}) {
  return (
    <Label
      htmlFor={id}
      className="hover:bg-accent/30 has-data-[state=checked]:bg-primary/5 flex cursor-pointer items-center gap-2 px-2 py-1.5 transition-colors"
    >
      <Checkbox id={id} checked={checked} onCheckedChange={onToggle} />
      <div className="grid min-w-0 flex-1 gap-0 text-xs leading-tight">
        <span className="truncate font-medium">{label}</span>
        {meta && (
          <span className="text-muted-foreground truncate text-[10px]">
            {meta}
          </span>
        )}
      </div>
    </Label>
  );
}

function RecipientSection({
  label,
  companies,
  totalInGroup,
  selected,
  onToggle,
}: {
  label: string;
  companies: Company[];
  totalInGroup: number;
  selected: Set<number>;
  onToggle: (id: number) => void;
}) {
  if (companies.length === 0) return null;
  return (
    <div>
      <div className="text-muted-foreground mb-1 flex items-center gap-2 px-0.5 text-[10px] font-semibold uppercase">
        <span>{label}</span>
        <span className="text-muted-foreground/70 font-normal">
          {companies.length} of {totalInGroup}
        </span>
      </div>
      <div className="space-y-1.5">
        {companies.map((c) => (
          <CompanyBlock
            key={c.id}
            company={c}
            selected={selected}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

function CompanyBlock({
  company,
  selected,
  onToggle,
}: {
  company: Company;
  selected: Set<number>;
  onToggle: (id: number) => void;
}) {
  const allSelected =
    company.personnel.length > 0 &&
    company.personnel.every((p) => selected.has(p.id));

  return (
    <div className="rounded-md border">
      <div className="bg-muted/30 flex items-center justify-between border-b px-2 py-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-xs font-semibold">{company.name}</span>
          {company.naic && (
            <Badge variant="outline" className="px-1 py-0 text-[10px]">
              {company.naic}
            </Badge>
          )}
        </div>
        <span className="text-muted-foreground shrink-0 text-[10px]">
          {company.personnel.length}
          {allSelected && " · all"}
        </span>
      </div>
      <div className="divide-y">
        {company.personnel.length === 0 ? (
          <div className="text-muted-foreground px-2 py-1.5 text-[11px]">
            No contacts on file.
          </div>
        ) : (
          company.personnel.map((p) => {
            const checked = selected.has(p.id);
            return (
              <Label
                key={p.id}
                htmlFor={`p-${p.id}`}
                className="hover:bg-accent/30 has-data-[state=checked]:bg-primary/5 flex cursor-pointer items-center gap-2 px-2 py-1.5 transition-colors"
              >
                <Checkbox
                  id={`p-${p.id}`}
                  checked={checked}
                  onCheckedChange={() => onToggle(p.id)}
                />
                <div className="grid min-w-0 flex-1 gap-0 text-xs leading-tight">
                  <span className="truncate font-medium">
                    {p.firstName} {p.lastName}
                    {p.title && (
                      <span className="text-muted-foreground ml-1.5 text-[10px] font-normal">
                        · {p.title}
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground truncate font-mono text-[10px]">
                    {p.email}
                  </span>
                </div>
              </Label>
            );
          })
        )}
      </div>
    </div>
  );
}
