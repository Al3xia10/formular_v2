export default function ResultsOverview({
  hasSearched,
  selectedDisciplineLabel,
  dashboardData,
  hasActiveResultFilters,
  onExportCurrentResults,
  onDeleteCurrentResults,
  onOpenFilters,
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-black text-[#2f2a25]">Rezultate</h2>
        <p className="mt-1 text-sm text-[#806d62]">
          {hasSearched
            ? `Sunt ${dashboardData.totalAttendanceCount}${dashboardData.baseAttendanceCount ? ` din ${dashboardData.baseAttendanceCount}` : ""} prezențe la ${selectedDisciplineLabel} • ${dashboardData.totalStudents} student${dashboardData.totalStudents === 1 ? "" : "i"}`
            : "Caută un student pentru a vedea prezențele."}
        </p>
      </div>

      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          minWidth: "280px",
        }}
      >
        <div className="rounded-[1.75rem] bg-orange-50 px-4 py-3 text-center">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-orange-500">
            studenți
          </p>
          <p className="text-2xl font-black text-[#2f2a25]">
            {dashboardData.totalStudents}
          </p>
        </div>
        <div className="rounded-[1.75rem] bg-orange-50 px-4 py-3 text-center">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-orange-500">
            prezențe
          </p>
          <p className="text-2xl font-black text-[#2f2a25]">
            {dashboardData.totalAttendanceCount}
          </p>
        </div>
        {dashboardData.totalAttendanceCount > 0 && (
          <button
            type="button"
            onClick={onExportCurrentResults}
            className="col-span-2 flex h-10 items-center justify-center rounded-[1.75rem] bg-white px-4 text-xs font-black text-orange-700 ring-1 ring-orange-100 transition hover:bg-orange-50"
          >
            Exportă lista în Excel
          </button>
        )}
        {dashboardData.totalAttendanceCount > 0 && (
          <button
            type="button"
            onClick={onDeleteCurrentResults}
            className="col-span-2 flex h-10 items-center justify-center rounded-[1.75rem] bg-red-50 px-4 text-xs font-black text-red-700 ring-1 ring-red-100 transition hover:bg-red-100"
          >
            Șterge rezultatul curent
          </button>
        )}
        {hasSearched && dashboardData.totalStudents > 0 && (
          <button
            type="button"
            onClick={onOpenFilters}
            className={`col-span-2 flex h-10 items-center justify-center rounded-[1.75rem] px-4 text-xs font-black ring-1 ring-orange-100 transition hover:bg-orange-50 ${
              hasActiveResultFilters
                ? "bg-orange-50 text-orange-700"
                : "bg-white text-orange-700"
            }`}
          >
            {hasActiveResultFilters ? "Filtre active" : "Filtrează rezultatele"}
          </button>
        )}
      </div>
    </div>
  );
}
