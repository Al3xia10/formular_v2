export default function GroupAttendancePanel({
  groupFilters,
  academicOptions,
  groupAttendanceData,
  groupAttendanceLoading,
  groupAttendanceError,
  onChangeFilter,
  onSubmit,
}) {
  return (
    <section className="mt-6 rounded-[1.75rem] border border-orange-100 bg-white p-5 shadow-xl shadow-orange-100/70 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
            Situație pe grupă
          </p>
          <h2 className="mt-1 text-2xl font-black text-[#2f2a25]">
            Catalog cu prezențe și absenți
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#806d62]">
            Lista pornește din catalogul studenților și cumulează toate
            prezențele înregistrate până în momentul acesta, inclusiv pentru
            studenții fără nicio prezență.
          </p>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="mt-5 grid gap-3 md:grid-cols-4 xl:grid-cols-5"
      >
        <select
          value={groupFilters.studyYear}
          onChange={(e) => onChangeFilter("studyYear", e.target.value)}
          className="h-12 rounded-2xl border border-[#ead8c8] bg-[#fffaf4] px-4 text-sm font-semibold text-[#2f2a25] outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
        >
          <option value="">Selectează anul</option>
          {academicOptions.studyYears.map((item) => (
            <option key={item} value={item}>
              Anul {item}
            </option>
          ))}
        </select>

        <select
          value={groupFilters.groupCode}
          onChange={(e) => onChangeFilter("groupCode", e.target.value)}
          className="h-12 rounded-2xl border border-[#ead8c8] bg-[#fffaf4] px-4 text-sm font-semibold text-[#2f2a25] outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
        >
          <option value="">Selectează grupa</option>
          {academicOptions.groupCodes.map((item) => (
            <option key={item} value={item}>
              Grupa {item}
            </option>
          ))}
        </select>

        <select
          value={groupFilters.series}
          onChange={(e) => onChangeFilter("series", e.target.value)}
          className="h-12 rounded-2xl border border-[#ead8c8] bg-[#fffaf4] px-4 text-sm font-semibold text-[#2f2a25] outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
        >
          <option value="">Toate seriile</option>
          {academicOptions.series.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={groupFilters.disciplina}
          onChange={(e) => onChangeFilter("disciplina", e.target.value)}
          className="h-12 rounded-2xl border border-[#ead8c8] bg-[#fffaf4] px-4 text-sm font-semibold text-[#2f2a25] outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
        >
          <option value="">Toate disciplinele</option>
          {academicOptions.disciplines.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={groupAttendanceLoading}
          className={`flex h-12 items-center justify-center rounded-2xl bg-[#2f2a25] px-5 text-sm font-black text-white shadow-lg shadow-stone-300/70 transition ${
            groupAttendanceLoading
              ? "cursor-not-allowed opacity-60"
              : "hover:bg-black"
          }`}
        >
          {groupAttendanceLoading ? "Se încarcă..." : "Vezi situația"}
        </button>
      </form>

      {groupAttendanceError && (
        <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {groupAttendanceError}
        </div>
      )}

      {groupAttendanceData && (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-orange-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-orange-500">
                studenți
              </p>
              <p className="mt-1 text-2xl font-black text-[#2f2a25]">
                {groupAttendanceData.summary.totalStudents}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-600">
                cu prezențe
              </p>
              <p className="mt-1 text-2xl font-black text-[#2f2a25]">
                {groupAttendanceData.summary.presentCount}
              </p>
            </div>
            <div className="rounded-2xl bg-red-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-red-600">
                absenți
              </p>
              <p className="mt-1 text-2xl font-black text-[#2f2a25]">
                {groupAttendanceData.summary.absentCount}
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-[1.5rem] border border-orange-100">
            <table className="min-w-full bg-white text-sm">
              <thead className="bg-[#fff4ea]">
                <tr>
                  <th className="px-4 py-3 text-left font-black text-[#4a3b33]">
                    Student
                  </th>
                  {groupAttendanceData.disciplineTypes.map((type) => (
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
                {groupAttendanceData.rows.map((student) => (
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
                    {groupAttendanceData.disciplineTypes.map((type) => (
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
        </>
      )}
    </section>
  );
}
