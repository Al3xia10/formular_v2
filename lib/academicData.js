import { supabaseAdmin } from "./supabaseAdmin";

export const DISCIPLINE_TYPE_OPTIONS = ["Curs", "Proiect", "Laborator"];

export async function fetchAcademicOptions() {
  const [{ data: disciplines, error: disciplinesError }, { data: groups, error: groupsError }] =
    await Promise.all([
      supabaseAdmin
        .from("disciplines")
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabaseAdmin
        .from("academic_groups")
        .select("id, study_year, series, group_code")
        .eq("is_active", true)
        .order("study_year", { ascending: true })
        .order("series", { ascending: true })
        .order("group_code", { ascending: true }),
    ]);

  if (disciplinesError) {
    throw disciplinesError;
  }

  if (groupsError) {
    throw groupsError;
  }

  const academicGroups = groups || [];

  return {
    disciplines: (disciplines || []).map((item) => item.name),
    disciplineRows: disciplines || [],
    studyYears: [...new Set(academicGroups.map((item) => item.study_year))],
    series: [...new Set(academicGroups.map((item) => item.series))],
    groupCodes: [...new Set(academicGroups.map((item) => item.group_code))].sort(
      (a, b) => Number(a) - Number(b),
    ),
    academicGroups,
  };
}

export async function findDisciplineByName(name) {
  const { data, error } = await supabaseAdmin
    .from("disciplines")
    .select("id, name")
    .eq("name", name)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function findAcademicGroup({ studyYear, series, groupCode }) {
  const { data, error } = await supabaseAdmin
    .from("academic_groups")
    .select("id, study_year, series, group_code")
    .eq("study_year", studyYear)
    .eq("series", series)
    .eq("group_code", groupCode)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
