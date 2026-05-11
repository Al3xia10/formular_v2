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
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

function getStudentStatus(typeCounts) {
  const values = Object.values(typeCounts);
  const total = values.reduce((sum, value) => sum + value, 0);

  if (total === 0) {
    return "Absent";
  }

  if (values.every((value) => value > 0)) {
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
    const studyYear = searchParams.get("studyYear")?.trim() || "";
    const groupCode = searchParams.get("groupCode")?.trim() || "";
    const series = searchParams.get("series")?.trim().toUpperCase() || "";
    const disciplina = searchParams.get("disciplina")?.trim() || "";

    if (!studyYear || !groupCode) {
      return new Response(
        JSON.stringify({ error: "Anul și grupa sunt obligatorii." }),
        { status: 400 },
      );
    }

    const selectedDiscipline = disciplina
      ? await findDisciplineByName(disciplina)
      : null;

    const { data: studentsData, error: studentsError } = await supabaseAdmin
      .from("students")
      .select("id, full_name, study_year, series, group_code")
      .eq("is_active", true)
      .eq("study_year", studyYear)
      .eq("group_code", groupCode)
      .order("full_name", { ascending: true });

    if (studentsError) {
      throw studentsError;
    }

    const students = (studentsData || []).filter((student) => {
      if (!series) {
        return true;
      }

      return student.series === series || !student.series;
    });

    const attendanceQuery = supabaseAdmin
      .from("attendance")
      .select(
        "id, student_id, nume, an, grupa, serie, disciplina, tip_disciplina, discipline_id",
      )
      .eq("valid_qr", true)
      .eq("an", studyYear)
      .eq("grupa", groupCode);

    if (series) {
      attendanceQuery.eq("serie", series);
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

      return {
        id: student.id,
        fullName: student.full_name,
        studyYear: student.study_year,
        series: student.series || series || "",
        groupCode: student.group_code,
        typeCounts,
        totalAttendance,
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
