import { useEffect, useState } from "react";

export default function DisciplineCatalogModal({
  show,
  loading,
  error,
  data,
  observationSavingStudentId,
  onClose,
  onExport,
  onSaveObservation,
}) {
  const [observationDrafts, setObservationDrafts] = useState({});

  useEffect(() => {
    if (!data?.groups?.length) {
      setObservationDrafts({});
      return;
    }

    const nextDrafts = {};
    data.groups.forEach((group) => {
      group.students.forEach((student) => {
        nextDrafts[student.id] = student.observation || "";
      });
    });
    setObservationDrafts(nextDrafts);
  }, [data]);

  if (!show) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        backgroundColor: "rgba(47, 42, 37, 0.35)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "980px",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: "28px",
          backgroundColor: "rgba(255, 255, 255, 0.97)",
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.25)",
          border: "1px solid rgba(255, 255, 255, 0.7)",
          padding: "24px",
          position: "relative",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{ position: "absolute", top: "18px", right: "18px" }}
          className="flex h-8 w-8 items-center justify-center text-2xl font-black leading-none text-[#2f2a25] transition hover:text-orange-600"
          aria-label="Închide catalogul"
        >
          ×
        </button>

        <div className="pr-10">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
            totaluri pe materie
          </p>
          <h2 className="mt-1 text-2xl font-black text-[#2f2a25]">
            {data?.disciplina || "Catalog disciplină"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#806d62]">
            Lista afișează doar studenții care au cel puțin o prezență la
            disciplina selectată, grupați după an, grupă și serie.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onExport}
            disabled={loading || !data?.groups?.length}
            className={`flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-black text-white shadow-lg shadow-orange-200 transition ${
              loading || !data?.groups?.length
                ? "cursor-not-allowed bg-orange-300 opacity-70"
                : "bg-[#ff7a1a] hover:opacity-90"
            }`}
          >
            Exportă catalogul în Excel
          </button>
        </div>

        {loading && (
          <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
            Se încarcă situația pe disciplină...
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && data?.groups?.length > 0 && (
          <div className="mt-6 space-y-5">
            {data.groups.map((group) => (
              <section
                key={group.key}
                className="rounded-[1.5rem] border border-orange-100 bg-[#fffaf4] p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-black text-[#2f2a25]">
                      {group.label}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-[#806d62]">
                      {group.summary.totalStudents} studenți prezenți
                    </p>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto rounded-[1.25rem] border border-orange-100 bg-white">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[#fff4ea]">
                      <tr>
                        <th className="px-4 py-3 text-left font-black text-[#4a3b33]">
                          Student
                        </th>
                        <th className="px-4 py-3 text-left font-black text-[#4a3b33]">
                          Observații
                        </th>
                        {data.disciplineTypes.map((type) => (
                          <th
                            key={type}
                            className="px-4 py-3 text-center font-black text-[#4a3b33]"
                          >
                            {type}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-center font-black text-[#4a3b33]">
                          Total
                        </th>
                        <th className="px-4 py-3 text-center font-black text-[#4a3b33]">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.students.map((student) => (
                        <tr
                          key={student.id}
                          className="border-t border-orange-100 align-top"
                        >
                          <td className="px-4 py-3">
                            <p className="font-black text-[#2f2a25]">
                              {student.fullName}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-[#806d62]">
                              Grupa {student.groupCode} • Anul {student.studyYear}
                              {student.series ? ` • Seria ${student.series}` : ""}
                            </p>
                          </td>
                          <td className="min-w-[260px] px-4 py-3">
                            <div className="grid gap-2">
                              <textarea
                                value={observationDrafts[student.id] ?? ""}
                                onChange={(e) =>
                                  setObservationDrafts((current) => ({
                                    ...current,
                                    [student.id]: e.target.value,
                                  }))
                                }
                                rows={3}
                                placeholder="Adaugă o observație"
                                className="w-full rounded-2xl border border-[#ead8c8] bg-[#fffaf4] px-3 py-2 text-sm font-semibold text-[#2f2a25] outline-none transition placeholder:text-[#b8a599] focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  onSaveObservation(
                                    student.id,
                                    observationDrafts[student.id] ?? "",
                                  )
                                }
                                disabled={observationSavingStudentId === student.id}
                                className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-xs font-black text-white transition ${
                                  observationSavingStudentId === student.id
                                    ? "cursor-not-allowed bg-[#7f746d] opacity-60"
                                    : "bg-[#2f2a25] hover:bg-black"
                                }`}
                              >
                                {observationSavingStudentId === student.id
                                  ? "Se salvează..."
                                  : "Salvează observația"}
                              </button>
                            </div>
                          </td>
                          {data.disciplineTypes.map((type) => (
                            <td
                              key={type}
                              className="px-4 py-3 text-center font-semibold text-[#4a3b33]"
                            >
                              {student.typeCounts[type] || 0}
                            </td>
                          ))}
                          <td className="px-4 py-3 text-center font-black text-[#2f2a25]">
                            {student.totalAttendance}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                                student.status === "Absent"
                                  ? "bg-red-100 text-red-700"
                                  : student.status === "Prezent"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {student.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
