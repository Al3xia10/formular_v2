export default function FiltersModal({
  show,
  filterOptions,
  draftFilters,
  draftSortBy,
  onChangeDraftFilter,
  onChangeDraftSortBy,
  onClose,
  onApply,
  onReset,
}) {
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
          maxWidth: "380px",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: "28px",
          backgroundColor: "rgba(255, 255, 255, 0.96)",
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.25)",
          border: "1px solid rgba(255, 255, 255, 0.7)",
          padding: "20px",
          position: "relative",
        }}
      >
        <div className="mb-5 pr-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
              filtre rezultate
            </p>
            <h2 className="mt-1 text-xl font-black text-[#2f2a25]">
              Sortează lista
            </h2>
            <p className="mt-1 text-xs leading-5 text-[#806d62]">
              Filtrele se aplică pe toate rezultatele găsite, nu doar pe pagina
              curentă.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ position: "absolute", top: "18px", right: "18px" }}
            className="flex h-8 w-8 items-center justify-center text-2xl font-black leading-none text-[#2f2a25] transition hover:text-orange-600"
            aria-label="Închide filtrele"
          >
            ×
          </button>
        </div>

        <div className="grid gap-3">
          <select
            value={draftSortBy}
            onChange={(e) => onChangeDraftSortBy(e.target.value)}
            className="h-10 w-full rounded-[1rem] border border-[#ead8c8] bg-[#fffaf4] px-3 text-xs font-bold text-[#2f2a25] outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
          >
            <option value="name-asc">Alfabetic A-Z</option>
            <option value="name-desc">Alfabetic Z-A</option>
            <option value="total-desc">Cele mai multe prezențe</option>
            <option value="total-asc">Cele mai puține prezențe</option>
            <option value="date-desc">Cele mai recente primele</option>
            <option value="date-asc">Cele mai vechi primele</option>
          </select>

          <select
            value={draftFilters.disciplina}
            onChange={(e) => onChangeDraftFilter("disciplina", e.target.value)}
            className="h-10 w-full rounded-[1rem] border border-[#ead8c8] bg-[#fffaf4] px-3 text-xs font-bold text-[#2f2a25] outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
          >
            <option value="">Toate disciplinele</option>
            {filterOptions.discipline.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-3 gap-3">
            <select
              value={draftFilters.grupa}
              onChange={(e) => onChangeDraftFilter("grupa", e.target.value)}
              className="h-10 rounded-[1rem] border border-[#ead8c8] bg-[#fffaf4] px-2 text-xs font-bold outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            >
              <option value="">Grupe</option>
              {filterOptions.grupa.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={draftFilters.an}
              onChange={(e) => onChangeDraftFilter("an", e.target.value)}
              className="h-10 rounded-[1rem] border border-[#ead8c8] bg-[#fffaf4] px-2 text-xs font-bold outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            >
              <option value="">Ani</option>
              {filterOptions.an.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={draftFilters.serie}
              onChange={(e) => onChangeDraftFilter("serie", e.target.value)}
              className="h-10 rounded-[1rem] border border-[#ead8c8] bg-[#fffaf4] px-2 text-xs font-bold outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            >
              <option value="">Serii</option>
              {filterOptions.serie.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <input
            type="date"
            value={draftFilters.dateFrom}
            onChange={(e) => onChangeDraftFilter("dateFrom", e.target.value)}
            className="h-10 w-full rounded-[1rem] border border-[#ead8c8] bg-[#fffaf4] px-3 text-xs font-bold text-[#2f2a25] outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
          />

          <input
            type="date"
            value={draftFilters.dateTo}
            onChange={(e) => onChangeDraftFilter("dateTo", e.target.value)}
            className="h-10 w-full rounded-[1rem] border border-[#ead8c8] bg-[#fffaf4] px-3 text-xs font-bold text-[#2f2a25] outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
          />

          <select
            value={draftFilters.sessionId}
            onChange={(e) => onChangeDraftFilter("sessionId", e.target.value)}
            className="h-10 w-full rounded-[1rem] border border-[#ead8c8] bg-[#fffaf4] px-3 text-xs font-bold text-[#2f2a25] outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
          >
            <option value="">Toate sesiunile QR</option>
            {filterOptions.session.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onReset}
            className="flex h-10 items-center justify-center rounded-[1rem] bg-orange-50 px-3 text-xs font-black text-orange-700 ring-1 ring-orange-100 transition hover:bg-orange-100"
          >
            Curăță filtre
          </button>

          <button
            type="button"
            onClick={onApply}
            style={{ backgroundColor: "#ff7a1a", color: "#ffffff" }}
            className="flex h-10 items-center justify-center rounded-[1rem] px-3 text-xs font-black shadow-lg shadow-orange-200 transition hover:opacity-90"
          >
            Aplică
          </button>
        </div>
      </div>
    </div>
  );
}
