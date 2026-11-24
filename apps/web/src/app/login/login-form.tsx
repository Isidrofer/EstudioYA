"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { loginSchema, type AuthUser, type LoginInput } from "@estudioya/shared";
import AuthCard from "@/components/auth/auth-card";
import { FormAlert, PasswordField, TextField } from "@/components/auth/form-fields";
import { SessionLoading } from "@/components/auth/session-status";
import { Button } from "@/components/ui/button";
import { useFocusFirstError } from "@/hooks/use-focus-first-error";
import { useRedirectWhenAuthenticated } from "@/hooks/use-redirect-when-authenticated";
import { SESSION_QUERY_KEY } from "@/hooks/use-session";
import { api } from "@/lib/api";
import {
  apiErrorToFormErrors,
  issuesToFieldErrors,
  type FormErrors,
} from "@/lib/form-errors";
import { withNext } from "@/lib/redirect";

const FIELDS = ["email", "password"] as const;
type Field = (typeof FIELDS)[number];

export default function LoginForm() {
  const queryClient = useQueryClient();
  const { status, next } = useRedirectWhenAuthenticated();
  const [values, setValues] = useState<Record<Field, string>>({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors<Field>>({ fields: {} });

  const login = useMutation({
    mutationFn: (input: LoginInput) => api.post<AuthUser>("/auth/login", input),
    // Con el usuario en la cache, useSession() pasa a "authenticated" en toda la app
    // y useRedirectWhenAuthenticated() lleva a `next`.
    onSuccess: (user) => queryClient.setQueryData(SESSION_QUERY_KEY, user),
    onError: (error) => {
      const formErrors = apiErrorToFormErrors(error, FIELDS);
      setErrors(formErrors);
      requestFocus(formErrors.fields);
    },
  });

  // Declarado después de la mutación porque depende de `isPending`; `onError` lo usa recién al ejecutarse.
  const requestFocus = useFocusFirstError(FIELDS, login.isPending);

  if (status === "loading") return <SessionLoading />;
  if (status === "authenticated") return <SessionLoading label="Ingresando…" />;

  const update = (field: Field) => (event: { target: { value: string } }) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, fields: { ...prev.fields, [field]: undefined } }));
  };

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      const formErrors = { fields: issuesToFieldErrors<Field>(parsed.error.issues) };
      setErrors(formErrors);
      requestFocus(formErrors.fields);
      return;
    }
    setErrors({ fields: {} });
    login.mutate(parsed.data);
  }

  return (
    <AuthCard
      title="Ingresar"
      description="Qué bueno verte de nuevo. Ingresá para seguir aprendiendo."
      footer={
        <>
          ¿Todavía no tenés cuenta?{" "}
          <Link
            href={withNext("/registro", next)}
            className="font-semibold text-brand-orange-strong hover:underline"
          >
            Registrate gratis
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        {errors.form && <FormAlert>{errors.form}</FormAlert>}

        <TextField
          id="email"
          name="email"
          type="email"
          label="Email"
          placeholder="tu@email.com"
          autoComplete="email"
          inputMode="email"
          value={values.email}
          onChange={update("email")}
          error={errors.fields.email}
          disabled={login.isPending}
        />

        <PasswordField
          id="password"
          name="password"
          label="Contraseña"
          autoComplete="current-password"
          value={values.password}
          onChange={update("password")}
          error={errors.fields.password}
          disabled={login.isPending}
        />

        <Button
          type="submit"
          size="lg"
          disabled={login.isPending}
          className="mt-2 h-10 w-full bg-brand-orange-strong text-base font-semibold text-white hover:opacity-90"
        >
          {login.isPending && <Loader2Icon className="animate-spin" aria-hidden="true" />}
          {login.isPending ? "Ingresando…" : "Ingresar"}
        </Button>
      </form>
    </AuthCard>
  );
}
