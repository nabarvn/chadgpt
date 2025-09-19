import { getToken } from "next-auth/jwt";
import { rateLimiter } from "@/lib/rate-limiter";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api")) {
    const token = await getToken({ req });

    const ip =
      req.ip ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "127.0.0.1";

    const identifier = token?.email || ip;

    try {
      const { success } = await rateLimiter.limit(identifier);

      if (!success) {
        return new NextResponse("Too many requests.", { status: 429 });
      }
    } catch (error) {
      console.error("Rate limiter error:", error);
      return new NextResponse("Internal Server Error.", { status: 500 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
