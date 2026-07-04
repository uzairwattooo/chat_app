import { NextResponse } from "next/server";

export function proxy(request) {
    const token =
        request.cookies.get("better-auth.session_token")?.value ||
        request.cookies.get("__Secure-better-auth.session_token")?.value;
    const { pathname } = request.nextUrl;
    const isAuthPage = pathname === "/login" || pathname === "/signup";
    const isProtectedRoute = pathname.startsWith("/chat");
    if (isProtectedRoute && !token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }
    if (isAuthPage && token) {
        return NextResponse.redirect(new URL("/chat", request.url));
    }
    return NextResponse.next();
}

export const config = {
    matcher: ["/chat/:path*", "/login", "/signup"],
};