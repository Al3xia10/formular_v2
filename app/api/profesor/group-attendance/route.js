import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import {
  DISCIPLINE_TYPE_OPTIONS,
  findDisciplineByName,
} from "../../../../lib/academicData";
import { canAccessProfessorArea, getUserRoleFromSession } from "../../../../lib/auth";
import {
  buildExactStudentKey,
  buildLooseStudentKey,
} from "../../../../lib/studentAttendanceMatching";
import { parseStudentObservations } from "../../../../lib/studentObservations";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

function getStudentStatus(typeCounts) {
  const values = Object.values(typeCounts);
  const total = values.reduce((sum, value) => sum + value, 0);

  if (total === 0) {
    return "Absent";
  }

  return "Prezent";
}

function getAttendanceMomentValue(item) {
  if (item?.submitted_at) {
    const submittedAt = new Date(item.submitted_at).getTime();
    if (Number.isFinite(submittedAt)) {
      return submittedAt;
    }
  }

  const fallback = new Date(`${item?.data || ""}T${item?.ora || "00:00:00"}`).getTime();
  return Number.isFinite(fallback) ? fallback : 0;
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
    const studyYear = searchParams.get("studyYear")?.trim() || "";
    const groupCode = searchParams.get("groupCode")?.trim() || "";
    const series = searchParams.get("series")?.trim().toUpperCase() || "";
    const disciplina = searchParams.get("disciplina")?.trim() || "";

    if (!studyYear) {
      return new Response(
        JSON.stringify({ error: "Anul este obligatoriu." }),
        { status: 400 },
      );
    }

    const selectedDiscipline = disciplina
      ? await findDisciplineByName(disciplina)
      : null;

    let studentsQuery = supabaseAdmin
      .from("students")
      .select("id, full_name, observation, study_year, series, group_code")
      .eq("is_active", true)
      .eq("study_year", studyYear)
      .order("full_name", { ascending: true });

    if (groupCode) {
      studentsQuery = studentsQuery.eq("group_code", groupCode);
    }

    const { data: studentsData, error: studentsError } = await studentsQuery;

    if (studentsError) {
      throw studentsError;
    }

    const students = (studentsData || []).filter((student) => {
      if (!series) {
        return true;
      }

      return student.series === series || !student.series;
    });

    let attendanceQuery = supabaseAdmin
      .from("attendance")
      .select(
        "id, student_id, nume, an, grupa, serie, disciplina, tip_disciplina, discipline_id, data, ora, submitted_at, grade",
      )
      .eq("valid_qr", true)
      .eq("an", studyYear);

    if (groupCode) {
      attendanceQuery = attendanceQuery.eq("grupa", groupCode);
    }

    if (series) {
      attendanceQuery = attendanceQuery.eq("serie", series);
    }

    const { data: attendanceData, error: attendanceError } = await attendanceQuery;

    if (attendanceError) {
      throw attendanceError;
    }

    const filteredAttendance = (attendanceData || []).filter((item) => {
      if (!disciplina) {
        return true;
      }

      if (selectedDiscipline?.id && item.discipline_id === selectedDiscipline.id) {
        return true;
      }

      return item.disciplina === disciplina;
    });

    const attendanceByStudentId = new Map();
    const attendanceByExactNameKey = new Map();
    const attendanceByLooseNameKey = new Map();

    function pushAttendanceItem(map, key, item) {
      const current = map.get(key) || [];
      current.push(item);
      map.set(key, current);
    }

    for (const item of filteredAttendance) {
      const typeKey = DISCIPLINE_TYPE_OPTIONS.includes(item.tip_disciplina)
        ? item.tip_disciplina
        : item.tip_disciplina || "Alt tip";

      if (item.student_id) {
        const current = attendanceByStudentId.get(item.student_id) || {};
        current[typeKey] = (current[typeKey] || 0) + 1;
        attendanceByStudentId.set(item.student_id, current);
      }

      const exactKey = buildExactStudentKey({
        fullName: item.nume,
        studyYear: item.an,
        groupCode: item.grupa,
      });
      const exactCurrent = attendanceByExactNameKey.get(exactKey) || {};
      exactCurrent[typeKey] = (exactCurrent[typeKey] || 0) + 1;
      attendanceByExactNameKey.set(exactKey, exactCurrent);

      const looseKey = buildLooseStudentKey({
        fullName: item.nume,
        studyYear: item.an,
        groupCode: item.grupa,
      });
      const looseCurrent = attendanceByLooseNameKey.get(looseKey) || {};
      looseCurrent[typeKey] = (looseCurrent[typeKey] || 0) + 1;
      attendanceByLooseNameKey.set(looseKey, looseCurrent);
    }

    const attendanceItemsByStudentId = new Map();
    const attendanceItemsByExactNameKey = new Map();
    const attendanceItemsByLooseNameKey = new Map();

    for (const item of filteredAttendance) {
      if (item.student_id) {
        pushAttendanceItem(attendanceItemsByStudentId, item.student_id, item);
      }

      pushAttendanceItem(
        attendanceItemsByExactNameKey,
        buildExactStudentKey({
          fullName: item.nume,
          studyYear: item.an,
          groupCode: item.grupa,
        }),
        item,
      );

      pushAttendanceItem(
        attendanceItemsByLooseNameKey,
        buildLooseStudentKey({
          fullName: item.nume,
          studyYear: item.an,
          groupCode: item.grupa,
        }),
        item,
      );
    }

    const rows = students.map((student) => {
      const baseTypeCounts = DISCIPLINE_TYPE_OPTIONS.reduce((accumulator, type) => {
        accumulator[type] = 0;
        return accumulator;
      }, {});
      const countsFromId = attendanceByStudentId.get(student.id) || {};
      const countsFromExactName = attendanceByExactNameKey.get(
        buildExactStudentKey({
          fullName: student.full_name,
          studyYear: student.study_year,
          groupCode: student.group_code,
        }),
      ) || {};
      const countsFromLooseName = attendanceByLooseNameKey.get(
        buildLooseStudentKey({
          fullName: student.full_name,
          studyYear: student.study_year,
          groupCode: student.group_code,
        }),
      ) || {};
      const attendanceItems =
        attendanceItemsByStudentId.get(student.id) ||
        attendanceItemsByExactNameKey.get(
          buildExactStudentKey({
            fullName: student.full_name,
            studyYear: student.study_year,
            groupCode: student.group_code,
          }),
        ) ||
        attendanceItemsByLooseNameKey.get(
          buildLooseStudentKey({
            fullName: student.full_name,
            studyYear: student.study_year,
            groupCode: student.group_code,
          }),
        ) ||
        [];

      const typeCounts = { ...baseTypeCounts };
      for (const type of Object.keys(typeCounts)) {
        typeCounts[type] = Math.max(
          countsFromId[type] || 0,
          countsFromExactName[type] || 0,
          countsFromLooseName[type] || 0,
        );
      }

      const totalAttendance = Object.values(typeCounts).reduce(
        (sum, value) => sum + value,
        0,
      );
      const latestAttendance = [...attendanceItems].sort(
        (a, b) => getAttendanceMomentValue(b) - getAttendanceMomentValue(a),
      )[0];
      const observations = parseStudentObservations(student.observation || "");
      const grades = attendanceItems
        .filter((item) => item.grade !== null && item.grade !== undefined)
        .sort((a, b) => getAttendanceMomentValue(b) - getAttendanceMomentValue(a))
        .map((item) => ({
          id: item.id,
          grade: item.grade,
          type: item.tip_disciplina || "Prezență",
          date: item.data || "",
          time: item.ora || "",
        }));

      return {
        id: student.id,
        fullName: student.full_name,
        observation: observations[0]?.content || "",
        observations,
        studyYear: student.study_year,
        series: student.series || series || "",
        groupCode: student.group_code,
        typeCounts,
        totalAttendance,
        grades,
        latestAttendanceDate: latestAttendance?.data || "",
        latestAttendanceTime: latestAttendance?.ora || "",
        status: getStudentStatus(typeCounts),
      };
    });

    const absentCount = rows.filter((item) => item.totalAttendance === 0).length;

    return new Response(
      JSON.stringify({
        rows,
        disciplineTypes: DISCIPLINE_TYPE_OPTIONS,
        summary: {
          totalStudents: rows.length,
          absentCount,
          presentCount: rows.length - absentCount,
        },
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Eroare la încărcarea situației pe grupă:", error);
    return new Response(
      JSON.stringify({ error: "Nu am putut încărca situația pe grupă." }),
      { status: 500 },
    );
  }
}
