import { startFlow } from "@/lib/actions/submissions";

export const dynamic = "force-dynamic";

export default async function StartPage() {
  await startFlow();
  // startFlow always redirects; this is unreachable.
  return null;
}
