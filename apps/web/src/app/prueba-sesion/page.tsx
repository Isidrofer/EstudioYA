import SessionTest from "./session-test";

/* Pantalla de prueba de FE-02: no es parte del producto.
   Se puede borrar cuando FE-03 tenga el login y el registro de verdad. */
export const metadata = {
  title: "Prueba de sesión",
  robots: { index: false, follow: false },
};

export default function PruebaSesionPage() {
  return <SessionTest />;
}
