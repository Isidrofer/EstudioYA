const UNITS_MS = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const;

/** Convierte "15m", "30d", "12h" o "45s" a milisegundos. */
export function durationToMs(value: string): number {
  const match = /^(\d+)\s*([smhd])$/.exec(value.trim());
  if (!match) throw new Error(`Duración inválida: "${value}". Usar formatos como 15m, 12h, 30d.`);
  return Number(match[1]) * UNITS_MS[match[2] as keyof typeof UNITS_MS];
}
