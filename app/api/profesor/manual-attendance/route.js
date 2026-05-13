import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import {
  DISCIPLINE_TYPE_OPTIONS,
  findAcademicGroup,
  findDisciplineByName,
} from "../../../../lib/academicData";
import {
  canAccessProfessorArea,
  getUserRoleFromSession,
} from "../../../../lib/auth";
import {
  ATTENDANCE_EVENT_TYPES,
  ATTENDANCE_REASON_CODES,
  getRequestAuditContext,
  logAttendanceEvent,
} from "../../../../lib/attendanceAudit";
import {
  createStudent,
  findStudentById,
  findStudentByIdentity,
} from "../../../../lib/studentsData";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req) {
  const auditContext = getRequestAuditContext(req);

  try {
    const session = await getServerSession(authOptions);
    const role = getUserRoleFromSession(session);

    if (!session) {
      return new Response(
        JSON.stringify({ error: "Trebuie să fii autentificat." }),
        { status: 401 },
      );
    }

    if (!canAccessProfessorArea(role, session?.user?.email)) {
      return new Response(
        JSON.stringify({ error: "Nu ai acces la această resursă." }),
        { status: 403 },
      );
    }

    const body = await req.json();
    const studentId = String(body.studentId || "").trim();
    const studentName = String(body.studentName || "").trim();
    const studentStudyYear = String(body.studyYear || "").trim();
    const studentGroupCode = String(body.groupCode || "").trim();
    const disciplina = String(body.disciplina || "").trim();
    const tipDisciplina = String(body.tipDisciplina || "").trim();
    const manualSeries = String(body.serie || "").trim().toUpperCase();
    const professorEmail = session.user?.email?.trim().toLowerCase() || null;

    async function rejectRequest(status, errorMessage, reasonCode, extras = {}) {
      await logAttendanceEvent({
        eventType: ATTENDANCE_EVENT_TYPES.SUBMIT_REJECTED,
        status: "rejected",
        reasonCode,
        email: extras.email || null,
        professorEmail,
        disciplineId: extras.disciplineId || null,
        academicGroupId: extras.academicGroupId || null,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
        details: extras.details || {},
      });

      return new Response(JSON.stringify({ error: errorMessage }), { status });
    }

    if ((!studentId && !studentName) || !disciplina || !tipDisciplina) {
      return rejectRequest(
        400,
        "Studentul, disciplina și tipul disciplinei sunt obligatorii.",
        ATTENDANCE_REASON_CODES.MISSING_DATA,
      );
    }

    if (!DISCIPLINE_TYPE_OPTIONS.includes(tipDisciplina)) {
      return rejectRequest(
        400,
        "Tipul disciplinei nu este valid.",
        ATTENDANCE_REASON_CODES.INVALID_DISCIPLINE_TYPE,
      );
    }

    let selectedStudent = studentId ? await findStudentById(studentId) : null;

    if (!selectedStudent) {
      if (!studentName || !studentStudyYear || !studentGroupCode || !manualSeries) {
        return rejectRequest(
          400,
          "Pentru un student nou trebuie completate numele, anul, grupa și seria.",
          ATTENDANCE_REASON_CODES.MISSING_DATA,
        );
      }

      selectedStudent = await findStudentByIdentity({
        fullName: studentName,
        studyYear: studentStudyYear,
        groupCode: studentGroupCode,
        series: manualSeries,
      });

      if (!selectedStudent) {
        try {
          selectedStudent = await createStudent({
            fullName: studentName,
            studyYear: studentStudyYear,
            groupCode: studentGroupCode,
            series: manualSeries,
          });
        } catch (createError) {
          if (createError.code === "23505") {
            return rejectRequest(
              409,
              "Studentul există deja în catalog pentru combinația nume, an, grupă și serie.",
              ATTENDANCE_REASON_CODES.INVALID_STUDENT,
              {
                details: {
                  studentName,
                  studyYear: studentStudyYear,
                  groupCode: studentGroupCode,
                  series: manualSeries,
                },
              },
            );
          }

          throw createError;
        }
      }
    }

    if (!selectedStudent) {
      return rejectRequest(
        400,
        "Studentul selectat nu există în catalog.",
        ATTENDANCE_REASON_CODES.INVALID_STUDENT,
      );
    }

    const effectiveSeries = selectedStudent.series || manualSeries;
    const normalizedStudentEmail = selectedStudent.email?.trim().toLowerCase() || null;

    if (!effectiveSeries) {
      return rejectRequest(
        400,
        "Selectează seria studentului înainte să salvezi prezența.",
        ATTENDANCE_REASON_CODES.INVALID_SERIES,
        {
          email: normalizedStudentEmail,
          details: { studentId: selectedStudent.id },
        },
      );
    }

    const [disciplineRow, academicGroupRow] = await Promise.all([
      findDisciplineByName(disciplina),
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
        {
          email: normalizedStudentEmail,
          details: { studentId: selectedStudent.id },
        },
      );
    }

    if (!academicGroupRow) {
      return rejectRequest(
        400,
        "Combinația an, serie și grupă nu este validă pentru studentul selectat.",
        ATTENDANCE_REASON_CODES.INVALID_ACADEMIC_GROUP,
        {
          email: normalizedStudentEmail,
          disciplineId: disciplineRow.id,
          details: { studentId: selectedStudent.id },
        },
      );
    }

    const now = new Date();
    const submittedAtIso = now.toISOString();
    const dataLocala = now.toLocaleDateString("sv-SE", {
      timeZone: "Europe/Bucharest",
    });
    const oraLocala = now.toLocaleTimeString("it-IT", {
      timeZone: "Europe/Bucharest",
      hour12: false,
    });

    const { data: existingAttendance, error: existingAttendanceError } =
      await supabaseAdmin
        .from("attendance")
        .select("id")
        .eq("student_id", selectedStudent.id)
        .eq("discipline_id", disciplineRow.id)
        .eq("tip_disciplina", tipDisciplina)
        .eq("data", dataLocala)
        .maybeSingle();

    if (existingAttendanceError) {
      console.error(
        "Eroare la verificarea prezenței manuale existente:",
        existingAttendanceError,
      );
      return new Response(
        JSON.stringify({ error: "Eroare server la verificarea prezenței." }),
        { status: 500 },
      );
    }

    if (existingAttendance) {
      return rejectRequest(
        409,
        "Există deja o prezență salvată astăzi pentru acest student, la aceeași disciplină și același tip.",
        ATTENDANCE_REASON_CODES.DUPLICATE_MANUAL_ATTENDANCE,
        {
          email: normalizedStudentEmail,
          disciplineId: disciplineRow.id,
          academicGroupId: academicGroupRow.id,
          details: {
            studentId: selectedStudent.id,
            attendanceId: existingAttendance.id,
          },
        },
      );
    }

    const { data: insertedAttendance, error: insertError } = await supabaseAdmin
      .from("attendance")
      .insert([
        {
          email: normalizedStudentEmail,
          nume: selectedStudent.fullName,
          student_id: selectedStudent.id,
          grupa: selectedStudent.groupCode,
          an: selectedStudent.studyYear,
          serie: effectiveSeries,
          disciplina: disciplineRow.name,
          session_id: null,
          discipline_id: disciplineRow.id,
          academic_group_id: academicGroupRow.id,
          tip_disciplina: tipDisciplina,
          data: dataLocala,
          ora: oraLocala,
          submitted_at: submittedAtIso,
          poza_url: null,
          qr_token: null,
          valid_qr: true,
        },
      ])
      .select("id")
      .single();

    if (insertError) {
      console.error("Eroare la salvarea prezenței manuale:", insertError);
      return new Response(
        JSON.stringify({ error: "Nu am putut salva prezența manuală." }),
        { status: 500 },
      );
    }

    await logAttendanceEvent({
      eventType: ATTENDANCE_EVENT_TYPES.MANUAL_ATTENDANCE_CREATED,
      status: "success",
      attendanceId: insertedAttendance.id,
      email: normalizedStudentEmail,
      professorEmail,
      disciplineId: disciplineRow.id,
      academicGroupId: academicGroupRow.id,
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      details: {
        studentId: selectedStudent.id,
        canonicalName: selectedStudent.fullName,
        tipDisciplina,
        submittedAt: submittedAtIso,
      },
    });

    return new Response(
      JSON.stringify({
        mesaj: "Prezența a fost adăugată manual cu succes.",
        attendance: {
          id: insertedAttendance.id,
          studentId: selectedStudent.id,
          nume: selectedStudent.fullName,
          disciplina: disciplineRow.name,
          tipDisciplina,
          an: selectedStudent.studyYear,
          grupa: selectedStudent.groupCode,
          serie: effectiveSeries,
        },
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Eroare la adăugarea manuală a prezenței:", error);
    await logAttendanceEvent({
      eventType: ATTENDANCE_EVENT_TYPES.SUBMIT_ERROR,
      status: "error",
      reasonCode: ATTENDANCE_REASON_CODES.SERVER_ERROR,
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      details: {
        source: "manual_attendance",
        message: error?.message || "unknown_error",
      },
    });
    return new Response(
      JSON.stringify({ error: "Eroare server la salvarea prezenței." }),
      { status: 500 },
    );
  }
}
