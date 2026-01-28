/**
 * Next.js Proxy for APIS SaaS
 * Handles authentication, rate limiting, and security headers
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rate limiting configuration (simple in-memory)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // requests per window
  apiMax: 30, // API requests per window
};

function checkRateLimit(identifier: string, isApi: boolean): boolean {
  const now = Date.now();
  const limit = isApi ? RATE_LIMIT.apiMax : RATE_LIMIT.max;

  const record = rateLimitMap.get(identifier);

  if (!record || now - record.timestamp > RATE_LIMIT.windowMs) {
    rateLimitMap.set(identifier, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

// Security headers
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Add security headers to all responses
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  // Get client identifier for rate limiting
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "anonymous";
  const identifier = `${ip}:${pathname.startsWith("/api") ? "api" : "page"}`;

  // Check rate limit
  if (!checkRateLimit(identifier, pathname.startsWith("/api"))) {
    return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "60",
        ...securityHeaders,
      },
    });
  }

  // Skip auth check for public routes
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/api/health",
    "/api/webhooks",
    "/salon", // Public salon pages
  ];

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Skip auth for static files
  const isStaticFile =
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon");

  if (isPublicRoute || isStaticFile) {
    return response;
  }

  // Check for session cookie on protected routes
  const sessionToken = request.cookies.get("session")?.value;

  if (!sessionToken && pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
