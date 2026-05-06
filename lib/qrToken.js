import crypto from "crypto";

function getQrSecret() {
  return (
    process.env.QR_TOKEN_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "development-qr-secret"
  );
}

export function createQrSessionToken() {
  const token = crypto.randomBytes(24).toString("base64url");

  return {
    token,
    tokenHash: hashQrSessionToken(token),
  };
}

export function hashQrSessionToken(token) {
  return crypto
    .createHmac("sha256", getQrSecret())
    .update(String(token))
    .digest("hex");
}

export function isAttendanceSessionExpired(session, now = Date.now()) {
  const startsAt = new Date(session.starts_at).getTime();
  const expiresAt = new Date(session.expires_at).getTime();

  if (!Number.isFinite(startsAt) || !Number.isFinite(expiresAt)) {
    return true;
  }

  return now < startsAt || now > expiresAt;
}
