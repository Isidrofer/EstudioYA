import type { ReactNode } from 'react';

export const metadata = {
  title: 'EstudioYA',
  description: 'Clases particulares de estudiantes para estudiantes',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
