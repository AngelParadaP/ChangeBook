// src/lib/siiau.ts

interface SIIAUResult {
  success: boolean;
  name?: string;
}

/**
 * Valida credenciales contra SIIAU y opcionalmente extrae el nombre del alumno.
 * Después de login exitoso, sigue el redirect al dashboard para hacer scraping del nombre.
 */
export async function validateWithSIIAU(codigo: string, nip: string): Promise<SIIAUResult> {
  const LOGIN_URL = "https://mw.siiau.udg.mx/Portal/login.xhtml";
  const BASE_URL = "https://mw.siiau.udg.mx";
  const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  try {
    // ─── Paso 1: GET para obtener cookies y ViewState ───
    const getResponse = await fetch(LOGIN_URL, {
      headers: { "User-Agent": USER_AGENT },
    });
    const html = await getResponse.text();
    const cookies = getResponse.headers.get("set-cookie");
    const jsessionid = cookies?.split(";")[0];
    const viewState = html.match(
      /name="javax\.faces\.ViewState".*?value="([^"]+)"/,
    )?.[1];

    if (!jsessionid || !viewState) return { success: false };

    // ─── Paso 2: POST login con credenciales ───
    const formData = new URLSearchParams();
    formData.append("loginForm", "loginForm");
    formData.append("loginForm:codigo", codigo);
    formData.append("loginForm:password", nip);
    formData.append("loginForm:j_idt40", "");
    formData.append("javax.faces.ViewState", viewState);

    const postResponse = await fetch(LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
        Cookie: jsessionid,
      },
      body: formData,
      redirect: "manual",
    });

    if (postResponse.status !== 302) return { success: false };

    const location = postResponse.headers.get("location");
    if (!location || location.includes("login.xhtml")) return { success: false };

    // ─── Paso 3: Seguir redirect para obtener el nombre del estudiante ───
    // Combinar cookies del POST response con la sesión original
    const postCookies = postResponse.headers.get("set-cookie");
    const sessionCookie = postCookies?.split(";")[0] || jsessionid;

    try {
      const redirectUrl = location.startsWith("http")
        ? location
        : `${BASE_URL}${location}`;

      const dashboardResponse = await fetch(redirectUrl, {
        headers: {
          "User-Agent": USER_AGENT,
          Cookie: sessionCookie,
        },
        redirect: "follow",
      });

      const dashboardHtml = await dashboardResponse.text();
      const name = extractNameFromDashboard(dashboardHtml);

      return { success: true, name: name || undefined };
    } catch {
      // Si el scraping falla, al menos el login fue exitoso
      return { success: true };
    }
  } catch {
    return { success: false };
  }
}

/**
 * Intenta extraer el nombre del estudiante del HTML del dashboard de SIIAU.
 * Busca patrones comunes como "Bienvenido(a) NOMBRE" o elementos con el nombre del alumno.
 */
function extractNameFromDashboard(html: string): string | null {
  // Patrón 1: Texto tipo "Bienvenido(a), NOMBRE COMPLETO" o "Bienvenido NOMBRE"
  const welcomePatterns = [
    /Bienvenid[oa]\s*\(a\)\s*,?\s*([A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]+)/i,
    /Bienvenid[oa]\s*,?\s*([A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]+)/i,
    /alumno[:\s]+([A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]+)/i,
    /nombre[:\s]+([A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]+)/i,
  ];

  for (const pattern of welcomePatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return formatName(match[1].trim());
    }
  }

  // Patrón 2: Buscar en elementos de UI comunes (spans, divs con clases de nombre)
  const elementPatterns = [
    /class="[^"]*(?:user-?name|nombre|student-?name|user-?info)[^"]*"[^>]*>([^<]+)/i,
    /id="[^"]*(?:nombre|name|user)[^"]*"[^>]*>([^<]+)/i,
  ];

  for (const pattern of elementPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const text = match[1].trim();
      // Solo aceptar si parece un nombre (al menos 2 palabras, sin HTML)
      if (text.length > 3 && text.split(/\s+/).length >= 2 && !text.includes("<")) {
        return formatName(text);
      }
    }
  }

  return null;
}

/**
 * Convierte un nombre de MAYÚSCULAS a formato Title Case.
 * "JUAN CARLOS PÉREZ GARCÍA" → "Juan Carlos Pérez García"
 */
function formatName(raw: string): string {
  return raw
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
