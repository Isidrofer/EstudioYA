import js from "@eslint/js";
import tseslint from "typescript-eslint";
import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

// ── Archivos y carpetas que ESLint debe ignorar ─────────────────
const globalIgnores = {
  ignores: [
    "**/node_modules/",
    "**/dist/",
    "**/.next/",
    "**/coverage/",
    "apps/api/prisma/migrations/",
    "apps/api/storage/",
    "apps/api/scripts/",
    "apps/web/next-env.d.ts",
  ],
};

// ── Base: reglas recomendadas de JS ─────────────────────────────
const base = js.configs.recommended;

// ── TypeScript (todo el monorepo) ───────────────────────────────
const tsRules = tseslint.configs.recommended.map((cfg) => ({
  ...cfg,
  files: ["**/*.ts", "**/*.tsx"],
}));

// Ajustes razonables para proyecto con mucho código generado por IA:
// errores para problemas reales, warnings para ruido que no rompe nada.
const tsOverrides = {
  files: ["**/*.ts", "**/*.tsx"],
  rules: {
    // Variables sin usar → error, pero permitir _prefijo
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    // `any` explícito → warning (hay mucho código generado)
    "@typescript-eslint/no-explicit-any": "warn",
    // require() → warning
    "@typescript-eslint/no-require-imports": "warn",
    // No romper por interfaces vacías
    "@typescript-eslint/no-empty-object-type": "off",
    // `!` (non-null assertion) → permitido (común en NestJS)
    "@typescript-eslint/no-non-null-assertion": "off",
  },
};

// ── Next.js (solo apps/web) — usando compatibilidad legacy → flat
const nextOverrides = compat.config({
  extends: ["next/core-web-vitals"],
  settings: {
    next: { rootDir: "apps/web" },
  },
}).map((cfg) => ({
  ...cfg,
  files: ["apps/web/**/*.ts", "apps/web/**/*.tsx", "apps/web/**/*.js", "apps/web/**/*.mjs"],
}));

// ── NestJS: ajustes para apps/api ───────────────────────────────
const nestjsOverrides = {
  files: ["apps/api/**/*.ts"],
  rules: {
    "@typescript-eslint/no-extraneous-class": "off",
  },
};

export default [
  globalIgnores,
  { linterOptions: { reportUnusedDisableDirectives: "off" } },
  base,
  ...tsRules,
  tsOverrides,
  ...nextOverrides,
  nestjsOverrides,
];
