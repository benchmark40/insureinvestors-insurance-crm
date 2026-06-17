import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on every route except:
    // - /login, /signup
    // - /api/auth/* (better-auth handler)
    // - /api/webhooks/* (Graph + Ascend — externally called, self-authenticated)
    // - /api/cron/* (Vercel cron — gated by its own secret)
    // - _next/static + image assets + favicon
    "/((?!login|signup|api/auth|api/webhooks|api/cron|_next/static|_next/image|favicon.ico).*)",
  ],
};
