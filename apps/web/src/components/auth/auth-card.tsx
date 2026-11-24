import Image from "next/image";
import type { ReactNode } from "react";

/** Contenedor común de /login y /registro: tarjeta centrada con el logo, título y bajada. */
export default function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="flex justify-center px-4 py-10 md:py-16">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm sm:p-8">
          <header className="mb-6 flex flex-col items-center text-center">
            <Image src="/logos/logo.png" alt="" width={48} height={48} className="mb-3" />
            <h1 className="text-2xl font-bold text-brand-navy">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </header>
          {children}
        </div>
        {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </section>
  );
}
