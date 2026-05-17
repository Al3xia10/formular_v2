import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { canAccessProfessorArea, getUserRoleFromSession } from "../../../../lib/auth";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

function extractStoragePath(remoteUrl) {
  const pathname = remoteUrl.pathname || "";
  const marker = "/storage/v1/object/public/";
  const markerIndex = pathname.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const storagePath = pathname.slice(markerIndex + marker.length);
  const [bucket, ...rest] = storagePath.split("/");

  if (!bucket || !rest.length) {
    return null;
  }

  return {
    bucket: decodeURIComponent(bucket),
    path: rest.map((segment) => decodeURIComponent(segment)).join("/"),
  };
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  const role = getUserRoleFromSession(session);

  if (!session) {
    return new Response(JSON.stringify({ error: "Trebuie să fii autentificat." }), {
      status: 401,
    });
  }

  if (!canAccessProfessorArea(role, session?.user?.email)) {
    return new Response(JSON.stringify({ error: "Nu ai acces la această resursă." }), {
      status: 403,
    });
  }

  const { searchParams } = new URL(req.url);
  const remoteUrl = searchParams.get("url")?.trim();

  if (!remoteUrl) {
    return new Response(JSON.stringify({ error: "Lipsește URL-ul pozei." }), {
      status: 400,
    });
  }

  let parsedRemoteUrl;
  try {
    parsedRemoteUrl = new URL(remoteUrl);
  } catch {
    return new Response(JSON.stringify({ error: "URL invalid pentru preview." }), {
      status: 400,
    });
  }

  if (!["http:", "https:"].includes(parsedRemoteUrl.protocol)) {
    return new Response(
      JSON.stringify({ error: "Protocol invalid pentru preview." }),
      { status: 400 },
    );
  }

  const storageTarget = extractStoragePath(parsedRemoteUrl);
  if (!storageTarget) {
    return new Response(
      JSON.stringify({ error: "URL-ul pozei nu indică un fișier valid din storage." }),
      { status: 400 },
    );
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(storageTarget.bucket)
      .download(storageTarget.path);

    if (error || !data) {
      return new Response(
        JSON.stringify({ error: "Nu am putut încărca poza din storage." }),
        { status: 400 },
      );
    }

    const contentType = data.type || "image/jpeg";
    const arrayBuffer = await data.arrayBuffer();

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Eroare la proxy-ul preview-ului de poză:", error);
    return new Response(
      JSON.stringify({ error: "Nu am putut încărca preview-ul pozei." }),
      { status: 500 },
    );
  }
}
