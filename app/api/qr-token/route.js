import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { createQrSessionToken } from "../../../lib/qrToken";
import {
  ATTENDANCE_EVENT_TYPES,
  getRequestAuditContext,
  logAttendanceEvent,
} from "../../../lib/attendanceAudit";
import {
  canAccessProfessorArea,
  getUserRoleFromSession,
} from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  const role = getUserRoleFromSession(session);
  const auditContext = getRequestAuditContext(req);

  if (!session) {
    return new Response(
      JSON.stringify({ error: "Trebuie sa fii autentificat." }),
      { status: 401 },
    );
  }

  if (!canAccessProfessorArea(role, session?.user?.email)) {
    return new Response(
      JSON.stringify({ error: "Nu ai acces la generarea codului QR." }),
      { status: 403 },
    );
  }

  const { origin } = new URL(req.url);

  const { token, tokenHash } = createQrSessionToken();
  const professorEmail = session.user.email;
  const startsAtIso = new Date().toISOString();
  const expiresAtIso = new Date(
    Date.now() + 365 * 24 * 60 * 60 * 1000,
  ).toISOString();

  await supabaseAdmin
    .from("attendance_sessions")
    .update({ is_active: false })
    .eq("professor_email", professorEmail)
    .eq("is_active", true)
    .lt("expires_at", new Date().toISOString());

  const { data: insertedSession, error } = await supabaseAdmin
    .from("attendance_sessions")
    .insert([
      {
        token_hash: tokenHash,
        professor_email: professorEmail,
        starts_at: startsAtIso,
        expires_at: expiresAtIso,
        is_active: true,
      },
    ])
    .select("id")
    .single();

  if (error) {
    console.error("Eroare la crearea sesiunii QR:", error);
    return new Response(
      JSON.stringify({ error: "Nu am putut crea sesiunea QR." }),
      { status: 500 },
    );
  }

  await logAttendanceEvent({
    eventType: ATTENDANCE_EVENT_TYPES.QR_SESSION_CREATED,
    status: "info",
    sessionId: insertedSession.id,
    professorEmail,
    ipAddress: auditContext.ipAddress,
    userAgent: auditContext.userAgent,
    details: {
      issuedAt: startsAtIso,
      expiresAt: expiresAtIso,
    },
  });

  const qrLink = `${origin}/scan?token=${encodeURIComponent(token)}`;

  return new Response(
    JSON.stringify({
      token,
      sessionId: insertedSession.id,
      qrLink,
    }),
    { status: 200 },
  );
}
