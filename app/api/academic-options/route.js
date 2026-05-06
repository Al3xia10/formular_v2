import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import {
  DISCIPLINE_TYPE_OPTIONS,
  fetchAcademicOptions,
} from "../../../lib/academicData";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response(
      JSON.stringify({ error: "Trebuie să fii autentificat." }),
      { status: 401 },
    );
  }

  try {
    const data = await fetchAcademicOptions();

    return new Response(
      JSON.stringify({
        ...data,
        disciplineTypes: DISCIPLINE_TYPE_OPTIONS,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Eroare la încărcarea opțiunilor academice:", error);
    return new Response(
      JSON.stringify({ error: "Nu am putut încărca opțiunile academice." }),
      { status: 500 },
    );
  }
}
