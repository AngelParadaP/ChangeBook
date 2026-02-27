import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/auth/SessionProvider";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900", "1000"],
  style: ["normal", "italic"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kyboo",
  description:
    "Aplicación web para fomentar la cultura lectora en la Universidad de Guadalajara",
  icons: {
    icon: "/logo_kyboo.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={nunito.variable}>
      <body className="font-sans antialiased">
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

