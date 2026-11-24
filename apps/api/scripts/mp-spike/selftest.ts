/**
 * SPIKE BE-07 · Pruebas SIN conexión de las funciones puras de mercadopago.ts.
 *
 *   npm run spike:mp:selftest -w @estudioya/api
 *
 * No llaman a Mercado Pago. Validan nuestro código contra vectores calculados con herramientas
 * independientes (openssl, RFC 7636), no contra sí mismo. Lo que depende de la API real
 * (OAuth, preferencias, pagos, webhooks reales) se prueba con cli.ts y credenciales de prueba.
 */
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import {
  buildAuthorizationUrl,
  buildMarketplacePreference,
  buildSignatureManifest,
  centsToAmount,
  createPkce,
  decryptSecret,
  encryptSecret,
  parseSignatureHeader,
  verifyWebhookSignature,
} from './mercadopago';

const tests: [string, () => void][] = [];
const test = (name: string, fn: () => void) => tests.push([name, fn]);

// ── Dinero y comisión ──────────────────────────────────────────────────
test('centavos → pesos', () => {
  assert.equal(centsToAmount(1_500_000), 15000);
  assert.equal(centsToAmount(850_050), 8500.5);
  assert.throws(() => centsToAmount(10.5));
  assert.throws(() => centsToAmount(-1));
});

test('preferencia con marketplace_fee = 35 % como MONTO (splitAmount de shared)', () => {
  const { body, commissionCents, teacherNetBeforeMpFeeCents } = buildMarketplacePreference({
    bookingId: '0b6f3c9e-0000-4000-8000-000000000001',
    title: 'Clase',
    amountCents: 1_500_000,
  });
  assert.equal(commissionCents, 525_000);
  assert.equal(teacherNetBeforeMpFeeCents, 975_000);
  assert.equal(body.marketplace_fee, 5250);
  assert.equal(body.items[0].unit_price, 15000);
  assert.equal(body.items[0].currency_id, 'ARS');
  assert.equal(body.external_reference, '0b6f3c9e-0000-4000-8000-000000000001');
  assert.equal('expires' in body, false);
});

test('redondeo half-up de la comisión (BR-01)', () => {
  // 35 % de $1,01 = 0,3535 → 35 centavos
  assert.equal(buildMarketplacePreference({ bookingId: 'x', title: 't', amountCents: 101 }).body.marketplace_fee, 0.35);
  // 35 % de $0,10 = 3,5 centavos → 4 (half-up)
  assert.equal(buildMarketplacePreference({ bookingId: 'x', title: 't', amountCents: 10 }).commissionCents, 4);
});

test('preferencia con vencimiento (retención del cupo)', () => {
  const expiresAt = new Date('2026-11-24T15:10:00.000Z');
  const { body } = buildMarketplacePreference({ bookingId: 'x', title: 't', amountCents: 100, expiresAt });
  assert.equal(body.expires, true);
  assert.equal(body.expiration_date_to, '2026-11-24T15:10:00.000Z');
});

// ── OAuth ──────────────────────────────────────────────────────────────
test('PKCE S256: vector del RFC 7636 (apéndice B)', () => {
  const pkce = createPkce('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk');
  assert.equal(pkce.challenge, 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
});

test('URL de autorización con los parámetros documentados', () => {
  const url = new URL(
    buildAuthorizationUrl({
      clientId: '123',
      redirectUri: 'http://localhost:4000/api/v1/payments/oauth/callback',
      state: 'abc',
    }),
  );
  assert.equal(url.origin + url.pathname, 'https://auth.mercadopago.com.ar/authorization');
  assert.equal(url.searchParams.get('client_id'), '123');
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('platform_id'), 'mp');
  assert.equal(url.searchParams.get('state'), 'abc');
  assert.equal(url.searchParams.get('redirect_uri'), 'http://localhost:4000/api/v1/payments/oauth/callback');
  assert.equal(url.searchParams.has('code_challenge'), false);
});

// ── Cifrado de tokens ──────────────────────────────────────────────────
const KEY = randomBytes(32).toString('base64');

test('AES-256-GCM: ida y vuelta, IV distinto en cada cifrado', () => {
  const a = encryptSecret('APP_USR-token-de-prueba', KEY);
  const b = encryptSecret('APP_USR-token-de-prueba', KEY);
  assert.notEqual(a, b);
  assert.ok(!a.includes('APP_USR'));
  assert.equal(decryptSecret(a, KEY), 'APP_USR-token-de-prueba');
});

test('AES-256-GCM: detecta alteraciones y clave incorrecta', () => {
  const enc = encryptSecret('secreto', KEY);
  const parts = enc.split('.');
  const tampered = [...parts.slice(0, 3), Buffer.from('otra-cosa').toString('base64url')].join('.');
  assert.throws(() => decryptSecret(tampered, KEY));
  assert.throws(() => decryptSecret(enc, randomBytes(32).toString('base64')));
  assert.throws(() => encryptSecret('x', randomBytes(16).toString('base64')), /32 bytes/);
  assert.throws(() => encryptSecret('x', undefined), /TOKEN_ENCRYPTION_KEY/);
});

// ── Firma de webhooks ──────────────────────────────────────────────────
// Vectores calculados con: printf '%s' '<manifest>' | openssl dgst -sha256 -hmac '<secreto>'
const SECRET = 'secreto-de-prueba-estudioya';
const REQUEST_ID = 'bb56a2f1-6aae-46ac-982e-9dcd3581d08e';
const TS = '1742505638683';
const V1_WITH_ID = 'c032980cda0a967106015bdaf2c749a5aea1b2e3898a38dc15c1617e9c445449';
const V1_WITHOUT_ID = '4f8318504d2efad01bbe40582c2046364f2b14099ded25107b1ed50d2c6ed7ee';

test('manifest según la plantilla documentada (data.id en minúsculas)', () => {
  assert.equal(
    buildSignatureManifest({ dataId: 'ABC123DEF', requestId: REQUEST_ID, ts: TS }),
    `id:abc123def;request-id:${REQUEST_ID};ts:${TS};`,
  );
  assert.equal(buildSignatureManifest({ requestId: REQUEST_ID, ts: TS }), `request-id:${REQUEST_ID};ts:${TS};`);
});

test('parseo de x-signature (con espacios)', () => {
  assert.deepEqual(parseSignatureHeader(`ts=${TS}, v1=${V1_WITH_ID}`), { ts: TS, v1: V1_WITH_ID });
  assert.deepEqual(parseSignatureHeader(undefined), {});
});

test('firma válida (vector openssl), con data.id en mayúsculas', () => {
  const check = verifyWebhookSignature({
    xSignature: `ts=${TS},v1=${V1_WITH_ID}`,
    xRequestId: REQUEST_ID,
    dataId: 'ABC123DEF',
    secret: SECRET,
  });
  assert.deepEqual(check, { valid: true });
});

test('firma válida sin data.id (segmento omitido)', () => {
  assert.deepEqual(
    verifyWebhookSignature({ xSignature: `ts=${TS},v1=${V1_WITHOUT_ID}`, xRequestId: REQUEST_ID, dataId: undefined, secret: SECRET }),
    { valid: true },
  );
});

test('firmas inválidas', () => {
  const base = { xRequestId: REQUEST_ID, dataId: 'abc123def', secret: SECRET };
  assert.deepEqual(verifyWebhookSignature({ ...base, xSignature: undefined }), { valid: false, reason: 'MISSING_HEADER' });
  assert.deepEqual(verifyWebhookSignature({ ...base, xSignature: `v1=${V1_WITH_ID}` }), { valid: false, reason: 'MALFORMED_HEADER' });
  assert.deepEqual(verifyWebhookSignature({ ...base, xSignature: `ts=${TS},v1=zz` }), { valid: false, reason: 'MALFORMED_HEADER' });
  // Otro pago, otra clave, otro ts o firma truncada → MISMATCH
  assert.deepEqual(verifyWebhookSignature({ ...base, dataId: '999', xSignature: `ts=${TS},v1=${V1_WITH_ID}` }), { valid: false, reason: 'MISMATCH' });
  assert.deepEqual(verifyWebhookSignature({ ...base, secret: 'otra', xSignature: `ts=${TS},v1=${V1_WITH_ID}` }), { valid: false, reason: 'MISMATCH' });
  assert.deepEqual(verifyWebhookSignature({ ...base, xSignature: `ts=1742505638684,v1=${V1_WITH_ID}` }), { valid: false, reason: 'MISMATCH' });
  assert.deepEqual(verifyWebhookSignature({ ...base, xSignature: `ts=${TS},v1=${V1_WITH_ID.slice(0, 32)}` }), { valid: false, reason: 'MISMATCH' });
});

test('ventana anti-reenvío opcional (decisión propia, no documentada por MP)', () => {
  const xSignature = `ts=${TS},v1=${V1_WITH_ID}`;
  const base = { xSignature, xRequestId: REQUEST_ID, dataId: 'abc123def', secret: SECRET, maxAgeMs: 5 * 60_000 };
  assert.deepEqual(verifyWebhookSignature({ ...base, now: Number(TS) + 60_000 }), { valid: true });
  assert.deepEqual(verifyWebhookSignature({ ...base, now: Number(TS) + 10 * 60_000 }), { valid: false, reason: 'STALE' });
});

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    failed++;
    console.error(`✗ ${name}\n  ${error instanceof Error ? error.message : String(error)}`);
  }
}
console.log(`\n${tests.length - failed}/${tests.length} pruebas OK`);
process.exitCode = failed ? 1 : 0;
