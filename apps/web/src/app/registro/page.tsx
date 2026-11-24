import { Suspense } from "react";
import { SessionLoading } from "@/components/auth/session-status";
import RegisterForm from "./register-form";

export const metadata = {
  title: "Crear cuenta",
  description: "Registrate gratis en EstudioYA y encontrá clases particulares con estudiantes avanzados y graduados.",
};

export default function RegistroPage() {
  // Suspense: el formulario lee `?next=` con useSearchParams().
  return (
    <Suspense fallback={<SessionLoading />}>
      <RegisterForm />
    </Suspense>
  );
}
