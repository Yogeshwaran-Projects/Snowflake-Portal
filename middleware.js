// Password gate for the whole portal, run by Vercel Routing Middleware
// before any file is served.
//
// What it does NOT do: user accounts, per-learner passwords, or rate limiting.
// There is ONE shared access password, set in the Vercel dashboard.
//
// Design rules:
//   1. The password and signing secret live ONLY in Vercel env vars
//      (PORTAL_PASSWORD, SESSION_SECRET) — never in this repo.
//   2. Fail closed: if either env var is missing, every page returns 500
//      instead of silently serving the course unprotected.
//   3. The session cookie is signed with the password baked in, so changing
//      PORTAL_PASSWORD signs every existing session out.
//
// Behaviour:
//   GET  /login, no session       → login page
//   GET  /login, valid session    → 303 to /
//   POST /login, right password   → 303 to /, sets sl_session cookie
//   POST /login, wrong password   → 303 to /login?error=1
//   GET  /logout                  → 303 to /login, clears cookie
//   any other path, valid session → served
//   any other path, no session    → 303 to /login
//
// Known limitation: no brute-force throttling. Accepted deliberately — a
// private study portal with a long password; Vercel's own edge protection
// absorbs floods. Use a long random password.

export const config = {
  // /assets/ holds only CSS, JS and the SQL engine, which the login page
  // needs before sign-in. Lesson content lives in /lessons/ and stays gated.
  matcher: ['/((?!assets/|favicon\\.ico).*)'],
};

const COOKIE = 'sl_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export default async function middleware(request) {
  const password = process.env.PORTAL_PASSWORD;
  const secret = process.env.SESSION_SECRET;
  if (!password || !secret) {
    return new Response('Portal is not configured: set PORTAL_PASSWORD and SESSION_SECRET in Vercel.', { status: 500 });
  }

  const { pathname } = new URL(request.url);
  const signedIn = await hasValidSession(request, password, secret);

  if (pathname === '/login' || pathname === '/login.html') {
    if (request.method === 'POST') return handleLogin(request, password, secret);
    return signedIn ? redirect('/') : next();
  }
  if (pathname === '/logout') {
    return redirect('/login', `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  }
  return signedIn ? next() : redirect('/login');
}

// ─────────── login ───────────

async function handleLogin(request, password, secret) {
  let attempt = '';
  try {
    attempt = String((await request.formData()).get('password') || '');
  } catch {
    // Malformed body → treated as a wrong password, never as a crash.
  }
  if (!(await safeEqual(attempt, password, secret))) return redirect('/login?error=1');

  const expires = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const token = `${expires}.${await sign(`v1.${expires}.${password}`, secret)}`;
  return redirect('/', `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}`);
}

async function hasValidSession(request, password, secret) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!match) return false;
  const [expires, sig] = match[1].split('.');
  if (!expires || !sig || !/^\d+$/.test(expires)) return false;
  if (Number(expires) < Math.floor(Date.now() / 1000)) return false;
  return timingSafeEqualHex(sig, await sign(`v1.${expires}.${password}`, secret));
}

// ─────────── crypto helpers ───────────

async function sign(message, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(mac)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Compares HMACs of both strings so the time taken does NOT depend on how
// many leading characters of the password were right.
async function safeEqual(a, b, secret) {
  return timingSafeEqualHex(await sign(a, secret), await sign(b, secret));
}

function timingSafeEqualHex(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ─────────── responses ───────────

function redirect(location, setCookie) {
  const headers = { Location: location, 'Cache-Control': 'no-store' };
  if (setCookie) headers['Set-Cookie'] = setCookie;
  return new Response(null, { status: 303, headers });
}

// Same response @vercel/functions `next()` builds: tells Vercel to continue
// to the static file. Kept inline so the project has zero dependencies.
function next() {
  return new Response(null, { headers: { 'x-middleware-next': '1' } });
}
