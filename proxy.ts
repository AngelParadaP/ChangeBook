import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  // NEXTAUTH_SECRET is needed for the authentication to work

  // Get token if it exists
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  // Get pathname trying to be accessed
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname == "/login" || pathname == "/register";
  const isAuthProtectedPage = pathname.startsWith("/home") || pathname.startsWith("/profile") || pathname.startsWith("/publish");

  // Redirect to dashboard page if user is already authenticated
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  // Redirect to login page if user is NOT authenticated
  if (!session && isAuthProtectedPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If not in these cases, let request pass
  return NextResponse.next();
}

// Routes for the middleware to watch
export const config = {
  matcher: ["/login", "/register", "/home/:path*", "/profile/:path*", "/publish/:path*"],
};
