import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { findDisciplineByName } from "../../../../lib/academicData";
import { canAccessProfessorArea, getUserRoleFromSession } from "../../../../lib/auth";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeDiscipline(value) {
  return String(value || "").trim().toLowerCase();
}

function buildCatalogMatchKey({ fullName, studyYear, groupCode }) {
  return `${normalizeName(fullName)}::${studyYear}::${groupCode}`;
}

function buildLooseCatalogMatchKey({ fullName, studyYear, groupCode }) {
  const tokens = normalizeName(fullName)
    .split(" ")
    .filter((token) => token.length > 1)
    .sort((left, right) => left.localeCompare(right, "ro"));

  return `${tokens.join(" ")}::${studyYear}::${groupCode}`;
}

function buildDisciplineTypes(attendanceItems) {
  const preferredOrder = ["Curs", "Seminar", "Laborator", "Proiect"];
  const discovered = [
    ...new Set(
      attendanceItems
        .map((item) => String(item.tip_disciplina || "").trim())
        .filter(Boolean),
    ),
  ];

  const preferred = preferredOrder.filter((item) => discovered.includes(item));
  const extras = discovered
    .filter((item) => !preferredOrder.includes(item))
    .sort((left, right) => left.localeCompare(right, "ro"));

  return [...preferred, ...extras];
}

function getStudentStatus(typeCounts) {
  const values = Object.values(typeCounts);
  const total = values.reduce((sum, value) => sum + value, 0);

  if (total === 0) {
    return "Absent";
  }

  if (values.length > 0 && values.every((value) => value > 0)) {
    return "Prezent";
  }

  return "Prezent parțial";
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
    const disciplina = searchParams.get("disciplina")?.trim() || "";

    if (!disciplina) {
      return new Response(
        JSON.stringify({ error: "Disciplina este obligatorie." }),
        { status: 400 },
      );
    }

    const selectedDiscipline = await findDisciplineByName(disciplina);
    const normalizedSelectedDiscipline = normalizeDiscipline(disciplina);

    const { data: attendanceData, error: attendanceError } = await supabaseAdmin
      .from("attendance")
      .select("id, student_id, nume, an, grupa, serie, tip_disciplina, discipline_id, disciplina")
      .eq("valid_qr", true);

    if (attendanceError) {
      throw attendanceError;
    }

    const filteredAttendance = (attendanceData || []).filter((item) => {
      if (selectedDiscipline?.id && item.discipline_id === selectedDiscipline.id) {
        return true;
      }

      return normalizeDiscipline(item.disciplina) === normalizedSelectedDiscipline;
    });

    const disciplineTypes = buildDisciplineTypes(filteredAttendance);
    const relevantYears = [
      ...new Set(filteredAttendance.map((item) => item.an).filter(Boolean)),
    ];
    const relevantGroups = [
      ...new Set(filteredAttendance.map((item) => item.grupa).filter(Boolean)),
    ];

    let studentsData = [];
    if (relevantYears.length > 0 && relevantGroups.length > 0) {
      const { data, error } = await supabaseAdmin
        .from("students")
        .select("id, full_name, study_year, series, group_code")
        .eq("is_active", true)
        .in("study_year", relevantYears)
        .in("group_code", relevantGroups)
        .order("study_year", { ascending: true })
        .order("group_code", { ascending: true })
        .order("series", { ascending: true })
        .order("full_name", { ascending: true });

      if (error) {
        throw error;
      }

      studentsData = data || [];
    }

    const groupsMap = new Map();
    const studentsById = new Map();
    const studentsByExactKey = new Map();
    const studentsByLooseKey = new Map();

    for (const student of studentsData) {
      const emptyCounts = disciplineTypes.reduce((accumulator, type) => {
        accumulator[type] = 0;
        return accumulator;
      }, {});

      const row = {
        id: student.id,
        fullName: student.full_name,
        studyYear: student.study_year,
        series: student.series || "",
        groupCode: student.group_code,
        typeCounts: emptyCounts,
        totalAttendance: 0,
        status: "Absent",
      };

      studentsById.set(student.id, row);

      const exactKey = buildCatalogMatchKey({
        fullName: student.full_name,
        studyYear: student.study_year,
        groupCode: student.group_code,
      });
      if (!studentsByExactKey.has(exactKey)) {
        studentsByExactKey.set(exactKey, row);
      }

      const looseKey = buildLooseCatalogMatchKey({
        fullName: student.full_name,
        studyYear: student.study_year,
        groupCode: student.group_code,
      });
      if (!studentsByLooseKey.has(looseKey)) {
        studentsByLooseKey.set(looseKey, row);
      }
    }

    for (const item of filteredAttendance) {
      const typeKey = String(item.tip_disciplina || "").trim() || "Alt tip";
      const groupKey = `${item.an}::${item.serie || ""}::${item.grupa}`;
      const groupLabel = `Anul ${item.an} - Grupa ${item.grupa}${item.serie ? ` - Seria ${item.serie}` : ""}`;

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          key: groupKey,
          label: groupLabel,
          studyYear: item.an,
          series: item.serie || "",
          groupCode: item.grupa,
          students: new Map(),
        });
      }

      const exactKey = buildCatalogMatchKey({
        fullName: item.nume,
        studyYear: item.an,
        groupCode: item.grupa,
      });
      const looseKey = buildLooseCatalogMatchKey({
        fullName: item.nume,
        studyYear: item.an,
        groupCode: item.grupa,
      });

      let student =
        (item.student_id ? studentsById.get(item.student_id) : null) ||
        studentsByExactKey.get(exactKey) ||
        studentsByLooseKey.get(looseKey);

      if (!student) {
        const emptyCounts = disciplineTypes.reduce((accumulator, type) => {
          accumulator[type] = 0;
          return accumulator;
        }, {});
        const studentKey = item.student_id
          ? `student:${item.student_id}`
          : `fallback:${exactKey}`;

        student = {
          id: item.student_id || studentKey,
          fullName: item.nume,
          studyYear: item.an,
          series: item.serie || "",
          groupCode: item.grupa,
          typeCounts: emptyCounts,
          totalAttendance: 0,
          status: "Absent",
        };
      }

      groupsMap.get(groupKey).students.set(
        item.student_id ? `student:${item.student_id}` : `fallback:${exactKey}`,
        student,
      );

      if (!(typeKey in student.typeCounts)) {
        student.typeCounts[typeKey] = 0;
      }
      student.typeCounts[typeKey] += 1;
      student.totalAttendance += 1;
      student.status = getStudentStatus(student.typeCounts);
    }

    const groups = [...groupsMap.values()]
      .map((group) => {
        const students = [...group.students.values()]
          .filter((student) => student.totalAttendance > 0)
          .sort((left, right) =>
            left.fullName.localeCompare(right.fullName, "ro", {
              sensitivity: "base",
            }),
          )
          .map((student) => ({
            ...student,
            status: getStudentStatus(student.typeCounts),
          }));

        return {
          key: group.key,
          label: group.label,
          studyYear: group.studyYear,
          series: group.series,
          groupCode: group.groupCode,
          students,
          summary: {
            totalStudents: students.length,
            absentCount: 0,
          },
        };
      })
      .filter((group) => group.students.length > 0)
      .sort((left, right) => {
        const yearDiff = Number(left.studyYear) - Number(right.studyYear);
        if (yearDiff !== 0) {
          return yearDiff;
        }

        const groupDiff = Number(left.groupCode) - Number(right.groupCode);
        if (groupDiff !== 0) {
          return groupDiff;
        }

        return left.series.localeCompare(right.series, "ro");
      });

    return new Response(
      JSON.stringify({
        disciplina,
        disciplineTypes,
        groups,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Eroare la exportul catalogului pe disciplină:", error);
    return new Response(
      JSON.stringify({ error: "Nu am putut încărca situația pe disciplină." }),
      { status: 500 },
    );
  }
}
