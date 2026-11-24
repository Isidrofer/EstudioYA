"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { registerSchema, type AuthUser, type RegisterInput } from "@estudioya/shared";
import AuthCard from "@/components/auth/auth-card";
import {
  CheckboxField,
  FormAlert,
  PasswordField,
  TextField,
} from "@/components/auth/form-fields";
import { SessionLoading } from "@/components/auth/session-status";
import { Button } from "@/components/ui/button";
import { useFocusFirstError } from "@/hooks/use-focus-first-error";
import { useRedirectWhenAuthenticated } from "@/hooks/use-redirect-when-authenticated";
import { SESSION_QUERY_KEY } from "@/hooks/use-session";
import { api, isApiError } from "@/lib/api";
import {
  apiErrorToFormErrors,
  issuesToFieldErrors,
  type FormErrors,
} from "@/lib/form-errors";
import { withNext } from "@/lib/redirect";

/** En el orden en que aparecen en pantalla (se usa para enfocar el primer campo con error). */
const FIELDS = [
  "firstName",
  "lastName",
  "email",
  "password",
  "isAdultDeclaration",
  "acceptTerms",
] as const;
type Field = (typeof FIELDS)[number];

interface RegisterValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isAdultDeclaration: boolean;
  acceptTerms: boolean;
}

const INITIAL_VALUES: RegisterValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  isAdultDeclaration: false,
  acceptTerms: false,
};

/** El mínimo sale del schema compartido, para que el texto de ayuda nunca quede desactualizado. */
const passwordMinLength = registerSchema.shape.password.minLength;
const PASSWORD_HINT = passwordMinLength ? `Mínimo ${passwordMinLength} caracteres.` : undefined;

const EMAIL_TAKEN_MESSAGE = "Ya existe una cuenta con ese email.";

export default function RegisterForm() {
  const queryClient = useQueryClient();
  const { status, next } = useRedirectWhenAuthenticated();
  const [values, setValues] = useState<RegisterValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors<Field>>({ fields: {} });
  /** 409: el email ya está registrado. Se muestra con un link para ingresar. */
  const [emailTaken, setEmailTaken] = useState(false);

  const register = useMutation({
    mutationFn: (input: RegisterInput) => api.post<AuthUser>("/auth/register", input),
    // La API ya deja la sesión iniciada (cookies); se guarda el usuario y el hook redirige.
    onSuccess: (user) => queryClient.setQueryData(SESSION_QUERY_KEY, user),
    onError: (error) => {
      if (isApiError(error) && error.status === 409) {
        const formErrors = { fields: { email: error.detail ?? EMAIL_TAKEN_MESSAGE } };
        setEmailTaken(true);
        setErrors(formErrors);
        requestFocus(formErrors.fields);
        return;
      }
      const formErrors = apiErrorToFormErrors(error, FIELDS);
      setErrors(formErrors);
      requestFocus(formErrors.fields);
    },
  });

  // Declarado después de la mutación porque depende de `isPending`; `onError` lo usa recién al ejecutarse.
  const requestFocus = useFocusFirstError(FIELDS, register.isPending);

  if (status === "loading") return <SessionLoading />;
  if (status === "authenticated") return <SessionLoading label="Preparando tu cuenta…" />;

  function setField<K extends Field>(field: K, value: RegisterValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, fields: { ...prev.fields, [field]: undefined } }));
    if (field === "email") setEmailTaken(false);
  }

  const text = (field: "firstName" | "lastName" | "email" | "password") =>
    (event: { target: { value: string } }) => setField(field, event.target.value);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      const formErrors = { fields: issuesToFieldErrors<Field>(parsed.error.issues) };
      setErrors(formErrors);
      setEmailTaken(false);
      requestFocus(formErrors.fields);
      return;
    }
    setErrors({ fields: {} });
    register.mutate(parsed.data);
  }

  const busy = register.isPending;

  return (
    <AuthCard
      title="Crear cuenta"
      description="Registrate gratis y encontrá a tu profe ideal."
      footer={
        <>
          ¿Ya tenés cuenta?{" "}
          <Link
            href={withNext("/login", next)}
            className="font-semibold text-brand-orange-strong hover:underline"
          >
            Ingresá
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        {emailTaken ? (
          <FormAlert>
            Ya tenés una cuenta con ese email.{" "}
            <Link href={withNext("/login", next)} className="font-semibold underline">
              Ingresá con tu contraseña
            </Link>
            .
          </FormAlert>
        ) : (
          errors.form && <FormAlert>{errors.form}</FormAlert>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="firstName"
            name="firstName"
            label="Nombre"
            autoComplete="given-name"
            value={values.firstName}
            onChange={text("firstName")}
            error={errors.fields.firstName}
            disabled={busy}
          />
          <TextField
            id="lastName"
            name="lastName"
            label="Apellido"
            autoComplete="family-name"
            value={values.lastName}
            onChange={text("lastName")}
            error={errors.fields.lastName}
            disabled={busy}
          />
        </div>

        <TextField
          id="email"
          name="email"
          type="email"
          label="Email"
          placeholder="tu@email.com"
          autoComplete="email"
          inputMode="email"
          value={values.email}
          onChange={text("email")}
          error={errors.fields.email}
          disabled={busy}
        />

        <PasswordField
          id="password"
          name="password"
          label="Contraseña"
          autoComplete="new-password"
          value={values.password}
          onChange={text("password")}
          error={errors.fields.password}
          hint={PASSWORD_HINT}
          disabled={busy}
        />

        <div className="mt-1 flex flex-col gap-3">
          <CheckboxField
            id="isAdultDeclaration"
            checked={values.isAdultDeclaration}
            onCheckedChange={(checked) => setField("isAdultDeclaration", checked)}
            error={errors.fields.isAdultDeclaration}
            disabled={busy}
          >
            Declaro que soy mayor de 18 años.
          </CheckboxField>
          <CheckboxField
            id="acceptTerms"
            checked={values.acceptTerms}
            onCheckedChange={(checked) => setField("acceptTerms", checked)}
            error={errors.fields.acceptTerms}
            disabled={busy}
          >
            Acepto los términos y condiciones y la política de privacidad de EstudioYA.
          </CheckboxField>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={busy}
          className="mt-2 h-10 w-full bg-brand-orange-strong text-base font-semibold text-white hover:opacity-90"
        >
          {busy && <Loader2Icon className="animate-spin" aria-hidden="true" />}
          {busy ? "Creando tu cuenta…" : "Crear cuenta"}
        </Button>
      </form>
    </AuthCard>
  );
}
