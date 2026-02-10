import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { GlobalToast } from "@/components/ui/GlobalToast";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kyboo",
  description:
    "Aplicación web para fomentar la cultura lectora en la Universidad de Guadalajara",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <SessionProvider session={session}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <GlobalToast />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

