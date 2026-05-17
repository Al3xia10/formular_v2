import { supabaseAdmin } from "./supabaseAdmin";
import {
  buildExactStudentKey,
  buildLooseStudentKey,
} from "./studentAttendanceMatching";
import {
  parseStudentObservations,
  summarizeStudentObservations,
} from "./studentObservations";

function mapStudentRow(student) {
  const observations = parseStudentObservations(student.observation);

  return {
    id: student.id,
    fullName: student.full_name,
    email: student.email,
    observation: summarizeStudentObservations(observations),
    observations,
    studyYear: student.study_year,
    series: student.series || "",
    groupCode: student.group_code,
  };
}

function normalizeStudentSearchTerm(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function buildStudentSearchName(value) {
  return normalizeStudentSearchTerm(value);
}

export function buildStudentsLookup(students) {
  const byId = new Map();
  const byExactKey = new Map();
  const byLooseKey = new Map();

  for (const student of students) {
    byId.set(student.id, student);

    const exactKey = buildExactStudentKey({
      fullName: student.fullName,
      studyYear: student.studyYear,
      groupCode: student.groupCode,
    });
    if (!byExactKey.has(exactKey)) {
      byExactKey.set(exactKey, student);
    }

    const looseKey = buildLooseStudentKey({
      fullName: student.fullName,
      studyYear: student.studyYear,
      groupCode: student.groupCode,
    });
    if (!byLooseKey.has(looseKey)) {
      byLooseKey.set(looseKey, student);
    }
  }

  return {
    byId,
    byExactKey,
    byLooseKey,
  };
}

export function resolveAttendanceStudent(attendanceRow, studentsLookup) {
  if (!studentsLookup) {
    return null;
  }

  if (attendanceRow.student_id && studentsLookup.byId.has(attendanceRow.student_id)) {
    return studentsLookup.byId.get(attendanceRow.student_id);
  }

  const exactKey = buildExactStudentKey({
    fullName: attendanceRow.nume,
    studyYear: attendanceRow.an,
    groupCode: attendanceRow.grupa,
  });

  if (studentsLookup.byExactKey.has(exactKey)) {
    return studentsLookup.byExactKey.get(exactKey);
  }

  const looseKey = buildLooseStudentKey({
    fullName: attendanceRow.nume,
    studyYear: attendanceRow.an,
    groupCode: attendanceRow.grupa,
  });

  return studentsLookup.byLooseKey.get(looseKey) || null;
}

export async function fetchStudentsForScope({
  studyYears = [],
  groupCodes = [],
} = {}) {
  let query = supabaseAdmin
    .from("students")
    .select("id, full_name, email, observation, study_year, series, group_code")
    .eq("is_active", true)
    .order("study_year", { ascending: true })
    .order("group_code", { ascending: true })
    .order("series", { ascending: true })
    .order("full_name", { ascending: true });

  if (studyYears.length) {
    query = query.in("study_year", studyYears);
  }

  if (groupCodes.length) {
    query = query.in("group_code", groupCodes);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []).map(mapStudentRow);
}

export async function findStudentById(studentId) {
  if (!studentId) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("students")
    .select("id, full_name, email, observation, study_year, series, group_code")
    .eq("id", studentId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapStudentRow(data) : null;
}

export async function findStudentByEmail(email) {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("students")
    .select("id, full_name, email, observation, study_year, series, group_code")
    .eq("email", normalizedEmail)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapStudentRow(data) : null;
}

export async function findStudentByIdentity({
  fullName,
  studyYear,
  series,
  groupCode,
}) {
  const normalizedName = String(fullName || "").trim();
  const normalizedStudyYear = String(studyYear || "").trim();
  const normalizedSeries = String(series || "").trim().toUpperCase();
  const normalizedGroupCode = String(groupCode || "").trim();

  if (
    !normalizedName ||
    !normalizedStudyYear ||
    !normalizedSeries ||
    !normalizedGroupCode
  ) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("students")
    .select("id, full_name, email, observation, study_year, series, group_code")
    .eq("full_name", normalizedName)
    .eq("study_year", normalizedStudyYear)
    .eq("series", normalizedSeries)
    .eq("group_code", normalizedGroupCode)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapStudentRow(data) : null;
}

export async function createStudent({
  fullName,
  email = null,
  studyYear,
  series,
  groupCode,
}) {
  const normalizedName = String(fullName || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase() || null;
  const normalizedStudyYear = String(studyYear || "").trim();
  const normalizedSeries = String(series || "").trim().toUpperCase();
  const normalizedGroupCode = String(groupCode || "").trim();

  const { data, error } = await supabaseAdmin
    .from("students")
    .insert([
      {
        full_name: normalizedName,
        search_name: buildStudentSearchName(normalizedName),
        email: normalizedEmail,
        study_year: normalizedStudyYear,
        series: normalizedSeries,
        group_code: normalizedGroupCode,
      },
    ])
    .select("id, full_name, email, observation, study_year, series, group_code")
    .single();

  if (error) {
    throw error;
  }

  return mapStudentRow(data);
}

export async function assignStudentEmailIfMissing(studentId, email) {
  const normalizedStudentId = String(studentId || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedStudentId || !normalizedEmail) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("students")
    .update({ email: normalizedEmail })
    .eq("id", normalizedStudentId)
    .is("email", null)
    .select("id, full_name, email, observation, study_year, series, group_code")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapStudentRow(data) : null;
}

export async function searchStudentsByName(query, limit = 10) {
  const normalizedQuery = normalizeStudentSearchTerm(query);

  if (!normalizedQuery || normalizedQuery.length < 2) {
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("students")
    .select("id, full_name, email, observation, study_year, series, group_code")
    .eq("is_active", true)
    .ilike("search_name", `%${normalizedQuery}%`)
    .order("full_name", { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data || []).map(mapStudentRow);
}
