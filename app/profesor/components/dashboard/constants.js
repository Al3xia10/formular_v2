export const STUDENTS_PER_PAGE = 100;

export const INITIAL_RESULT_FILTERS = {
  disciplina: "",
  grupa: "",
  an: "",
  serie: "",
  sessionId: "",
  dateFrom: "",
  dateTo: "",
};

export const EMPTY_DASHBOARD_DATA = {
  students: [],
  filterOptions: {
    discipline: [],
    grupa: [],
    an: [],
    serie: [],
    session: [],
  },
  page: 1,
  pageSize: STUDENTS_PER_PAGE,
  totalPages: 1,
  hasMore: false,
  totalStudents: 0,
  totalAttendanceCount: 0,
  baseAttendanceCount: 0,
  pageStudentCount: 0,
  pageAttendanceCount: 0,
  exportAttendance: [],
  disciplineTotals: [],
  activeSession: null,
  recentSessionStats: [],
  suspiciousSignals: [],
};
