import {
  hashQrSessionToken,
} from "../../../lib/qrToken";
import {
  DISCIPLINE_TYPE_OPTIONS,
  findAcademicGroup,
  findDisciplineByName,
} from "../../../lib/academicData";
import {
  ATTENDANCE_EVENT_TYPES,
  ATTENDANCE_REASON_CODES,
  getRequestAuditContext,
  logAttendanceEvent,
} from "../../../lib/attendanceAudit";
import { findStudentById } from "../../../lib/studentsData";
import { extractQrFromImageBuffer } from "../../../lib/qrDecoder";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function POST(req) {
  const auditContext = getRequestAuditContext(req);

  try {
    const formData = await req.formData();

    const email = formData.get("email");
    const nume = formData.get("nume");
    const grupa = formData.get("grupa");
    const an = formData.get("an");
    const serie = formData.get("serie");
    const disciplina = formData.get("disciplina");
    const tipDisciplina = formData.get("tipDisciplina");
    const studentId = formData.get("studentId");
    const poza = formData.get("poza");
    const qrToken = formData.get("qrToken");
    const normalizedEmail = String(email || "").trim().toLowerCase() || null;

    async function rejectRequest(status, errorMessage, reasonCode, extras = {}) {
      await logAttendanceEvent({
        eventType: ATTENDANCE_EVENT_TYPES.SUBMIT_REJECTED,
        status: "rejected",
        reasonCode,
        email: normalizedEmail,
        sessionId: extras.sessionId || null,
        professorEmail: extras.professorEmail || null,
        disciplineId: extras.disciplineId || null,
        academicGroupId: extras.academicGroupId || null,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
        details: extras.details || {},
      });

      return new Response(JSON.stringify({ error: errorMessage }), { status });
    }

    async function errorResponse(status, errorMessage, reasonCode, extras = {}) {
      await logAttendanceEvent({
        eventType: ATTENDANCE_EVENT_TYPES.SUBMIT_ERROR,
        status: "error",
        reasonCode,
        email: normalizedEmail,
        sessionId: extras.sessionId || null,
        professorEmail: extras.professorEmail || null,
        disciplineId: extras.disciplineId || null,
        academicGroupId: extras.academicGroupId || null,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
        details: extras.details || {},
      });

      return new Response(JSON.stringify({ error: errorMessage }), { status });
    }

    await logAttendanceEvent({
      eventType: ATTENDANCE_EVENT_TYPES.SUBMIT_ATTEMPT,
      status: "info",
      email: normalizedEmail,
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      details: {
        hasToken: Boolean(qrToken),
        fileType: poza instanceof File ? poza.type || null : null,
        fileSize: poza instanceof File ? poza.size : null,
      },
    });

    // Validare suplimentară pentru fișierul poza
    if (!(poza instanceof File)) {
      return rejectRequest(
        400,
        "Fișier invalid",
        ATTENDANCE_REASON_CODES.INVALID_FILE,
      );
    }

    if (poza.size > 2 * 1024 * 1024) {
      return rejectRequest(
        400,
        "Fișier prea mare (max 2MB)",
        ATTENDANCE_REASON_CODES.FILE_TOO_LARGE,
      );
    }

    // Verificare date lipsă
    if (
      !email ||
      !nume ||
      !grupa ||
      !an ||
      !serie ||
      !disciplina ||
      !tipDisciplina ||
      !poza
    ) {
      return rejectRequest(
        400,
        "Date lipsă",
        ATTENDANCE_REASON_CODES.MISSING_DATA,
      );
    }

    // Validare backend: grupa și anul trebuie să fie doar cifre arabe,
    // iar seria trebuie să fie doar litere mari.
    const grupaCurata = String(grupa).trim();
    const anCurat = String(an).trim();
    const serieCurata = String(serie).trim().toUpperCase();

    const disciplinaCurata = String(disciplina).trim();
    const tipDisciplinaCurat = String(tipDisciplina).trim();
    const studentIdCurat = String(studentId || "").trim();

    if (!/^[0-9]+$/.test(grupaCurata)) {
      return rejectRequest(
        400,
        "Grupa trebuie să conțină doar cifre.",
        ATTENDANCE_REASON_CODES.INVALID_GROUP,
      );
    }

    if (!/^[0-9]+$/.test(anCurat)) {
      return rejectRequest(
        400,
        "Anul trebuie să conțină doar cifre.",
        ATTENDANCE_REASON_CODES.INVALID_YEAR,
      );
    }

    if (!/^[A-Z]+$/.test(serieCurata)) {
      return rejectRequest(
        400,
        "Seria trebuie să conțină doar litere mari.",
        ATTENDANCE_REASON_CODES.INVALID_SERIES,
      );
    }

    if (!DISCIPLINE_TYPE_OPTIONS.includes(tipDisciplinaCurat)) {
      return rejectRequest(
        400,
        "Tipul disciplinei nu este valid.",
        ATTENDANCE_REASON_CODES.INVALID_DISCIPLINE_TYPE,
      );
    }

    const selectedStudent = await findStudentById(studentIdCurat);

    if (!selectedStudent) {
      return rejectRequest(
        400,
        "Te rugăm să selectezi studentul din lista afișată.",
        ATTENDANCE_REASON_CODES.INVALID_STUDENT,
      );
    }

    const effectiveSeries = selectedStudent.series || serieCurata;

    const [disciplineRow, academicGroupRow] = await Promise.all([
      findDisciplineByName(disciplinaCurata),
      findAcademicGroup({
        studyYear: selectedStudent.studyYear,
        series: effectiveSeries,
        groupCode: selectedStudent.groupCode,
      }),
    ]);

    if (!disciplineRow) {
      return rejectRequest(
        400,
        "Disciplina selectată nu este validă.",
        ATTENDANCE_REASON_CODES.INVALID_DISCIPLINE,
      );
    }

    if (!academicGroupRow) {
      return rejectRequest(
        400,
        "Combinația an, serie și grupă nu este validă. Verifică dacă ai selectat corect datele.",
        ATTENDANCE_REASON_CODES.INVALID_ACADEMIC_GROUP,
        {
          disciplineId: disciplineRow.id,
          details: {
            studentId: selectedStudent.id,
          },
        },
      );
    }

    // Extragere și verificare QR direct din imagine
    const arrayBuffer = await poza.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let scannedToken = null;

    try {
      scannedToken = extractQrFromImageBuffer(buffer, poza.type || "");
    } catch (decodeError) {
      return rejectRequest(
        400,
        decodeError.message ||
          "Nu am putut citi codul QR din imaginea încărcată.",
        ATTENDANCE_REASON_CODES.QR_DECODE_FAILED,
        {
          disciplineId: disciplineRow.id,
          academicGroupId: academicGroupRow.id,
          details: {
            studentId: selectedStudent.id,
          },
        },
      );
    }

    if (!scannedToken) {
      return rejectRequest(
        403,
        "Codul QR nu a fost detectat în poză",
        ATTENDANCE_REASON_CODES.QR_NOT_DETECTED,
        {
          disciplineId: disciplineRow.id,
          academicGroupId: academicGroupRow.id,
          details: {
            studentId: selectedStudent.id,
          },
        },
      );
    }

    // Dacă tokenul extras este un URL, extrage doar codul qr din el
    let extractedCode = scannedToken;
    if (scannedToken?.startsWith("http")) {
      try {
        const url = new URL(scannedToken);
        extractedCode = url.searchParams.get("token");
      } catch (e) {
        console.log("⚠️ Eroare la parsarea URL-ului:", e);
      }
    }

    const qrTokenValue = String(qrToken || "").trim();
    const scannedQrTokenValue = String(extractedCode || "").trim();

    if (!qrTokenValue && !scannedQrTokenValue) {
      return rejectRequest(
        403,
        "Codul QR este invalid. Te rugăm să rescanezi codul.",
        ATTENDANCE_REASON_CODES.QR_NOT_DETECTED,
        {
          disciplineId: disciplineRow.id,
          academicGroupId: academicGroupRow.id,
          details: {
            studentId: selectedStudent.id,
          },
        },
      );
    }

    if (qrTokenValue && scannedQrTokenValue && scannedQrTokenValue !== qrTokenValue) {
      return rejectRequest(
        403,
        "Codul QR este invalid.",
        ATTENDANCE_REASON_CODES.QR_MISMATCH,
        {
          disciplineId: disciplineRow.id,
          academicGroupId: academicGroupRow.id,
          details: {
            studentId: selectedStudent.id,
          },
        },
      );
    }

    const finalQrTokenValue = qrTokenValue || scannedQrTokenValue;
    const tokenHash = hashQrSessionToken(finalQrTokenValue);
    const { data: attendanceSession, error: attendanceSessionError } =
      await supabaseAdmin
        .from("attendance_sessions")
        .select("id, starts_at, expires_at, is_active, discipline_id")
        .eq("token_hash", tokenHash)
        .maybeSingle();

    if (attendanceSessionError) {
      console.error(
        "Eroare la încărcarea sesiunii de prezență:",
        attendanceSessionError,
      );
      return errorResponse(
        500,
        "Eroare server.",
        ATTENDANCE_REASON_CODES.SESSION_LOOKUP_ERROR,
        {
          disciplineId: disciplineRow.id,
          academicGroupId: academicGroupRow.id,
          details: {
            studentId: selectedStudent.id,
            qrTokenHashPrefix: tokenHash.slice(0, 12),
          },
        },
      );
    }

    if (!attendanceSession || !attendanceSession.is_active) {
      return rejectRequest(
        403,
        "Codul QR este invalid. Te rugăm să rescanezi codul.",
        ATTENDANCE_REASON_CODES.SESSION_EXPIRED,
        {
          sessionId: attendanceSession?.id || null,
          disciplineId: disciplineRow.id,
          academicGroupId: academicGroupRow.id,
          details: {
            studentId: selectedStudent.id,
          },
        },
      );
    }

    const { data: existingAttendance, error: existingAttendanceError } =
      await supabaseAdmin
        .from("attendance")
        .select("id")
        .eq("email", normalizedEmail)
        .eq("session_id", attendanceSession.id)
        .maybeSingle();

    if (existingAttendanceError) {
      console.error(
        "Eroare la verificarea prezenței existente:",
        existingAttendanceError,
      );
      return errorResponse(
        500,
        "Eroare server.",
        ATTENDANCE_REASON_CODES.DATABASE_INSERT_ERROR,
        {
          sessionId: attendanceSession.id,
          disciplineId: disciplineRow.id,
          academicGroupId: academicGroupRow.id,
          details: {
            studentId: selectedStudent.id,
          },
        },
      );
    }

    if (existingAttendance) {
      return rejectRequest(
        409,
        "Prezența ta a fost deja trimisă pentru această sesiune. Nu este nevoie să retrimiți formularul.",
        ATTENDANCE_REASON_CODES.DUPLICATE_SUBMISSION,
        {
          sessionId: attendanceSession.id,
          disciplineId: disciplineRow.id,
          academicGroupId: academicGroupRow.id,
          details: {
            studentId: selectedStudent.id,
          },
        },
      );
    }

    // 🔁 Încarcă poza în Supabase Storage
    const fileName = `${email}_${Date.now()}.jpg`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("prezente")
      .upload(fileName, poza, {
        contentType: poza.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("Eroare la upload:", uploadError);
      return errorResponse(
        500,
        "Eroare la încărcarea pozei",
        ATTENDANCE_REASON_CODES.STORAGE_UPLOAD_ERROR,
        {
          sessionId: attendanceSession.id,
          disciplineId: disciplineRow.id,
          academicGroupId: academicGroupRow.id,
          details: {
            studentId: selectedStudent.id,
          },
        },
      );
    }

    // ✅ Construiește URL-ul imaginii
    const publicURLResponse = supabaseAdmin.storage
      .from("prezente")
      .getPublicUrl(fileName);
    const pozaURL = publicURLResponse.data.publicUrl;

    // 🕒 Obține data și ora locală din România
    const now = new Date();
    const submittedAtIso = now.toISOString();
    const dataLocala = now.toLocaleDateString("sv-SE", {
      timeZone: "Europe/Bucharest",
    }); // format: YYYY-MM-DD
    const oraLocala = now.toLocaleTimeString("it-IT", {
      timeZone: "Europe/Bucharest",
      hour12: false,
    }); // format: HH:MM:SS

    // 🔃 Salvează toate datele, inclusiv poza
    const { data: insertedAttendance, error } = await supabaseAdmin
      .from("attendance")
      .insert([
      {
        email: normalizedEmail,
        nume: selectedStudent.fullName,
        student_id: selectedStudent.id,
        grupa: selectedStudent.groupCode,
        an: selectedStudent.studyYear,
        serie: effectiveSeries,
        disciplina: disciplineRow.name,
        session_id: attendanceSession.id,
        discipline_id: disciplineRow.id,
        academic_group_id: academicGroupRow.id,
        tip_disciplina: tipDisciplinaCurat,
        data: dataLocala,
        ora: oraLocala,
        submitted_at: submittedAtIso,
        poza_url: pozaURL,
        qr_token: finalQrTokenValue,
        valid_qr: true,
      },
    ])
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return rejectRequest(
          409,
          "Prezența ta a fost deja trimisă pentru această sesiune. Nu este nevoie să retrimiți formularul.",
          ATTENDANCE_REASON_CODES.DUPLICATE_SUBMISSION,
          {
            sessionId: attendanceSession.id,
            disciplineId: disciplineRow.id,
            academicGroupId: academicGroupRow.id,
            details: {
              studentId: selectedStudent.id,
            },
          },
        );
      }

      console.error("Eroare la salvare în Supabase:", error);
      return errorResponse(
        500,
        "Eroare la salvarea datelor",
        ATTENDANCE_REASON_CODES.DATABASE_INSERT_ERROR,
        {
          sessionId: attendanceSession.id,
          disciplineId: disciplineRow.id,
          academicGroupId: academicGroupRow.id,
          details: {
            studentId: selectedStudent.id,
          },
        },
      );
    }

    await logAttendanceEvent({
      eventType: ATTENDANCE_EVENT_TYPES.SUBMIT_SUCCESS,
      status: "success",
      sessionId: attendanceSession.id,
      attendanceId: insertedAttendance.id,
      email: normalizedEmail,
      disciplineId: disciplineRow.id,
      academicGroupId: academicGroupRow.id,
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      details: {
        studentId: selectedStudent.id,
        canonicalName: selectedStudent.fullName,
        submittedAt: submittedAtIso,
      },
    });

    return new Response(
      JSON.stringify({ mesaj: "Prezența a fost salvată cu succes!" }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Eroare server:", error.stack || error);
    await logAttendanceEvent({
      eventType: ATTENDANCE_EVENT_TYPES.SUBMIT_ERROR,
      status: "error",
      reasonCode: ATTENDANCE_REASON_CODES.SERVER_ERROR,
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      details: {
        message: error?.message || "unknown_error",
      },
    });
    return new Response(JSON.stringify({ error: "Eroare server" }), {
      status: 500,
    });
  }
}
