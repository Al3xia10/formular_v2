import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./api/auth/[...nextauth]/route";
import QRGeneratorPage from "./components/QRGeneratorPage";
import { canAccessProfessorArea, getUserRoleFromSession } from "../lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const role = getUserRoleFromSession(session);
  const email = session?.user?.email;

  if (!session) {
    redirect("/auth/signin?callbackUrl=/");
  }

  if (!canAccessProfessorArea(role, email)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf4] px-4 text-[#2f2a25]">
        <div className="w-full max-w-md rounded-[2rem] border border-red-100 bg-white p-6 text-center shadow-2xl shadow-red-100/70">
          <h1 className="text-2xl font-black text-red-700">
            Acces restrictionat
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#806d62]">
            Pagina care genereaza codul QR este disponibila doar pentru
            profesor.
          </p>
        </div>
      </main>
    );
  }

  return <QRGeneratorPage />;
}
