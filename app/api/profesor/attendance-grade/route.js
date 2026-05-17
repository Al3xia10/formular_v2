import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import {
  canAccessProfessorArea,
  getUserRoleFromSession,
} from "../../../../lib/auth";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

function unauthorizedResponse(message, status) {
  return new Response(JSON.stringify({ error: message }), { status });
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  const role = getUserRoleFromSession(session);

  if (!session) {
    return unauthorizedResponse("Trebuie să fii autentificat.", 401);
  }

  if (!canAccessProfessorArea(role, session?.user?.email)) {
    return unauthorizedResponse("Nu ai acces la această resursă.", 403);
  }

  try {
    const body = await req.json();
    const attendanceId = String(body.attendanceId || "").trim();
    const rawGrade = body.grade;

    if (!attendanceId) {
      return new Response(
        JSON.stringify({ error: "Prezența selectată este invalidă." }),
        { status: 400 },
      );
    }

    let normalizedGrade = null;

    if (rawGrade !== "" && rawGrade !== null && rawGrade !== undefined) {
      const parsedGrade = Number(rawGrade);

      if (!Number.isFinite(parsedGrade)) {
        return new Response(
          JSON.stringify({ error: "Nota trebuie să fie un număr valid." }),
          { status: 400 },
        );
      }

      if (parsedGrade < 1 || parsedGrade > 10) {
        return new Response(
          JSON.stringify({ error: "Nota trebuie să fie între 1 și 10." }),
          { status: 400 },
        );
      }

      normalizedGrade = Math.round(parsedGrade * 100) / 100;
    }

    const { data, error } = await supabaseAdmin
      .from("attendance")
      .update({ grade: normalizedGrade })
      .eq("id", attendanceId)
      .select("id, grade")
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        attendance: {
          id: data.id,
          grade: data.grade,
        },
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Eroare la salvarea notei pentru prezență:", error);
    return new Response(
      JSON.stringify({ error: "Nu am putut salva nota pentru această prezență." }),
      { status: 500 },
    );
  }
}
