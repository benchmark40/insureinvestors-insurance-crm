/**
 * Server-side renderer for the four built-in submission forms. Returns a
 * Buffer ready to attach to a Graph sendMail call.
 */

import { renderToBuffer } from "@react-pdf/renderer";

import { Acord125Document } from "@/lib/pdf/acord-125";
import { Acord126Document } from "@/lib/pdf/acord-126";
import { Acord140Document } from "@/lib/pdf/acord-140";
import { loadSubmissionForPdf } from "@/lib/pdf/load";
import { customerDisplay } from "@/lib/pdf/shared";
import { SupplementalDocument } from "@/lib/pdf/supplemental";
import { type AuthContext } from "@/lib/require-auth";

export type FormType = "acord-125" | "acord-126" | "acord-140" | "supplemental";

export const FORM_LABELS: Record<FormType, string> = {
  "acord-125": "ACORD 125 — Commercial Application",
  "acord-126": "ACORD 126 — General Liability",
  "acord-140": "ACORD 140 — Property",
  supplemental: "Submission Summary (Supplemental)",
};

const FORM_TITLES: Record<FormType, string> = {
  "acord-125": "Commercial Application",
  "acord-126": "General Liability",
  "acord-140": "Property",
  supplemental: "Submission Summary",
};

export type RenderedForm = {
  filename: string;
  contentType: "application/pdf";
  bytes: Buffer;
};

export async function renderFormToBuffer(
  ctx: AuthContext,
  submissionUuid: string,
  type: FormType,
): Promise<RenderedForm> {
  const submission = await loadSubmissionForPdf(ctx, submissionUuid);
  if (!submission) throw new Error("Submission not found");

  const doc =
    type === "acord-125" ? (
      <Acord125Document s={submission} />
    ) : type === "acord-126" ? (
      <Acord126Document s={submission} />
    ) : type === "acord-140" ? (
      <Acord140Document s={submission} />
    ) : (
      <SupplementalDocument s={submission} />
    );

  const insured = customerDisplay(submission.customer)
    .replace(/[^A-Za-z0-9_-]+/g, "_")
    .slice(0, 40);
  const filename = `${FORM_TITLES[type]} - ${insured} - ${submission.uuid.slice(0, 8)}.pdf`;

  const bytes = await renderToBuffer(doc);
  return { filename, contentType: "application/pdf", bytes };
}
