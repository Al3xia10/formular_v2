import { supabaseAdmin } from "./supabaseAdmin";

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

export function canAccessProfessorArea(role) {
  return role === "professor" || role === "admin";
}

export function getUserRoleFromSession(session) {
  return session?.user?.role || "guest";
}
