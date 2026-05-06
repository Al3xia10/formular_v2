export default function PaginationCard({
  hasSearched,
  totalStudents,
  page,
  totalPages,
  pageStudentCount,
  pageAttendanceCount,
  totalAttendanceCount,
  visiblePages,
  loading,
  hasMore,
  onGoToPage,
}) {
  if (!hasSearched || totalStudents <= 0) {
    return null;
  }

  return (
    <div
      style={{
        marginBottom: "20px",
        borderRadius: "28px",
        border: "1px solid #f4dfcb",
        backgroundColor: "#fffaf4",
        padding: "16px",
      }}
    >
      <div style={{ marginBottom: "14px", textAlign: "center" }}>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: 900,
            color: "#2f2a25",
          }}
        >
          Pagina {page} din {totalPages}
        </p>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: "12px",
            fontWeight: 700,
            color: "#806d62",
          }}
        >
          Se afișează {pageStudentCount} din {totalStudents} studenți •{" "}
          {pageAttendanceCount} din {totalAttendanceCount} prezențe.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        <button
          type="button"
          onClick={() => onGoToPage(page - 1)}
          disabled={loading || page === 1}
          style={{
            height: "40px",
            padding: "0 14px",
            borderRadius: "12px",
            border: "1px solid #e8e2dc",
            backgroundColor: "#ffffff",
            color: "#2f2a25",
            fontSize: "13px",
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: "0 4px 12px rgba(47, 42, 37, 0.06)",
            opacity: loading || page === 1 ? 0.45 : 1,
            cursor: loading || page === 1 ? "not-allowed" : "pointer",
          }}
        >
          <span style={{ fontSize: "18px", lineHeight: 1 }}>‹</span>
          Înapoi
        </button>

        {visiblePages.map((pageNumber, index) => {
          const previousPage = visiblePages[index - 1];
          const showDots = previousPage && pageNumber - previousPage > 1;
          const isActive = pageNumber === page;

          return (
            <div
              key={pageNumber}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {showDots && (
                <span
                  style={{
                    minWidth: "18px",
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "#806d62",
                    textAlign: "center",
                  }}
                >
                  ...
                </span>
              )}

              <button
                type="button"
                onClick={() => onGoToPage(pageNumber)}
                disabled={loading || isActive}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  border: isActive
                    ? "1px solid #ff7a1a"
                    : "1px solid #e8e2dc",
                  backgroundColor: isActive ? "#ff7a1a" : "#ffffff",
                  color: isActive ? "#ffffff" : "#2f2a25",
                  fontSize: "14px",
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: isActive
                    ? "0 8px 18px rgba(255, 122, 26, 0.25)"
                    : "0 4px 12px rgba(47, 42, 37, 0.06)",
                  opacity: loading ? 0.65 : 1,
                  cursor: loading || isActive ? "not-allowed" : "pointer",
                }}
              >
                {pageNumber}
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => onGoToPage(page + 1)}
          disabled={loading || !hasMore}
          style={{
            height: "40px",
            padding: "0 14px",
            borderRadius: "12px",
            border: "1px solid #e8e2dc",
            backgroundColor: "#ffffff",
            color: "#2f2a25",
            fontSize: "13px",
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: "0 4px 12px rgba(47, 42, 37, 0.06)",
            opacity: loading || !hasMore ? 0.45 : 1,
            cursor: loading || !hasMore ? "not-allowed" : "pointer",
          }}
        >
          Înainte
          <span style={{ fontSize: "18px", lineHeight: 1 }}>›</span>
        </button>
      </div>
    </div>
  );
}
