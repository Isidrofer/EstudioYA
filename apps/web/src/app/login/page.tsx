import { Suspense } from "react";
import { SessionLoading } from "@/components/auth/session-status";
import LoginForm from "./login-form";

export const metadata = {
  title: "Ingresar",
  description: "Ingresá a tu cuenta de EstudioYA.",
};

export default function LoginPage() {
  // Suspense: el formulario lee `?next=` con useSearchParams().
  return (
    <Suspense fallback={<SessionLoading />}>
      <LoginForm />
    </Suspense>
  );
}
