import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
import ProfessorDashboard from "./components/ProfessorDashboard";
import { canAccessProfessorArea, getUserRoleFromSession } from "../../lib/auth";

export default async function ProfesorPage() {
  const session = await getServerSession(authOptions);
  const role = getUserRoleFromSession(session);

  if (!session) {
    redirect("/auth/signin?callbackUrl=/profesor");
  }

  if (!canAccessProfessorArea(role)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf4] px-4 text-[#2f2a25]">
        <div className="w-full max-w-md rounded-[2rem] border border-red-100 bg-white p-6 text-center shadow-2xl shadow-red-100/70">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl">
            ⚠️
          </div>
          <h1 className="text-2xl font-black text-red-700">
            Acces restricționat
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#806d62]">
            Această pagină este disponibilă doar pentru profesor.
          </p>
        </div>
      </main>
    );
  }

  return <ProfessorDashboard />;
}
