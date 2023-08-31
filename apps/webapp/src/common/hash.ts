async function sha256(randomString: string) {
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(randomString);
  const hash = await crypto.subtle.digest('SHA-256', encodedData);
  const bytes = new Uint8Array(hash);

  return Array.from(bytes)
    .map((c) => String.fromCharCode(c))
    .join('');
}

function base64urlencode(str: string) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function dec2hex(dec: number) {
  return ('0' + dec.toString(16)).substr(-2);
}

export function generatePKCEVerifier() {
  const verifierLength = 28;
  const array = new Uint32Array(verifierLength);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec2hex).join('');
}

/**
 * Generates a  sha256 hash in base64url format for a verifier
 */
export async function generatePKCEChallenge(verifier: string) {
  if (typeof crypto === 'undefined') {
    console.warn('WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256.');
    throw Error('not supported browser');
  }
  const hashed = await sha256(verifier);
  return base64urlencode(hashed);
}
