export function isAuthorized(email) {
  const domain = process.env.AUTHORIZED_DOMAIN;
  return email?.endsWith(`@${domain}`);
}
