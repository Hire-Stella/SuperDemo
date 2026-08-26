import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

/**
 * Envelope encryption for tenant-supplied credentials.
 *
 * A Bitrix inbound webhook URL *is* a bearer token, and a Zoho refresh token
 * grants standing access to a client's CRM. One shared database holds several
 * clients' worth of those, so they are not stored in plaintext — a read-only
 * leak of one table should not hand over six companies' CRMs.
 *
 * AES-256-GCM: authenticated, so tampering fails loudly instead of decrypting
 * to nonsense. The key comes from CRM_SECRET_KEY, hashed to 32 bytes so any
 * sufficiently long passphrase works without asking whoever deploys this to
 * generate an exact-length key.
 *
 * What this does NOT do: manage keys. Rotating CRM_SECRET_KEY makes every
 * stored credential undecryptable, and re-encrypting them needs the old key —
 * a real deployment wants KMS here. Recorded in NOT-IMPLEMENTED.md.
 */

const VERSION = 'v1';

function keyFrom(secret: string): Buffer {
  // sha256 rather than a KDF: the input is a machine-generated env secret, not
  // a human password, so there is nothing to slow down a guesser about.
  return createHash('sha256').update(secret).digest();
}

export function encryptSecret(plaintext: string, secret: string): string {
  if (!secret) throw new Error('CRM_SECRET_KEY is not configured');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyFrom(secret), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString('base64url'), tag.toString('base64url'), enc.toString('base64url')].join(
    '.',
  );
}

export function decryptSecret(payload: string, secret: string): string {
  if (!secret) throw new Error('CRM_SECRET_KEY is not configured');
  const [version, iv, tag, data] = payload.split('.');
  if (version !== VERSION || !iv || !tag || !data) {
    throw new Error('Stored credential is not in the expected format');
  }
  const decipher = createDecipheriv('aes-256-gcm', keyFrom(secret), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(data, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

/** Never log a credential; log this instead. */
export function fingerprint(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 8);
}
