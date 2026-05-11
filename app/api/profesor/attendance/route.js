import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { canAccessProfessorArea, getUserRoleFromSession } from "../../../../lib/auth";
import {
  ATTENDANCE_EVENT_TYPES,
  logAttendanceEvent,
} from "../../../../lib/attendanceAudit";
import { fetchAcademicOptions } from "../../../../lib/academicData";
import {
  buildStudentsLookup,
  fetchStudentsForScope,
  resolveAttendanceStudent,
} from "../../../../lib/studentsData";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

const ATTENDANCE_COLUMNS =
  "id, email, nume, grupa, an, serie, disciplina, tip_disciplina, data, ora, poza_url, qr_token, valid_qr, session_id, discipline_id, academic_group_id, submitted_at";

const ACTIVE_SESSION_COLUMNS =
  "id, professor_email, starts_at, expires_at, is_active, created_at";
const ATTENDANCE_LOG_COLUMNS =
  "id, created_at, event_type, status, reason_code, session_id, email, professor_email, details";

const ALLOWED_SORT_VALUES = new Set([
  "name-asc",
  "name-desc",
  "total-desc",
  "total-asc",
  "date-desc",
  "date-asc",
]);

function getSafePositiveNumber(value, fallback, max) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 1) {
    return fallback;
  }

  return Math.min(Math.floor(number), max);
}

function getSafeSortValue(value) {
  return ALLOWED_SORT_VALUES.has(value) ? value : "name-asc";
}

function formatSessionLabel(sessionRow) {
  if (!sessionRow?.starts_at) {
    return "Sesiune QR";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Europe/Bucharest",
  }).format(new Date(sessionRow.starts_at));
}

function toComparableDateValue(value) {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 10);
}

function chunkArray(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function applyBaseFilters(query, search) {
  let nextQuery = query.eq("valid_qr", true);

  if (search) {
    nextQuery = nextQuery.or(`nume.ilike.%${search}%,email.ilike.%${search}%`);
  }

  return nextQuery;
}

async function fetchAttendanceRows({ search }) {
  const pageSize = 1000;
  let from = 0;
  let allRows = [];

  while (true) {
    const baseQuery = supabaseAdmin
      .from("attendance")
      .select(ATTENDANCE_COLUMNS)
      .order("data", { ascending: false })
      .order("ora", { ascending: false })
      .range(from, from + pageSize - 1);

    const { data, error } = await applyBaseFilters(baseQuery, search);

    if (error) {
      throw error;
    }

    const rows = data || [];
    allRows = allRows.concat(rows);

    if (rows.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return allRows;
}

async function fetchSessionRowsByIds(sessionIds) {
  if (!sessionIds.length) {
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("attendance_sessions")
    .select(ACTIVE_SESSION_COLUMNS)
    .in("id", sessionIds);

  if (error) {
    throw error;
  }

  return data || [];
}

async function fetchAttendanceBySessionId(sessionId) {
  if (!sessionId) {
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("attendance")
    .select(ATTENDANCE_COLUMNS)
    .eq("valid_qr", true)
    .eq("session_id", sessionId)
    .order("data", { ascending: false })
    .order("ora", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

async function fetchAttendanceBySessionIds(sessionIds) {
  if (!sessionIds.length) {
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("attendance")
    .select(ATTENDANCE_COLUMNS)
    .eq("valid_qr", true)
    .in("session_id", sessionIds)
    .order("data", { ascending: false })
    .order("ora", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

async function fetchRecentSessionsForProfessor(professorEmail) {
  const { data, error } = await supabaseAdmin
    .from("attendance_sessions")
    .select(ACTIVE_SESSION_COLUMNS)
    .eq("professor_email", professorEmail)
    .order("starts_at", { ascending: false })
    .limit(12);

  if (error) {
    throw error;
  }

  return data || [];
}

async function fetchAttendanceLogsBySessionIds(sessionIds) {
  if (!sessionIds.length) {
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("attendance_event_logs")
    .select(ATTENDANCE_LOG_COLUMNS)
    .in("session_id", sessionIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

async function fetchActiveSessionForProfessor(professorEmail) {
  const { data, error } = await supabaseAdmin
    .from("attendance_sessions")
    .select(ACTIVE_SESSION_COLUMNS)
    .eq("professor_email", professorEmail)
    .eq("is_active", true)
    .gte("expires_at", new Date().toISOString())
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

function normalizeAttendance(
  attendanceRows,
  { disciplineRows, academicGroups, sessionRows, studentsLookup },
) {
  const disciplinesById = new Map(
    disciplineRows.map((item) => [item.id, item.name]),
  );
  const groupsById = new Map(
    academicGroups.map((item) => [
      item.id,
      {
        an: item.study_year,
        serie: item.series,
        grupa: item.group_code,
      },
    ]),
  );
  const sessionsById = new Map(
    sessionRows.map((item) => [
      item.id,
      {
        ...item,
        label: formatSessionLabel(item),
      },
    ]),
  );

  return attendanceRows.map((item) => {
    const group = groupsById.get(item.academic_group_id);
    const canonicalStudent = resolveAttendanceStudent(item, studentsLookup);
    const normalizedDisciplina =
      disciplinesById.get(item.discipline_id) || item.disciplina || "";
    const normalizedAn =
      canonicalStudent?.studyYear || group?.an || item.an || "";
    const normalizedSerie =
      canonicalStudent?.series || group?.serie || item.serie || "";
    const normalizedGrupa =
      canonicalStudent?.groupCode || group?.grupa || item.grupa || "";
    const session = sessionsById.get(item.session_id);

    return {
      ...item,
      nume: canonicalStudent?.fullName || item.nume,
      disciplina: normalizedDisciplina,
      an: normalizedAn,
      serie: normalizedSerie,
      grupa: normalizedGrupa,
      sessionLabel: session?.label || "",
      sessionStartsAt: session?.starts_at || null,
      comparableDate: toComparableDateValue(item.data),
      effectiveTimestamp:
        item.submitted_at ||
        (item.data && item.ora ? `${item.data}T${item.ora}` : item.data || ""),
    };
  });
}

function buildFilterOptions(attendance) {
  const sessionEntries = new Map();

  attendance.forEach((item) => {
    if (item.session_id && item.sessionLabel && !sessionEntries.has(item.session_id)) {
      sessionEntries.set(item.session_id, {
        id: item.session_id,
        label: item.sessionLabel,
        startsAt: item.sessionStartsAt,
      });
    }
  });

  return {
    discipline: [
      ...new Set(attendance.map((item) => item.disciplina).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b, "ro")),
    grupa: [...new Set(attendance.map((item) => item.grupa).filter(Boolean))].sort(
      (a, b) => Number(a) - Number(b),
    ),
    an: [...new Set(attendance.map((item) => item.an).filter(Boolean))].sort(
      (a, b) => Number(a) - Number(b),
    ),
    serie: [...new Set(attendance.map((item) => item.serie).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b, "ro"),
    ),
    session: [...sessionEntries.values()].sort((a, b) =>
      String(b.startsAt || "").localeCompare(String(a.startsAt || "")),
    ),
  };
}

function filterAttendance(attendance, filters) {
  return attendance.filter((item) => {
    const matchesDisciplina = filters.resultDisciplina
      ? item.disciplina === filters.resultDisciplina
      : true;
    const matchesGrupa = filters.resultGrupa ? item.grupa === filters.resultGrupa : true;
    const matchesAn = filters.resultAn ? item.an === filters.resultAn : true;
    const matchesSerie = filters.resultSerie ? item.serie === filters.resultSerie : true;
    const matchesSession = filters.resultSessionId
      ? item.session_id === filters.resultSessionId
      : true;
    const matchesDateFrom = filters.resultDateFrom
      ? item.comparableDate >= filters.resultDateFrom
      : true;
    const matchesDateTo = filters.resultDateTo
      ? item.comparableDate <= filters.resultDateTo
      : true;

    return (
      matchesDisciplina &&
      matchesGrupa &&
      matchesAn &&
      matchesSerie &&
      matchesSession &&
      matchesDateFrom &&
      matchesDateTo
    );
  });
}

function buildStudentKey(item) {
  return item.email || item.nume || "student-necunoscut";
}

function groupAttendanceByStudent(attendance) {
  return attendance.reduce((groups, item) => {
    const key = buildStudentKey(item);

    if (!groups[key]) {
      groups[key] = {
        email: item.email,
        nume: item.nume || "Student fara nume",
        grupa: item.grupa,
        an: item.an,
        serie: item.serie,
        attendance: [],
      };
    }

    groups[key].attendance.push(item);
    return groups;
  }, {});
}

function getAttendanceMoment(item) {
  return item?.effectiveTimestamp || `${item?.data || ""}T${item?.ora || ""}`;
}

function sortGroupedStudents(students, sortBy) {
  return students.sort((a, b) => {
    if (sortBy === "name-desc") {
      return b.nume.localeCompare(a.nume, "ro");
    }

    if (sortBy === "total-desc") {
      return b.attendance.length - a.attendance.length;
    }

    if (sortBy === "total-asc") {
      return a.attendance.length - b.attendance.length;
    }

    if (sortBy === "date-desc") {
      return getAttendanceMoment(b.attendance[0]).localeCompare(
        getAttendanceMoment(a.attendance[0]),
      );
    }

    if (sortBy === "date-asc") {
      return getAttendanceMoment(a.attendance[0]).localeCompare(
        getAttendanceMoment(b.attendance[0]),
      );
    }

    return a.nume.localeCompare(b.nume, "ro");
  });
}

function buildDisciplineTotals(attendance) {
  const totals = attendance.reduce((accumulator, item) => {
    const key = item.disciplina || "Fără disciplină";

    if (!accumulator[key]) {
      accumulator[key] = {
        disciplina: key,
        attendanceCount: 0,
        students: new Set(),
      };
    }

    accumulator[key].attendanceCount += 1;
    if (item.email) {
      accumulator[key].students.add(item.email);
    }

    return accumulator;
  }, {});

  return Object.values(totals)
    .map((item) => ({
      disciplina: item.disciplina,
      attendanceCount: item.attendanceCount,
      studentCount: item.students.size,
    }))
    .sort((a, b) => {
      if (b.attendanceCount !== a.attendanceCount) {
        return b.attendanceCount - a.attendanceCount;
      }

      return a.disciplina.localeCompare(b.disciplina, "ro");
    });
}

function buildActiveSessionPayload(activeSession, attendance) {
  if (!activeSession) {
    return null;
  }

  const groupedStudents = Object.values(groupAttendanceByStudent(attendance)).sort((a, b) =>
    a.nume.localeCompare(b.nume, "ro"),
  );

  return {
    id: activeSession.id,
    label: formatSessionLabel(activeSession),
    startsAt: activeSession.starts_at,
    expiresAt: activeSession.expires_at,
    attendanceCount: attendance.length,
    studentCount: groupedStudents.length,
    students: groupedStudents.map((student) => ({
      email: student.email,
      nume: student.nume,
      grupa: student.grupa,
      an: student.an,
      serie: student.serie,
      attendanceCount: student.attendance.length,
    })),
  };
}

function buildSessionInsights(sessionRows, attendanceRows, eventLogs) {
  const attendanceBySession = attendanceRows.reduce((accumulator, item) => {
    if (!item.session_id) {
      return accumulator;
    }

    if (!accumulator[item.session_id]) {
      accumulator[item.session_id] = [];
    }

    accumulator[item.session_id].push(item);
    return accumulator;
  }, {});

  const logsBySession = eventLogs.reduce((accumulator, item) => {
    if (!item.session_id) {
      return accumulator;
    }

    if (!accumulator[item.session_id]) {
      accumulator[item.session_id] = [];
    }

    accumulator[item.session_id].push(item);
    return accumulator;
  }, {});

  const sessionStats = sessionRows.map((sessionRow) => {
    const sessionAttendance = attendanceBySession[sessionRow.id] || [];
    const sessionLogs = logsBySession[sessionRow.id] || [];
    const expiresAt = new Date(sessionRow.expires_at).getTime();
    const finalWindowStartsAt = expiresAt - 5000;
    const lateSuccessCount = sessionAttendance.filter((item) => {
      const submittedAt = new Date(item.submitted_at || item.effectiveTimestamp).getTime();
      return Number.isFinite(submittedAt) && submittedAt >= finalWindowStartsAt;
    }).length;
    const rejectedCount = sessionLogs.filter((item) => item.status === "rejected").length;
    const duplicateCount = sessionLogs.filter(
      (item) => item.reason_code === "duplicate_submission",
    ).length;
    const invalidQrCount = sessionLogs.filter((item) =>
      ["session_expired", "qr_not_detected", "qr_mismatch", "qr_decode_failed"].includes(
        item.reason_code,
      ),
    ).length;

    return {
      id: sessionRow.id,
      label: formatSessionLabel(sessionRow),
      startsAt: sessionRow.starts_at,
      expiresAt: sessionRow.expires_at,
      attendanceCount: sessionAttendance.length,
      rejectedCount,
      duplicateCount,
      invalidQrCount,
      lateSuccessCount,
    };
  });

  const suspiciousSignals = [];

  sessionStats.forEach((item) => {
    if (item.rejectedCount >= 4) {
      suspiciousSignals.push({
        sessionId: item.id,
        label: item.label,
        severity: "medium",
        message: `${item.rejectedCount} încercări respinse în aceeași sesiune.`,
      });
    }

    if (item.duplicateCount >= 2) {
      suspiciousSignals.push({
        sessionId: item.id,
        label: item.label,
        severity: "medium",
        message: `${item.duplicateCount} încercări duplicate detectate.`,
      });
    }

    if (item.attendanceCount >= 5 && item.lateSuccessCount / item.attendanceCount >= 0.6) {
      suspiciousSignals.push({
        sessionId: item.id,
        label: item.label,
        severity: "high",
        message: `${item.lateSuccessCount} din ${item.attendanceCount} prezențe au fost trimise în ultimele 5 secunde.`,
      });
    }
  });

  return {
    recentSessionStats: sessionStats,
    suspiciousSignals: suspiciousSignals.slice(0, 6),
  };
}

function getProfesorAttendanceFilters(searchParams) {
  return {
    search: searchParams.get("search")?.trim() || "",
    disciplina: searchParams.get("disciplina")?.trim() || "",
    resultDisciplina: searchParams.get("resultDisciplina")?.trim() || "",
    resultGrupa: searchParams.get("resultGrupa")?.trim() || "",
    resultAn: searchParams.get("resultAn")?.trim() || "",
    resultSerie: searchParams.get("resultSerie")?.trim() || "",
    resultSessionId: searchParams.get("resultSessionId")?.trim() || "",
    resultDateFrom: toComparableDateValue(
      searchParams.get("resultDateFrom")?.trim() || "",
    ),
    resultDateTo: toComparableDateValue(
      searchParams.get("resultDateTo")?.trim() || "",
    ),
    sortBy: getSafeSortValue(searchParams.get("sortBy")?.trim() || ""),
    exportAll: searchParams.get("exportAll") === "1",
  };
}

function getStoragePathFromPublicUrl(url) {
  if (!url) {
    return null;
  }

  const marker = "/storage/v1/object/public/prezente/";
  const markerIndex = url.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  return decodeURIComponent(url.slice(markerIndex + marker.length));
}

export async function GET(req) {
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

    const { searchParams } = new URL(req.url);
    const {
      search,
      disciplina,
      resultDisciplina,
      resultGrupa,
      resultAn,
      resultSerie,
      resultSessionId,
      resultDateFrom,
      resultDateTo,
      sortBy,
      exportAll,
    } = getProfesorAttendanceFilters(searchParams);

    const requestedPage = getSafePositiveNumber(
      searchParams.get("page"),
      1,
      100000,
    );
    const pageSize = getSafePositiveNumber(
      searchParams.get("pageSize"),
      100,
      200,
    );

    const academicOptions = await fetchAcademicOptions();
    const [attendanceRows, activeSession, recentSessions] = await Promise.all([
      fetchAttendanceRows({
        search,
      }),
      fetchActiveSessionForProfessor(session.user.email),
      fetchRecentSessionsForProfessor(session.user.email),
    ]);

    const [activeSessionAttendanceRows, recentSessionAttendanceRawRows] =
      await Promise.all([
        fetchAttendanceBySessionId(activeSession?.id),
        fetchAttendanceBySessionIds(recentSessions.map((item) => item.id)),
      ]);

    const sessionIds = [
      ...new Set(
        attendanceRows
          .concat(activeSessionAttendanceRows)
          .map((item) => item.session_id)
          .concat(activeSession?.id ? [activeSession.id] : [])
          .filter(Boolean),
      ),
    ];
    const sessionRows = await fetchSessionRowsByIds(sessionIds);
    const attendanceLogs = await fetchAttendanceLogsBySessionIds(
      recentSessions.map((item) => item.id),
    );
    const studentsLookup = buildStudentsLookup(
      await fetchStudentsForScope({
        studyYears: [
          ...new Set(
            attendanceRows
              .concat(activeSessionAttendanceRows)
              .concat(recentSessionAttendanceRawRows)
              .map((item) => item.an)
              .filter(Boolean),
          ),
        ],
        groupCodes: [
          ...new Set(
            attendanceRows
              .concat(activeSessionAttendanceRows)
              .concat(recentSessionAttendanceRawRows)
              .map((item) => item.grupa)
              .filter(Boolean),
          ),
        ],
      }),
    );

    const normalizedAttendance = normalizeAttendance(attendanceRows, {
      disciplineRows: academicOptions.disciplineRows,
      academicGroups: academicOptions.academicGroups,
      sessionRows,
      studentsLookup,
    });
    const normalizedActiveSessionAttendance = normalizeAttendance(
      activeSessionAttendanceRows,
      {
        disciplineRows: academicOptions.disciplineRows,
        academicGroups: academicOptions.academicGroups,
        sessionRows,
        studentsLookup,
      },
    );
    const recentSessionAttendanceRows = normalizeAttendance(
      recentSessionAttendanceRawRows,
      {
        disciplineRows: academicOptions.disciplineRows,
        academicGroups: academicOptions.academicGroups,
        sessionRows,
        studentsLookup,
      },
    );
    const sessionInsights = buildSessionInsights(
      recentSessions,
      recentSessionAttendanceRows,
      attendanceLogs,
    );

    const searchedAttendance = disciplina
      ? normalizedAttendance.filter((item) => item.disciplina === disciplina)
      : normalizedAttendance;

    const filterOptions = buildFilterOptions(searchedAttendance);
    const filteredAttendance = filterAttendance(searchedAttendance, {
      resultDisciplina,
      resultGrupa,
      resultAn,
      resultSerie,
      resultSessionId,
      resultDateFrom,
      resultDateTo,
    });

    const groupedStudents = sortGroupedStudents(
      Object.values(groupAttendanceByStudent(filteredAttendance)),
      sortBy,
    );

    const totalStudents = groupedStudents.length;
    const totalAttendanceCount = filteredAttendance.length;
    const baseAttendanceCount = searchedAttendance.length;
    const totalPages = Math.max(1, Math.ceil(totalStudents / pageSize));
    const page = Math.min(requestedPage, totalPages);
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    const students = exportAll ? groupedStudents : groupedStudents.slice(from, to);
    const pageAttendanceCount = students.reduce(
      (count, student) => count + student.attendance.length,
      0,
    );

    return new Response(
      JSON.stringify({
        students,
        filterOptions,
        page,
        pageSize,
        totalPages,
        hasMore: page < totalPages,
        totalStudents,
        totalAttendanceCount,
        baseAttendanceCount,
        pageStudentCount: students.length,
        pageAttendanceCount,
        exportAttendance: exportAll ? filteredAttendance : [],
        disciplineTotals: buildDisciplineTotals(filteredAttendance).slice(0, 6),
        activeSession: buildActiveSessionPayload(
          activeSession,
          normalizedActiveSessionAttendance,
        ),
        recentSessionStats: sessionInsights.recentSessionStats,
        suspiciousSignals: sessionInsights.suspiciousSignals,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Eroare la încărcarea prezențelor profesorului:", error);
    return new Response(
      JSON.stringify({ error: "Nu am putut încărca prezențele." }),
      { status: 500 },
    );
  }
}

export async function DELETE(req) {
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

    const { searchParams } = new URL(req.url);
    const {
      search,
      disciplina,
      resultDisciplina,
      resultGrupa,
      resultAn,
      resultSerie,
      resultSessionId,
      resultDateFrom,
      resultDateTo,
    } = getProfesorAttendanceFilters(searchParams);
    const academicOptions = await fetchAcademicOptions();
    const attendanceRows = await fetchAttendanceRows({
      search,
    });
    const sessionIds = [
      ...new Set(attendanceRows.map((item) => item.session_id).filter(Boolean)),
    ];
    const sessionRows = await fetchSessionRowsByIds(sessionIds);
    const studentsLookup = buildStudentsLookup(
      await fetchStudentsForScope({
        studyYears: [...new Set(attendanceRows.map((item) => item.an).filter(Boolean))],
        groupCodes: [...new Set(attendanceRows.map((item) => item.grupa).filter(Boolean))],
      }),
    );
    const normalizedAttendance = normalizeAttendance(attendanceRows, {
      disciplineRows: academicOptions.disciplineRows,
      academicGroups: academicOptions.academicGroups,
      sessionRows,
      studentsLookup,
    });
    const searchedAttendance = disciplina
      ? normalizedAttendance.filter((item) => item.disciplina === disciplina)
      : normalizedAttendance;
    const filteredAttendance = filterAttendance(searchedAttendance, {
      resultDisciplina,
      resultGrupa,
      resultAn,
      resultSerie,
      resultSessionId,
      resultDateFrom,
      resultDateTo,
    });

    if (!filteredAttendance.length) {
      return new Response(
        JSON.stringify({
          deletedAttendanceCount: 0,
          deletedImageCount: 0,
        }),
        { status: 200 },
      );
    }

    const attendanceIds = filteredAttendance.map((item) => item.id).filter(Boolean);
    const storagePaths = [
      ...new Set(
        filteredAttendance
          .map((item) => getStoragePathFromPublicUrl(item.poza_url))
          .filter(Boolean),
      ),
    ];

    let deletedImageCount = 0;

    for (const pathChunk of chunkArray(storagePaths, 100)) {
      const { data, error } = await supabaseAdmin.storage
        .from("prezente")
        .remove(pathChunk);

      if (error) {
        console.error("Eroare la ștergerea pozelor din storage:", error);
      } else {
        deletedImageCount += data?.length || 0;
      }
    }

    for (const idChunk of chunkArray(attendanceIds, 500)) {
      const { error } = await supabaseAdmin
        .from("attendance")
        .delete()
        .in("id", idChunk);

      if (error) {
        console.error("Eroare la ștergerea prezențelor:", error);
        return new Response(
          JSON.stringify({ error: "Nu am putut șterge prezențele selectate." }),
          { status: 500 },
        );
      }
    }

    await logAttendanceEvent({
      eventType: ATTENDANCE_EVENT_TYPES.BULK_DELETE,
      status: "info",
      professorEmail: session.user.email,
      details: {
        action: "bulk_delete_attendance",
        deletedAttendanceCount: attendanceIds.length,
        deletedImageCount,
        filters: {
          search,
          disciplina,
          resultDisciplina,
          resultGrupa,
          resultAn,
          resultSerie,
          resultSessionId,
          resultDateFrom,
          resultDateTo,
        },
      },
    });

    return new Response(
      JSON.stringify({
        deletedAttendanceCount: attendanceIds.length,
        deletedImageCount,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Eroare la ștergerea prezențelor profesorului:", error);
    return new Response(
      JSON.stringify({ error: "Nu am putut șterge prezențele." }),
      { status: 500 },
    );
  }
}
