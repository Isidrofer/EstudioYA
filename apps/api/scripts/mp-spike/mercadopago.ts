/**
 * SPIKE BE-07 · Prueba técnica de Mercado Pago (Split de Pagos 1:1 / marketplace).
 *
 * NO es código de producción: no lo importa la API (`src/`) ni corre en el CI. Sirve para validar
 * contra el entorno de pruebas de Mercado Pago las piezas que después va a usar el módulo `payments`
 * (BE-08). Conclusiones y fuentes: docs/adr/0002-pagos-mercado-pago.md.
 *
 * Sin dependencias nuevas: usa `fetch` nativo (Node 22) y `node:crypto`.
 * Los importes internos están en centavos (regla del proyecto); Mercado Pago recibe pesos con decimales.
 */
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { CURRENCY, PLATFORM_COMMISSION_BPS, splitAmount } from '@estudioya/shared';

export const MP_API_URL = 'https://api.mercadopago.com';

/**
 * URL de autorización OAuth. La guía de Split de Pagos usa `auth.mercadopago.com.ar` y la guía
 * general de OAuth `auth.mercadopago.com`; ambas aparecen en la documentación oficial (ver ADR §4).
 */
export const MP_AUTH_URL = 'https://auth.mercadopago.com.ar/authorization';

// ───────────────────────────── Dinero ─────────────────────────────

/** Centavos → pesos con 2 decimales, que es lo que esperan los campos de importe de Mercado Pago. */
export const centsToAmount = (cents: number): number => {
  if (!Number.isInteger(cents) || cents < 0) throw new Error(`Importe inválido: ${cents}`);
  return cents / 100;
};

// ───────────────────────────── OAuth del vendedor (profesor) ─────────────────────────────

export interface Pkce {
  verifier: string;
  challenge: string;
  method: 'S256';
}

/** PKCE (RFC 7636). Opcional en Mercado Pago: si se activa en la aplicación, pasa a ser obligatorio. */
export function createPkce(verifier = randomBytes(32).toString('base64url')): Pkce {
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge, method: 'S256' };
}

/** `state` aleatorio por intento: se guarda en sesión y se compara en el callback (anti-CSRF). */
export const createOAuthState = (): string => randomBytes(16).toString('base64url');

export function buildAuthorizationUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  pkce?: Pkce;
}): string {
  const url = new URL(MP_AUTH_URL);
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('platform_id', 'mp');
  url.searchParams.set('state', params.state);
  url.searchParams.set('redirect_uri', params.redirectUri);
  if (params.pkce) {
    url.searchParams.set('code_challenge', params.pkce.challenge);
    url.searchParams.set('code_challenge_method', params.pkce.method);
  }
  return url.toString();
}

/** Respuesta de POST /oauth/token (campos documentados). */
export interface MpOAuthToken {
  access_token: string;
  refresh_token: string;
  public_key: string;
  user_id: number;
  token_type: string;
  expires_in: number;
  scope: string;
  live_mode: boolean;
}

/** Error de la API de Mercado Pago con el cuerpo de la respuesta (sin datos sensibles del request). */
export class MpApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
    message: string,
  ) {
    super(message);
    this.name = 'MpApiError';
  }
}

async function mpRequest<T>(
  path: string,
  init: { method: 'GET' | 'POST'; accessToken?: string; body?: unknown; idempotencyKey?: string },
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (init.accessToken) headers.Authorization = `Bearer ${init.accessToken}`;
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';
  if (init.idempotencyKey) headers['X-Idempotency-Key'] = init.idempotencyKey;

  const res = await fetch(`${MP_API_URL}${path}`, {
    method: init.method,
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // respuesta no JSON: se deja el texto
  }
  if (!res.ok) throw new MpApiError(res.status, parsed, `${init.method} ${path} → ${res.status}`);
  return parsed as T;
}

/** Canjea el `code` del callback (válido 10 minutos) por las credenciales del vendedor. */
export function exchangeAuthorizationCode(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
  codeVerifier?: string;
  /** `true` pide credenciales de prueba (parámetro `test_token` de la documentación). */
  testToken?: boolean;
}): Promise<MpOAuthToken> {
  return mpRequest<MpOAuthToken>('/oauth/token', {
    method: 'POST',
    body: {
      client_id: params.clientId,
      client_secret: params.clientSecret,
      grant_type: 'authorization_code',
      code: params.code,
      redirect_uri: params.redirectUri,
      ...(params.codeVerifier ? { code_verifier: params.codeVerifier } : {}),
      ...(params.testToken ? { test_token: 'true' } : {}),
    },
  });
}

/**
 * Renueva el access token (dura 180 días). El refresh token también rota:
 * hay que guardar SIEMPRE el par nuevo que devuelve esta llamada.
 */
export function refreshAccessToken(params: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<MpOAuthToken> {
  return mpRequest<MpOAuthToken>('/oauth/token', {
    method: 'POST',
    body: {
      client_id: params.clientId,
      client_secret: params.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: params.refreshToken,
    },
  });
}

// ───────────────────────────── Cifrado de tokens (AES-256-GCM) ─────────────────────────────

const CIPHER_VERSION = 'v1';

function keyFromBase64(keyBase64: string | undefined): Buffer {
  if (!keyBase64) throw new Error('Falta TOKEN_ENCRYPTION_KEY (32 bytes en base64).');
  const key = Buffer.from(keyBase64, 'base64');
  if (key.length !== 32) {
    throw new Error(`TOKEN_ENCRYPTION_KEY debe tener 32 bytes; tiene ${key.length}.`);
  }
  return key;
}

/**
 * Cifra un secreto para guardarlo en la base (`mpAccessTokenEnc`, `mpRefreshTokenEnc`).
 * Formato: `v1.<iv>.<tag>.<ciphertext>` en base64url. GCM autentica: si alguien altera el
 * valor guardado, el descifrado falla en vez de devolver basura.
 */
export function encryptSecret(plain: string, keyBase64: string | undefined): string {
  const key = keyFromBase64(keyBase64);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [CIPHER_VERSION, iv, tag, ciphertext]
    .map((part) => (typeof part === 'string' ? part : part.toString('base64url')))
    .join('.');
}

export function decryptSecret(payload: string, keyBase64: string | undefined): string {
  const key = keyFromBase64(keyBase64);
  const [version, iv, tag, ciphertext] = payload.split('.');
  if (version !== CIPHER_VERSION || !iv || !tag || ciphertext === undefined) {
    throw new Error('Formato de secreto cifrado inválido.');
  }
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

// ───────────────────────────── Checkout Pro con comisión de marketplace ─────────────────────────────

export interface BookingCharge {
  /** Se manda como `external_reference` para vincular el pago con la reserva. */
  bookingId: string;
  title: string;
  /** Importe total de la reserva en centavos (ya calculado y congelado al reservar). */
  amountCents: number;
  commissionBps?: number;
  /** URL pública de la API que recibe los webhooks de esta preferencia. */
  notificationUrl?: string;
  backUrls?: { success: string; failure: string; pending: string };
  /** Vencimiento de la preferencia: debería coincidir con la retención del cupo (BR-06). */
  expiresAt?: Date;
  payerEmail?: string;
}

/**
 * Cuerpo de POST /checkout/preferences para Split 1:1.
 * `marketplace_fee` es un MONTO (no un porcentaje). Mercado Pago descuenta primero su propia
 * comisión y la del marketplace sale del saldo restante (ver ADR §5).
 */
export function buildMarketplacePreference(charge: BookingCharge) {
  const { commissionCents, teacherNetCents } = splitAmount(
    charge.amountCents,
    charge.commissionBps ?? PLATFORM_COMMISSION_BPS,
  );
  const body = {
    items: [
      {
        id: charge.bookingId,
        title: charge.title,
        quantity: 1,
        currency_id: CURRENCY,
        unit_price: centsToAmount(charge.amountCents),
      },
    ],
    marketplace_fee: centsToAmount(commissionCents),
    external_reference: charge.bookingId,
    ...(charge.notificationUrl ? { notification_url: charge.notificationUrl } : {}),
    ...(charge.backUrls ? { back_urls: charge.backUrls, auto_return: 'approved' } : {}),
    ...(charge.expiresAt
      ? {
          expires: true,
          expiration_date_from: new Date().toISOString(),
          expiration_date_to: charge.expiresAt.toISOString(),
        }
      : {}),
    ...(charge.payerEmail ? { payer: { email: charge.payerEmail } } : {}),
  };
  return { body, commissionCents, teacherNetBeforeMpFeeCents: teacherNetCents };
}

export interface MpPreference {
  id: string;
  init_point: string;
  sandbox_init_point?: string;
  collector_id?: number;
  marketplace?: string;
  marketplace_fee?: number;
}

/** Crea la preferencia CON EL TOKEN DEL VENDEDOR (profesor), como exige el modelo 1:1. */
export function createPreference(
  sellerAccessToken: string,
  body: unknown,
  idempotencyKey: string,
): Promise<MpPreference> {
  return mpRequest<MpPreference>('/checkout/preferences', {
    method: 'POST',
    accessToken: sellerAccessToken,
    body,
    idempotencyKey,
  });
}

/** Estado real de un pago. Ante un webhook, siempre se consulta esto antes de confiar en nada. */
export function getPayment(accessToken: string, paymentId: string): Promise<Record<string, unknown>> {
  if (!/^\d+$/.test(paymentId)) throw new Error(`ID de pago inválido: ${paymentId}`);
  return mpRequest<Record<string, unknown>>(`/v1/payments/${paymentId}`, {
    method: 'GET',
    accessToken,
  });
}

// ───────────────────────────── Webhooks: firma x-signature ─────────────────────────────

/** `x-signature: ts=1742505638683,v1=<hmac hex>` → `{ ts, v1 }`. */
export function parseSignatureHeader(header: string | undefined): { ts?: string; v1?: string } {
  const result: { ts?: string; v1?: string } = {};
  for (const part of (header ?? '').split(',')) {
    const [rawKey, ...rest] = part.split('=');
    const key = rawKey?.trim();
    const value = rest.join('=').trim();
    if (key === 'ts') result.ts = value;
    if (key === 'v1') result.v1 = value;
  }
  return result;
}

/**
 * Plantilla documentada: `id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];`.
 * `data.id` sale del query string de la notificación y, si es alfanumérico, va en minúsculas.
 * Si un valor no llega, se omite su segmento (comportamiento a confirmar en sandbox: ADR §8).
 */
export function buildSignatureManifest(params: {
  dataId?: string;
  requestId?: string;
  ts: string;
}): string {
  let manifest = '';
  if (params.dataId) manifest += `id:${params.dataId.toLowerCase()};`;
  if (params.requestId) manifest += `request-id:${params.requestId};`;
  manifest += `ts:${params.ts};`;
  return manifest;
}

export type SignatureCheck =
  | { valid: true }
  | { valid: false; reason: 'MISSING_HEADER' | 'MALFORMED_HEADER' | 'MISMATCH' | 'STALE' };

/**
 * Verifica que la notificación venga de Mercado Pago (HMAC-SHA256 hex con la clave secreta de
 * "Tus integraciones"). Compara en tiempo constante. `maxAgeMs` es una defensa propia contra
 * reenvíos viejos: la documentación no define una ventana, así que por defecto no se aplica.
 */
export function verifyWebhookSignature(params: {
  xSignature: string | undefined;
  xRequestId: string | undefined;
  dataId: string | undefined;
  secret: string;
  maxAgeMs?: number;
  now?: number;
}): SignatureCheck {
  if (!params.xSignature) return { valid: false, reason: 'MISSING_HEADER' };
  const { ts, v1 } = parseSignatureHeader(params.xSignature);
  if (!ts || !v1 || !/^[0-9a-f]+$/i.test(v1)) return { valid: false, reason: 'MALFORMED_HEADER' };

  if (params.maxAgeMs !== undefined) {
    const age = (params.now ?? Date.now()) - Number(ts);
    if (!Number.isFinite(age) || Math.abs(age) > params.maxAgeMs) {
      return { valid: false, reason: 'STALE' };
    }
  }

  const manifest = buildSignatureManifest({ dataId: params.dataId, requestId: params.xRequestId, ts });
  const expected = createHmac('sha256', params.secret).update(manifest).digest();
  const received = Buffer.from(v1, 'hex');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return { valid: false, reason: 'MISMATCH' };
  }
  return { valid: true };
}

/**
 * Clave de idempotencia para `webhook_events (provider, eventKey)`. Mercado Pago reintenta cada
 * 15 minutos si no recibe 200/201 en 22 segundos, así que el mismo evento puede llegar varias veces.
 */
export const webhookEventKey = (notification: {
  type?: string;
  action?: string;
  dataId?: string;
  id?: string | number;
}): string =>
  notification.id !== undefined
    ? `notification:${notification.id}`
    : `${notification.type ?? 'unknown'}:${notification.action ?? 'unknown'}:${notification.dataId ?? ''}`;
