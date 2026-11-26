/**
 * SPIKE BE-07 · CLI para probar Mercado Pago contra el entorno de PRUEBAS.
 *
 *   npm run spike:mp -w @estudioya/api -- <comando> [opciones]
 *
 * Comandos (en orden de uso; guía completa en docs/adr/0002-pagos-mercado-pago.md §9):
 *   gen-key                         Genera una TOKEN_ENCRYPTION_KEY nueva (pegarla en el .env).
 *   oauth-url [--pkce]              URL para que el profesor (vendedor de prueba) autorice la app.
 *   oauth-exchange <code> [--test]  Canjea el code del callback y guarda los tokens CIFRADOS.
 *                                   No usar --test con cuentas de prueba: da un token TEST-… que no
 *                                   sirve para cobrar (ADR 0002 §9.5).
 *   oauth-refresh                   Renueva el access token guardado (el refresh token rota).
 *   preference [--amount <centavos>] [--title <texto>] [--notification-url <url>]
 *                                   Crea una preferencia de Checkout Pro con marketplace_fee (35 %).
 *   payment <paymentId>             Consulta el estado real de un pago con el token del vendedor.
 *   verify-webhook --x-signature <v> --x-request-id <v> --data-id <v>
 *                                   Verifica la firma de una notificación recibida.
 *
 * Variables (.env de la raíz): MP_APP_ID, MP_CLIENT_SECRET, MP_OAUTH_REDIRECT_URL,
 * MP_WEBHOOK_SECRET, TOKEN_ENCRYPTION_KEY. Los tokens nunca se imprimen: se guardan cifrados en
 * apps/api/storage/mp-spike/ (carpeta ignorada por git).
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { formatArs } from '@estudioya/shared';
import {
  MpApiError,
  buildAuthorizationUrl,
  buildMarketplacePreference,
  createOAuthState,
  createPkce,
  createPreference,
  decryptSecret,
  encryptSecret,
  exchangeAuthorizationCode,
  getPayment,
  refreshAccessToken,
  verifyWebhookSignature,
  type MpOAuthToken,
} from './mercadopago';

const STORAGE_DIR = resolve(__dirname, '../../storage/mp-spike');
const SELLER_FILE = resolve(STORAGE_DIR, 'seller.json');
const PENDING_FILE = resolve(STORAGE_DIR, 'oauth-pending.json');

interface StoredSeller {
  userId: number;
  liveMode: boolean;
  scope: string;
  accessTokenEnc: string;
  refreshTokenEnc: string;
  publicKey: string;
  expiresAt: string;
  savedAt: string;
}

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta ${name} en el .env de la raíz (ver ADR 0002 §9).`);
  return value;
}

function option(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

const mask = (value: string) => (value.length <= 8 ? '****' : `${value.slice(0, 4)}…${value.slice(-4)}`);

async function saveJson(path: string, data: unknown) {
  await mkdir(STORAGE_DIR, { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2), { encoding: 'utf8', mode: 0o600 });
}

async function storeSeller(token: MpOAuthToken) {
  const key = env('TOKEN_ENCRYPTION_KEY');
  const stored: StoredSeller = {
    userId: token.user_id,
    liveMode: token.live_mode,
    scope: token.scope,
    accessTokenEnc: encryptSecret(token.access_token, key),
    refreshTokenEnc: encryptSecret(token.refresh_token, key),
    publicKey: token.public_key,
    expiresAt: new Date(Date.now() + token.expires_in * 1000).toISOString(),
    savedAt: new Date().toISOString(),
  };
  await saveJson(SELLER_FILE, stored);
  console.log('Credenciales del vendedor guardadas CIFRADAS en', SELLER_FILE);
  console.log({
    user_id: token.user_id,
    live_mode: token.live_mode,
    scope: token.scope,
    expires_in: token.expires_in,
    expiresAt: stored.expiresAt,
    access_token: mask(token.access_token),
  });
  if (!token.scope?.includes('offline_access')) {
    console.warn('⚠ El scope no incluye offline_access: no se podrá renovar el token (ADR §7).');
  }
}

async function loadSeller(): Promise<StoredSeller & { accessToken: string; refreshToken: string }> {
  if (!existsSync(SELLER_FILE)) throw new Error('No hay vendedor guardado: ejecutá oauth-exchange primero.');
  const stored = JSON.parse(await readFile(SELLER_FILE, 'utf8')) as StoredSeller;
  const key = env('TOKEN_ENCRYPTION_KEY');
  return {
    ...stored,
    accessToken: decryptSecret(stored.accessTokenEnc, key),
    refreshToken: decryptSecret(stored.refreshTokenEnc, key),
  };
}

async function main() {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case 'gen-key': {
      console.log('TOKEN_ENCRYPTION_KEY=' + randomBytes(32).toString('base64'));
      console.log('Pegala en el .env de la raíz. Nunca la subas al repositorio.');
      return;
    }

    case 'oauth-url': {
      // Primero se validan las variables: no se guarda nada si falta configuración.
      const clientId = env('MP_APP_ID');
      const redirectUri = env('MP_OAUTH_REDIRECT_URL');
      const state = createOAuthState();
      const pkce = args.includes('--pkce') ? createPkce() : undefined;
      await saveJson(PENDING_FILE, { state, codeVerifier: pkce?.verifier, createdAt: new Date() });
      console.log('1) Abrí esta URL en una ventana de incógnito e ingresá con la cuenta de PRUEBA del vendedor:\n');
      console.log(buildAuthorizationUrl({ clientId, redirectUri, state, pkce }));
      console.log('\n2) Al volver a MP_OAUTH_REDIRECT_URL copiá el parámetro `code` de la barra de direcciones');
      console.log('   (la API todavía no tiene ese endpoint: una página 404 es normal) y comprobá que `state`');
      console.log(`   sea ${state}.`);
      console.log('3) Ejecutá: npm run spike:mp -w @estudioya/api -- oauth-exchange <code>  (válido 10 minutos)');
      return;
    }

    case 'oauth-exchange': {
      const code = args.find((a) => !a.startsWith('--'));
      if (!code) throw new Error('Uso: oauth-exchange <code> [--test]');
      const pending = existsSync(PENDING_FILE)
        ? (JSON.parse(await readFile(PENDING_FILE, 'utf8')) as { codeVerifier?: string })
        : {};
      const token = await exchangeAuthorizationCode({
        clientId: env('MP_APP_ID'),
        clientSecret: env('MP_CLIENT_SECRET'),
        code,
        redirectUri: env('MP_OAUTH_REDIRECT_URL'),
        codeVerifier: pending.codeVerifier,
        testToken: args.includes('--test'),
      });
      await storeSeller(token);
      return;
    }

    case 'oauth-refresh': {
      const seller = await loadSeller();
      const token = await refreshAccessToken({
        clientId: env('MP_APP_ID'),
        clientSecret: env('MP_CLIENT_SECRET'),
        refreshToken: seller.refreshToken,
      });
      await storeSeller(token);
      console.log('El refresh token rotó: se guardó el par nuevo.');
      return;
    }

    case 'preference': {
      const seller = await loadSeller();
      const amountCents = Number(option(args, '--amount') ?? 1_500_000);
      const bookingId = randomUUID();
      const { body, commissionCents, teacherNetBeforeMpFeeCents } = buildMarketplacePreference({
        bookingId,
        title: option(args, '--title') ?? 'Clase de prueba EstudioYA (spike BE-07)',
        amountCents,
        notificationUrl: option(args, '--notification-url'),
        // Misma ventana que la retención del cupo (BR-06: 10 minutos).
        expiresAt: new Date(Date.now() + 10 * 60_000),
      });
      console.log('Cuerpo enviado a POST /checkout/preferences:', JSON.stringify(body, null, 2));
      console.log(
        `Total ${formatArs(amountCents)} · comisión plataforma ${formatArs(commissionCents)} · ` +
          `profesor ${formatArs(teacherNetBeforeMpFeeCents)} ANTES de la comisión de Mercado Pago`,
      );
      // La clave de idempotencia sería el bookingId (o la Idempotency-Key del checkout, regla 19).
      const preference = await createPreference(seller.accessToken, body, bookingId);
      console.log({
        preference_id: preference.id,
        collector_id: preference.collector_id,
        marketplace: preference.marketplace,
        marketplace_fee: preference.marketplace_fee,
        external_reference: bookingId,
      });
      if (preference.marketplace === 'NONE') {
        console.warn(
          '\nAVISO: marketplace = "NONE". La aplicación no opera como marketplace y el pago se va a rechazar.\n' +
            'Creala desde una cuenta de prueba de tipo Marketplace (ADR 0002 §9.2 y §9.5).',
        );
      }
      console.log('\nPagá con un COMPRADOR de prueba (otra cuenta de prueba, ventana de incógnito):');
      // init_point y no sandbox_init_point: con las cuentas de prueba actuales el link de sandbox falla (ADR §9.5).
      console.log(preference.init_point ?? preference.sandbox_init_point);
      console.log('Tarjetas de prueba y nombres APRO/OTHE/CONT: ver ADR 0002 §9.');
      return;
    }

    case 'payment': {
      const paymentId = args[0];
      if (!paymentId) throw new Error('Uso: payment <paymentId>');
      const seller = await loadSeller();
      const p = await getPayment(seller.accessToken, paymentId);
      // Solo los campos que importan para el ADR (sin datos personales del comprador).
      const pick = (k: string) => p[k];
      console.log({
        id: pick('id'),
        status: pick('status'),
        status_detail: pick('status_detail'),
        captured: pick('captured'),
        transaction_amount: pick('transaction_amount'),
        currency_id: pick('currency_id'),
        collector_id: pick('collector_id'),
        marketplace: pick('marketplace'),
        marketplace_fee: pick('marketplace_fee'),
        application_fee: pick('application_fee'),
        fee_details: pick('fee_details'),
        transaction_details: pick('transaction_details'),
        money_release_date: pick('money_release_date'),
        money_release_status: pick('money_release_status'),
        money_release_schema: pick('money_release_schema'),
        external_reference: pick('external_reference'),
        date_approved: pick('date_approved'),
        live_mode: pick('live_mode'),
      });
      return;
    }

    case 'verify-webhook': {
      const result = verifyWebhookSignature({
        xSignature: option(args, '--x-signature'),
        xRequestId: option(args, '--x-request-id'),
        dataId: option(args, '--data-id'),
        secret: env('MP_WEBHOOK_SECRET'),
      });
      console.log(result);
      process.exitCode = result.valid ? 0 : 1;
      return;
    }

    default:
      console.log('Comandos: gen-key · oauth-url · oauth-exchange · oauth-refresh · preference · payment · verify-webhook');
      console.log('Detalle en la cabecera de apps/api/scripts/mp-spike/cli.ts y en docs/adr/0002-pagos-mercado-pago.md §9.');
  }
}

main().catch((error: unknown) => {
  if (error instanceof MpApiError) {
    console.error(error.message);
    console.error(JSON.stringify(error.body, null, 2));
  } else {
    console.error(error instanceof Error ? error.message : error);
  }
  process.exitCode = 1;
});
