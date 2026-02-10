// src/lib/siiau.ts
export async function validateWithSIIAU(codigo: string, nip: string) {
  const LOGIN_URL = "https://mw.siiau.udg.mx/Portal/login.xhtml";
  const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  try {
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

    if (postResponse.status === 302) {
      const location = postResponse.headers.get("location");
      return { success: location && !location.includes("login.xhtml") };
    }
    return { success: false };
  } catch (error) {
    return { success: false };
  }
}
