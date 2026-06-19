import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PRIVATE_PATHS = ["/mis-predicciones", "/ranking", "/perfil", "/admin", "/th"];
const AUTH_PATHS = ["/login", "/register"];

// Correos con acceso al panel de Talento Humano (/th). El admin también entra.
const TH_EMAILS = (process.env.NEXT_PUBLIC_TH_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

/**
 * Refresca la sesión de Supabase y aplica las reglas de acceso.
 * Llamado desde src/middleware.ts en cada request.
 */
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPrivate = PRIVATE_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  // Atajo de bajo costo: si la request NO trae cookie de sesión de Supabase, el
  // usuario es anónimo. No hace falta crear el cliente ni llamar a getUser()
  // (un viaje a Supabase Auth) — aplicamos las reglas directamente. Esto evita
  // que el tráfico anónimo (incl. floods) consuma CPU y requests a Supabase.
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));

  if (!hasAuthCookie) {
    if (isPrivate || pathname.startsWith("/admin") || pathname.startsWith("/th")) {
      const url = request.nextUrl.clone();
      if (isPrivate) {
        url.pathname = "/login";
        url.searchParams.set("redirect", pathname);
      } else {
        url.pathname = "/"; // /admin y /th sin sesión → home
      }
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: no metas lógica entre createServerClient y getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Rutas privadas requieren sesión
  if (isPrivate && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // /admin: solo el email autorizado
  if (pathname.startsWith("/admin")) {
    if (user?.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // /th: solo Talento Humano (o el admin)
  if (pathname.startsWith("/th")) {
    const email = (user?.email ?? "").toLowerCase();
    const isAdmin = email === (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").toLowerCase();
    if (!isAdmin && !TH_EMAILS.includes(email)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // Usuario con sesión no debería ver login/register
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}
