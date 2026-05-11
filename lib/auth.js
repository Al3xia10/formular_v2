import { supabaseAdmin } from "./supabaseAdmin";

function getProfessorAllowedEmails() {
  return String(process.env.PROFESSOR_ALLOWED_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isAuthorized(email) {
  const domain = process.env.AUTHORIZED_DOMAIN;
  return email?.endsWith(`@${domain}`);
}

export async function getUserRole(email) {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return "guest";
  }

  const { data, error } = await supabaseAdmin
    .from("app_users")
    .select("role, is_active")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    console.error("Eroare la încărcarea rolului utilizatorului:", error);
  }

  if (data?.is_active && ["student", "professor", "admin"].includes(data.role)) {
    return data.role;
  }

  if (isAuthorized(normalizedEmail)) {
    return "student";
  }

  return "guest";
}

export function canAccessProfessorArea(role, email) {
  const hasProfessorRole = role === "professor" || role === "admin";

  if (!hasProfessorRole) {
    return false;
  }

  const allowedEmails = getProfessorAllowedEmails();

  if (!allowedEmails.length) {
    return true;
  }

  return allowedEmails.includes(String(email || "").trim().toLowerCase());
}

export function getUserRoleFromSession(session) {
  return session?.user?.role || "guest";
}
