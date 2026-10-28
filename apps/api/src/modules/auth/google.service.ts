import { createHash, randomBytes } from 'node:crypto';
import { UserModel } from '../../models/User';
import { toUserDTO } from './auth.service';
import type { SignInOutcome } from './passwordless.service';

const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/** The browser-bound secrets for one round trip: `state` against forged callbacks, `verifier` for PKCE. */
export function newRoundTrip() {
  const verifier = randomBytes(32).toString('base64url');
  return {
    state: randomBytes(16).toString('base64url'),
    verifier,
    challenge: createHash('sha256').update(verifier).digest('base64url'),
  };
}

export function authorizeUrl(google: GoogleConfig, state: string, challenge: string) {
  const params = new URLSearchParams({
    client_id: google.clientId,
    redirect_uri: google.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  });
  return `${AUTHORIZE_URL}?${params}`;
}

interface GoogleIdentity {
  sub: string;
  email: string;
  name?: string;
}

/**
 * Trades the one-time code for an ID token. The token comes straight from Google over TLS,
 * authenticated by our client secret, so its claims are checked but its signature needn't be.
 */
async function exchange(google: GoogleConfig, code: string, verifier: string, now: Date): Promise<GoogleIdentity | null> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: google.clientId,
      client_secret: google.clientSecret,
      redirect_uri: google.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
  });
  if (!res.ok) return null;
  const { id_token: idToken } = (await res.json()) as { id_token?: string };
  const payload = idToken?.split('.')[1];
  if (!payload) return null;

  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>;
  const valid =
    claims.aud === google.clientId &&
    ISSUERS.has(String(claims.iss)) &&
    typeof claims.exp === 'number' &&
    claims.exp * 1000 > now.getTime() &&
    claims.email_verified === true &&
    typeof claims.sub === 'string' &&
    typeof claims.email === 'string';
  if (!valid) return null;
  return {
    sub: claims.sub as string,
    email: (claims.email as string).toLowerCase(),
    name: typeof claims.name === 'string' ? claims.name : undefined,
  };
}

/**
 * Signs in the account already linked to this Google account, or the account with the same
 * (Google-verified) email, linking it; otherwise starts a newcomer's draft.
 */
export async function signInWithGoogle(
  google: GoogleConfig,
  code: string,
  verifier: string,
  now: Date = new Date(),
): Promise<SignInOutcome | null> {
  const identity = await exchange(google, code, verifier, now);
  if (!identity) return null;

  const linked = await UserModel.findOne({ googleId: identity.sub }).lean();
  if (linked) return { user: toUserDTO(linked) };

  const byEmail = await UserModel.findOneAndUpdate(
    { email: identity.email, googleId: { $exists: false } },
    { $set: { googleId: identity.sub } },
    { new: true },
  ).lean();
  if (byEmail) return { user: toUserDTO(byEmail) };

  return { draft: { email: identity.email, emailVerified: true, name: identity.name, googleId: identity.sub } };
}
