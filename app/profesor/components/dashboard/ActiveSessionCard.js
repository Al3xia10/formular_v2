import { formatSessionDateTime } from "./utils";

export default function ActiveSessionCard({
  hasSearched,
  activeSession,
  onShowActiveSession,
  onExportActiveSession,
}) {
  if (!hasSearched || !activeSession) {
    return null;
  }

  return (
    <div className="mb-5 rounded-[1.75rem] border border-emerald-100 bg-emerald-50/70 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            Sesiune QR activă
          </p>
          <p className="mt-1 text-lg font-black text-[#2f2a25]">
            {activeSession.label}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#5f7166]">
            Start: {formatSessionDateTime(activeSession.startsAt)}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#5f7166]">
            Expiră: {formatSessionDateTime(activeSession.expiresAt)}
          </p>
          <p className="mt-2 text-sm font-bold text-[#2f2a25]">
            Au trimis deja {activeSession.studentCount} student
            {activeSession.studentCount === 1 ? "" : "i"} •{" "}
            {activeSession.attendanceCount} prezențe
          </p>
        </div>

        <div className="grid gap-2 sm:min-w-[220px]">
          <button
            type="button"
            onClick={onShowActiveSession}
            className="flex h-10 items-center justify-center rounded-[1rem] bg-white px-4 text-xs font-black text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-50"
          >
            Vezi doar sesiunea activă
          </button>
          {activeSession.attendanceCount > 0 && (
            <button
              type="button"
              onClick={onExportActiveSession}
              className="flex h-10 items-center justify-center rounded-[1rem] bg-white px-4 text-xs font-black text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-50"
            >
              Exportă sesiunea activă
            </button>
          )}
        </div>
      </div>

      {activeSession.students.length > 0 && (
        <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
          {activeSession.students.map((student) => (
            <div
              key={student.email || student.nume}
              className="rounded-2xl bg-white px-4 py-3 ring-1 ring-emerald-100"
            >
              <p className="text-sm font-black text-[#2f2a25]">{student.nume}</p>
              <p className="mt-1 text-xs font-semibold text-[#5f7166]">
                {student.email}
              </p>
              <p className="mt-1 text-xs font-semibold text-[#5f7166]">
                Grupa {student.grupa} • Anul {student.an} • Seria {student.serie} •{" "}
                {student.attendanceCount} prezențe
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
