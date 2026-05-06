import * as XLSX from "xlsx";
import { STUDENTS_PER_PAGE } from "./constants";

function sortCatalogGroups(groups) {
  return [...groups].sort((left, right) => {
    const yearDiff = Number(left.studyYear) - Number(right.studyYear);
    if (yearDiff !== 0) {
      return yearDiff;
    }

    const groupDiff = Number(left.groupCode) - Number(right.groupCode);
    if (groupDiff !== 0) {
      return groupDiff;
    }

    return (left.series || "").localeCompare(right.series || "", "ro");
  });
}

function sortCatalogStudents(students) {
  return [...students].sort((left, right) =>
    left.fullName.localeCompare(right.fullName, "ro", {
      sensitivity: "base",
    }),
  );
}

function sanitizeSheetName(value) {
  return String(value || "Foaie")
    .replace(/[:\\/?*\[\]]/g, " ")
    .trim()
    .slice(0, 31) || "Foaie";
}

function writeWorkbookFile(workbook, filename) {
  XLSX.writeFile(workbook, filename, {
    bookType: "xlsx",
    compression: true,
  });
}

export function formatSessionDateTime(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function downloadExcelFile(filename, rows) {
  const headers = [
    "Nume",
    "Email",
    "Grupa",
    "An",
    "Serie",
    "Disciplina",
    "Tip disciplina",
    "Data",
    "Ora",
    "QR valid",
    "Link poza",
  ];
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  worksheet["!cols"] = [
    { wch: 28 },
    { wch: 32 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 28 },
    { wch: 18 },
    { wch: 14 },
    { wch: 12 },
    { wch: 10 },
    { wch: 60 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Prezente");
  writeWorkbookFile(workbook, filename);
}

export function attendanceToExcelRows(attendance) {
  return attendance.map((item) => [
    item.nume,
    item.email,
    item.grupa,
    item.an,
    item.serie,
    item.disciplina,
    item.tip_disciplina,
    item.data,
    item.ora,
    item.valid_qr ? "Da" : "Nu",
    item.poza_url || "",
  ]);
}

export function downloadDisciplineCatalogWorkbook(
  filename,
  disciplina,
  disciplineTypes,
  groups,
) {
  const workbook = XLSX.utils.book_new();
  const orderedGroups = sortCatalogGroups(groups).map((group) => ({
    ...group,
    students: sortCatalogStudents(group.students),
  }));
  const catalogRows = [
    ["Disciplina", disciplina],
    [],
    [
      "An",
      "Serie",
      "Grupa",
      "Student",
      ...disciplineTypes,
      "Total",
      "Status",
    ],
  ];

  const summaryRows = [
    ["Disciplina", disciplina],
    [],
    [
      "Grupă",
      "Studenți",
      "Absenți",
      ...disciplineTypes,
    ],
  ];

  for (const group of orderedGroups) {
    const totalsByType = disciplineTypes.map((type) =>
      group.students.reduce(
        (sum, student) => sum + (student.typeCounts[type] || 0),
        0,
      ),
    );

    summaryRows.push([
      group.label,
      group.summary.totalStudents,
      group.summary.absentCount,
      ...totalsByType,
    ]);

    for (const student of group.students) {
      catalogRows.push([
        student.studyYear,
        student.series || "",
        student.groupCode,
        student.fullName,
        ...disciplineTypes.map((type) => student.typeCounts[type] || 0),
        student.totalAttendance,
        student.status,
      ]);
    }

    catalogRows.push([]);
  }

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet["!cols"] = [
    { wch: 28 },
    { wch: 12 },
    { wch: 12 },
    ...disciplineTypes.map(() => ({ wch: 12 })),
  ];
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Rezumat");

  const catalogSheet = XLSX.utils.aoa_to_sheet(catalogRows);
  catalogSheet["!cols"] = [
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 34 },
    ...disciplineTypes.map(() => ({ wch: 12 })),
    { wch: 10 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(workbook, catalogSheet, "Catalog complet");

  for (const group of orderedGroups) {
    const rows = [
      [
        "Student",
        "An",
        "Serie",
        "Grupa",
        ...disciplineTypes,
        "Total",
        "Status",
      ],
      ...group.students.map((student) => [
        student.fullName,
        student.studyYear,
        student.series || "",
        student.groupCode,
        ...disciplineTypes.map((type) => student.typeCounts[type] || 0),
        student.totalAttendance,
        student.status,
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 34 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      ...disciplineTypes.map(() => ({ wch: 12 })),
      { wch: 10 },
      { wch: 16 },
    ];

    const sheetName = sanitizeSheetName(group.label);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  writeWorkbookFile(workbook, filename);
}

export function buildDashboardQueryParams({
  nextSearch,
  nextDisciplina,
  nextResultFilters,
  nextSortBy,
  nextPage,
  exportAll,
}) {
  const params = new URLSearchParams();

  if (nextSearch.trim()) {
    params.set("search", nextSearch.trim());
  }

  if (nextDisciplina) {
    params.set("disciplina", nextDisciplina);
  }

  if (nextResultFilters.disciplina) {
    params.set("resultDisciplina", nextResultFilters.disciplina);
  }

  if (nextResultFilters.grupa) {
    params.set("resultGrupa", nextResultFilters.grupa);
  }

  if (nextResultFilters.an) {
    params.set("resultAn", nextResultFilters.an);
  }

  if (nextResultFilters.serie) {
    params.set("resultSerie", nextResultFilters.serie);
  }

  if (nextResultFilters.sessionId) {
    params.set("resultSessionId", nextResultFilters.sessionId);
  }

  if (nextResultFilters.dateFrom) {
    params.set("resultDateFrom", nextResultFilters.dateFrom);
  }

  if (nextResultFilters.dateTo) {
    params.set("resultDateTo", nextResultFilters.dateTo);
  }

  params.set("sortBy", nextSortBy);
  params.set("page", String(nextPage));
  params.set("pageSize", String(STUDENTS_PER_PAGE));

  if (exportAll) {
    params.set("exportAll", "1");
  }

  return params;
}
