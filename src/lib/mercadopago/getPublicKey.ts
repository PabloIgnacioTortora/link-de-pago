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
    if (!res.ok) return null;
    const data = await res.json();
    return (data.credentials?.public_key as string) ?? null;
  } catch {
    return null;
  }
}
