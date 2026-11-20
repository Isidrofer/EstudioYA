import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Providers from "@/components/providers";
import "./globals.css";

/* ── Tipografías ────────────────────────────────────────────────
  Geist Sans: texto principal (legible, moderna, sin serif)
  Geist Mono: código o números si llegamos a usarlos
   ─────────────────────────────────────────────────────────────── */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "EstudioYA",
    template: "%s · EstudioYA",
  },
  description:
    "Clases particulares hechas por estudiantes, para estudiantes. Encontrá tu profe ideal en Argentina.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es-AR"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="flex min-h-screen flex-col antialiased">
        {/* Providers: TanStack Query y sesión (FE-02). Envuelve todo para que el header también pueda usar useSession(). */}
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
