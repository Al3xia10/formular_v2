import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date"); // format: YYYY-MM-DD

  if (!date) {
    return new Response(JSON.stringify({ error: "Data lipsă" }), {
      status: 400,
    });
  }

  const qrFlagEmail = "__qr_token__";

  // Caută token existent
  const { data: existing } = await supabase
    .from("attendance")
    .select("qr_token")
    .eq("email", qrFlagEmail)
    .eq("data", date)
    .maybeSingle();

  if (existing?.qr_token) {
    return new Response(JSON.stringify({ token: existing.qr_token }), {
      status: 200,
    });
  }

  // Generează token nou
  const newToken = Array.from({ length: 6 }, () =>
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(
      Math.floor(Math.random() * 36)
    )
  ).join("");

  // Salvează în attendance cu un email special "__qr_token__"
  const { error } = await supabase.from("attendance").insert([
    {
      email: qrFlagEmail,
      nume: "qr-generator",
      grupa: "qr",
      an: "qr",
      serie: "qr",
      disciplina: "qr",
      tip_disciplina: "qr",
      data: date,
      ora: "00:00:00",
      poza_url: "",
      qr_token: newToken,
      valid_qr: false,
    },
  ]);

  if (error) {
    return new Response(JSON.stringify({ error: "Eroare la salvare QR" }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ token: newToken }), {
    status: 200,
  });
}
