import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for NextAuth v5 & v4 session token cookies
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  const isAuthenticated = Boolean(sessionToken);

  // Redirect logged-in users opening the software (root "/") directly to the new billing counter
  if (pathname === "/" && isAuthenticated) {
    return NextResponse.redirect(new URL("/billing/new", request.url));
  }

  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/billing") ||
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/hold-bills") ||
    pathname.startsWith("/udhari") ||
    pathname.startsWith("/credit-notes") ||
    pathname.startsWith("/returns");

  // Redirect logged-in users away from login/register to /billing/new
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/billing/new", request.url));
  }

  // Redirect unauthenticated users attempting to access protected dashboard routes
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/billing/:path*",
    "/invoices/:path*",
    "/customers/:path*",
    "/products/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/hold-bills/:path*",
    "/udhari/:path*",
    "/credit-notes/:path*",
    "/returns/:path*",
    "/login",
    "/register",
  ],
};

