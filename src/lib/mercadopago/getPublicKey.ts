/**
 * Deriva la Public Key de MercadoPago a partir del Access Token
 * llamando a GET /users/me que devuelve las credenciales del usuario.
 */
export async function getMpPublicKey(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[getMpPublicKey] MP API returned ${res.status}: ${body.slice(0, 200)}`);
      return null;
    }
    const data = await res.json();
    const key = (data.credentials?.public_key as string) ?? null;
    if (!key) {
      console.error('[getMpPublicKey] public_key not found in response. Keys:', Object.keys(data));
    }
    return key;
  } catch (err) {
    console.error('[getMpPublicKey] fetch error:', err);
    return null;
  }
}
