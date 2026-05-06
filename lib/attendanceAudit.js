import { supabaseAdmin } from "./supabaseAdmin";

export const ATTENDANCE_EVENT_TYPES = {
  QR_SESSION_CREATED: "qr_session_created",
  SUBMIT_ATTEMPT: "submit_attempt",
  SUBMIT_SUCCESS: "submit_success",
  SUBMIT_REJECTED: "submit_rejected",
  SUBMIT_ERROR: "submit_error",
  BULK_DELETE: "bulk_delete",
};

export const ATTENDANCE_REASON_CODES = {
  INVALID_FILE: "invalid_file",
  FILE_TOO_LARGE: "file_too_large",
  MISSING_DATA: "missing_data",
  INVALID_GROUP: "invalid_group",
  INVALID_YEAR: "invalid_year",
  INVALID_SERIES: "invalid_series",
  INVALID_DISCIPLINE_TYPE: "invalid_discipline_type",
  INVALID_DISCIPLINE: "invalid_discipline",
  INVALID_ACADEMIC_GROUP: "invalid_academic_group",
  INVALID_STUDENT: "invalid_student",
  SESSION_LOOKUP_ERROR: "session_lookup_error",
  SESSION_EXPIRED: "session_expired",
  QR_DECODE_FAILED: "qr_decode_failed",
  QR_NOT_DETECTED: "qr_not_detected",
  QR_MISMATCH: "qr_mismatch",
  DUPLICATE_SUBMISSION: "duplicate_submission",
  STORAGE_UPLOAD_ERROR: "storage_upload_error",
  DATABASE_INSERT_ERROR: "database_insert_error",
  SERVER_ERROR: "server_error",
};

export function getRequestAuditContext(req) {
  const forwardedFor = req.headers.get("x-forwarded-for") || "";
  const ipAddress = forwardedFor.split(",")[0]?.trim() || null;

  return {
    ipAddress,
    userAgent: req.headers.get("user-agent") || null,
  };
}

export async function logAttendanceEvent({
  eventType,
  status,
  reasonCode = null,
  sessionId = null,
  attendanceId = null,
  email = null,
  professorEmail = null,
  disciplineId = null,
  academicGroupId = null,
  ipAddress = null,
  userAgent = null,
  details = null,
}) {
  const payload = {
    event_type: eventType,
    status,
    reason_code: reasonCode,
    session_id: sessionId,
    attendance_id: attendanceId,
    email,
    professor_email: professorEmail,
    discipline_id: disciplineId,
    academic_group_id: academicGroupId,
    ip_address: ipAddress,
    user_agent: userAgent,
    details: details || {},
  };

  const { error } = await supabaseAdmin
    .from("attendance_event_logs")
    .insert([payload]);

  if (error) {
    console.error("Eroare la jurnalizarea evenimentului de prezență:", error);
  }
}
