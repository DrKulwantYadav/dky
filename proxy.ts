import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/camps" || request.nextUrl.pathname.startsWith("/camps/")) {
    const response = NextResponse.next();
    const devSocket = process.env.NODE_ENV === "development" ? " ws: http:" : "";
    response.headers.set("Content-Security-Policy", [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data: https:",
      `connect-src 'self' https://www.facebook.com${devSocket}`,
    ].join("; "));
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  }
  return updateSession(request);
}

export const config = {
  matcher: ["/admin/:path*", "/camps/:path*"],
};
