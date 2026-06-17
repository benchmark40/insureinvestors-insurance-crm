import { NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";

import { Acord125Document } from "@/lib/pdf/acord-125";
import { Acord126Document } from "@/lib/pdf/acord-126";
import { Acord140Document } from "@/lib/pdf/acord-140";
import { loadSubmissionForPdf } from "@/lib/pdf/load";
import { customerDisplay } from "@/lib/pdf/shared";
import { SupplementalDocument } from "@/lib/pdf/supplemental";
import { requireAuth } from "@/lib/require-auth";

const FORM_TITLES: Record<string, string> = {
  "acord-125": "Commercial Application",
  "acord-126": "General Liability",
  "acord-140": "Property",
  supplemental: "Submission Summary",
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ type: string; uuid: string }> },
) {
  const { type, uuid } = await ctx.params;
  if (!FORM_TITLES[type]) {
    return NextResponse.json({ error: "Unknown form" }, { status: 404 });
  }

  const auth = await requireAuth();
  const submission = await loadSubmissionForPdf(auth, uuid);
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, {
      status: 404,
    });
  }

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

  // @react-pdf returns a Node Readable stream; cast to a web ReadableStream
  // via the Response body type Next accepts.
  const stream = (await renderToStream(doc)) as unknown as ReadableStream;

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
