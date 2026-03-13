import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (user) {
    let onboardingComplete = user.user_metadata?.onboarding_complete === true;
    if (!onboardingComplete) {
      const { data: row } = await supabase
        .from("users")
        .select("onboarding_complete")
        .eq("id", user.id)
        .maybeSingle();
      onboardingComplete = row?.onboarding_complete === true;
    }
    if (path === "/sign-in") {
      return NextResponse.redirect(
        new URL(onboardingComplete ? "/app" : "/onboarding", request.url)
      );
    }
    if (path === "/") {
      return NextResponse.redirect(
        new URL(onboardingComplete ? "/app" : "/onboarding", request.url)
      );
    }
  } else {
    if (path.startsWith("/app") || path.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
    if (path === "/") {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
