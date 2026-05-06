import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import {
  findStudentByEmail,
  searchStudentsByName,
} from "../../../../lib/studentsData";

export async function GET(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response(
      JSON.stringify({ error: "Trebuie să fii autentificat." }),
      { status: 401 },
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const [currentStudent, students] = await Promise.all([
      findStudentByEmail(session.user.email || ""),
      searchStudentsByName(query),
    ]);

    return new Response(
      JSON.stringify({
        currentStudent,
        students,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Eroare la căutarea studenților:", error);
    return new Response(
      JSON.stringify({ error: "Nu am putut încărca lista de studenți." }),
      { status: 500 },
    );
  }
}
