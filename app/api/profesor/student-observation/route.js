import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import {
  canAccessProfessorArea,
  getUserRoleFromSession,
} from "../../../../lib/auth";
import {
  parseStudentObservations,
  serializeStudentObservations,
  summarizeStudentObservations,
} from "../../../../lib/studentObservations";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

async function ensureProfessorAccess() {
  const session = await getServerSession(authOptions);
  const role = getUserRoleFromSession(session);

  if (!session) {
    return {
      error: new Response(
        JSON.stringify({ error: "Trebuie să fii autentificat." }),
        { status: 401 },
      ),
    };
  }

  if (!canAccessProfessorArea(role, session?.user?.email)) {
    return {
      error: new Response(
        JSON.stringify({ error: "Nu ai acces la această resursă." }),
        { status: 403 },
      ),
    };
  }

  return { session };
}

async function loadStudentObservationState(studentId) {
  const { data, error } = await supabaseAdmin
    .from("students")
    .select("id, observation")
    .eq("id", studentId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    observations: parseStudentObservations(data.observation),
  };
}

async function persistStudentObservations(studentId, observations) {
  const serialized = serializeStudentObservations(observations);

  const { data, error } = await supabaseAdmin
    .from("students")
    .update({ observation: serialized })
    .eq("id", studentId)
    .eq("is_active", true)
    .select("id, observation")
    .single();

  if (error) {
    throw error;
  }

  const normalizedObservations = parseStudentObservations(data.observation);

  return {
    student: {
      id: data.id,
      observation: summarizeStudentObservations(normalizedObservations),
      observations: normalizedObservations,
    },
  };
}

export async function POST(req) {
  try {
    const { error } = await ensureProfessorAccess();
    if (error) {
      return error;
    }

    const body = await req.json();
    const studentId = String(body.studentId || "").trim();
    const content = String(body.content || body.observation || "").trim();

    if (!studentId) {
      return new Response(
        JSON.stringify({ error: "Studentul este obligatoriu." }),
        { status: 400 },
      );
    }

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Observația nu poate fi goală." }),
        { status: 400 },
      );
    }

    if (content.length > 1000) {
      return new Response(
        JSON.stringify({
          error: "Observația este prea lungă. Limita este de 1000 de caractere.",
        }),
        { status: 400 },
      );
    }

    const state = await loadStudentObservationState(studentId);

    if (!state) {
      return new Response(
        JSON.stringify({ error: "Studentul nu a fost găsit." }),
        { status: 404 },
      );
    }

    const now = new Date().toISOString();
    const nextObservations = [
      {
        id: crypto.randomUUID(),
        content,
        createdAt: now,
        updatedAt: now,
      },
      ...state.observations,
    ];

    return new Response(JSON.stringify(await persistStudentObservations(studentId, nextObservations)), {
      status: 200,
    });
  } catch (error) {
    console.error("Eroare la salvarea observației studentului:", error);
    return new Response(
      JSON.stringify({ error: "Nu am putut salva observația studentului." }),
      { status: 500 },
    );
  }
}

export async function PATCH(req) {
  try {
    const { error } = await ensureProfessorAccess();
    if (error) {
      return error;
    }

    const body = await req.json();
    const studentId = String(body.studentId || "").trim();
    const noteId = String(body.noteId || "").trim();
    const content = String(body.content || body.observation || "").trim();

    if (!studentId) {
      return new Response(
        JSON.stringify({ error: "Studentul este obligatoriu." }),
        { status: 400 },
      );
    }

    if (content.length > 1000) {
      return new Response(
        JSON.stringify({
          error: "Observația este prea lungă. Limita este de 1000 de caractere.",
        }),
        { status: 400 },
      );
    }

    const state = await loadStudentObservationState(studentId);

    if (!state) {
      return new Response(
        JSON.stringify({ error: "Studentul nu a fost găsit." }),
        { status: 404 },
      );
    }

    let nextObservations;

    if (!noteId) {
      nextObservations = content
        ? [
            {
              id: crypto.randomUUID(),
              content,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]
        : [];
    } else {
      nextObservations = state.observations.map((item) =>
        item.id === noteId
          ? { ...item, content, updatedAt: new Date().toISOString() }
          : item,
      );
    }

    return new Response(JSON.stringify(await persistStudentObservations(studentId, nextObservations)), {
      status: 200,
    });
  } catch (error) {
    console.error("Eroare la actualizarea observației studentului:", error);
    return new Response(
      JSON.stringify({ error: "Nu am putut actualiza observația studentului." }),
      { status: 500 },
    );
  }
}

export async function DELETE(req) {
  try {
    const { error } = await ensureProfessorAccess();
    if (error) {
      return error;
    }

    const body = await req.json();
    const studentId = String(body.studentId || "").trim();
    const noteId = String(body.noteId || "").trim();

    if (!studentId || !noteId) {
      return new Response(
        JSON.stringify({ error: "Studentul și observația sunt obligatorii." }),
        { status: 400 },
      );
    }

    const state = await loadStudentObservationState(studentId);

    if (!state) {
      return new Response(
        JSON.stringify({ error: "Studentul nu a fost găsit." }),
        { status: 404 },
      );
    }

    const nextObservations = state.observations.filter((item) => item.id !== noteId);

    return new Response(JSON.stringify(await persistStudentObservations(studentId, nextObservations)), {
      status: 200,
    });
  } catch (error) {
    console.error("Eroare la ștergerea observației studentului:", error);
    return new Response(
      JSON.stringify({ error: "Nu am putut șterge observația studentului." }),
      { status: 500 },
    );
  }
}
