import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  // NEXTAUTH_SECRET is needed for the authentication to work

  // Get token if it exists
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  // Get pathname trying to be accessed
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname == "/login" || pathname == "/register" || pathname == "/forgot-password" || pathname == "/reset-password";
  const isAuthProtectedPage =
    pathname.startsWith("/home") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/publish") ||
    pathname.startsWith("/exchanges") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/favorites") ||
    pathname.startsWith("/books") ||
    pathname.startsWith("/communities") ||
    pathname.startsWith("/search");

  // Redirect to dashboard page if user is already authenticated
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  // Redirect to login page if user is NOT authenticated
  if (!session && isAuthProtectedPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // OPTIMIZATION: Redirect to /profile if user is accessing their own public profile
  if (session && pathname.startsWith("/user/")) {
    const pathUsername = pathname.split("/")[2];
    if (pathUsername && session.username === pathUsername) {
      return NextResponse.redirect(new URL("/profile", req.url));
    }
  }

  // If not in these cases, let request pass
  return NextResponse.next();
}

// Routes for the middleware to watch
export const config = {
  matcher: [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/home/:path*",
    "/profile/:path*",
    "/publish/:path*",
    "/user/:path*",
    "/exchanges/:path*",
    "/chat/:path*",
    "/favorites/:path*",
    "/books/:path*",
    "/communities/:path*",
    "/search/:path*"
  ],
};
