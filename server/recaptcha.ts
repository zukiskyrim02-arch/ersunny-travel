/** Confirms a reCAPTCHA v2 token with Google. Fails closed when the secret or token is missing. */
export async function verifyRecaptcha(
  token: string,
  remoteIp?: string,
): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY || "";
  if (!secret || !token.trim()) return false;

  const body = new URLSearchParams({
    secret,
    response: token.trim(),
  });
  if (remoteIp) body.set("remoteip", remoteIp);

  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}
