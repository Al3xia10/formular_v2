"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardHero from "./dashboard/DashboardHero";
import DisciplineCatalogModal from "./dashboard/DisciplineCatalogModal";
import DisciplineTotalsCard from "./dashboard/DisciplineTotalsCard";
import FiltersModal from "./dashboard/FiltersModal";
import GroupAttendancePanel from "./dashboard/GroupAttendancePanel";
import PaginationCard from "./dashboard/PaginationCard";
import ResultsOverview from "./dashboard/ResultsOverview";
import SearchPanel from "./dashboard/SearchPanel";
import StudentsList from "./dashboard/StudentsList";
import {
  EMPTY_DASHBOARD_DATA,
  INITIAL_RESULT_FILTERS,
} from "./dashboard/constants";
import {
  attendanceToExcelRows,
  buildDashboardQueryParams,
  downloadDisciplineCatalogWorkbook,
  downloadExcelFile,
} from "./dashboard/utils";

export default function ProfessorDashboard() {
  const [search, setSearch] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [activeDisciplina, setActiveDisciplina] = useState("");
  const [resultFilters, setResultFilters] = useState(INITIAL_RESULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState(INITIAL_RESULT_FILTERS);
  const [sortBy, setSortBy] = useState("name-asc");
  const [draftSortBy, setDraftSortBy] = useState("name-asc");
  const [page, setPage] = useState(1);
  const [dashboardData, setDashboardData] = useState(EMPTY_DASHBOARD_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [disciplineOptions, setDisciplineOptions] = useState([]);
  const [academicOptions, setAcademicOptions] = useState({
    studyYears: [],
    series: [],
    groupCodes: [],
    disciplines: [],
  });
  const [groupFilters, setGroupFilters] = useState({
    studyYear: "",
    groupCode: "",
    series: "",
    disciplina: "",
  });
  const [groupAttendanceData, setGroupAttendanceData] = useState(null);
  const [groupAttendanceLoading, setGroupAttendanceLoading] = useState(false);
  const [groupAttendanceError, setGroupAttendanceError] = useState("");
  const [disciplineCatalogData, setDisciplineCatalogData] = useState(null);
  const [disciplineCatalogLoading, setDisciplineCatalogLoading] = useState(false);
  const [disciplineCatalogError, setDisciplineCatalogError] = useState("");
  const [showDisciplineCatalogModal, setShowDisciplineCatalogModal] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadAcademicOptions() {
      try {
        const response = await fetch("/api/academic-options", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Nu am putut încărca disciplinele.");
        }

        if (!isCancelled) {
          setAcademicOptions({
            studyYears: data.studyYears || [],
            series: data.series || [],
            groupCodes: data.groupCodes || [],
            disciplines: data.disciplines || [],
          });
          setDisciplineOptions(data.disciplines || []);
        }
      } catch (err) {
        if (!isCancelled) {
          setError((current) => current || err.message);
        }
      }
    }

    loadAcademicOptions();

    return () => {
      isCancelled = true;
    };
  }, []);

  const hasActiveResultFilters = Boolean(
    resultFilters.disciplina ||
    resultFilters.grupa ||
    resultFilters.an ||
    resultFilters.serie ||
    resultFilters.sessionId ||
    resultFilters.dateFrom ||
    resultFilters.dateTo ||
    sortBy !== "name-asc",
  );

  const selectedDisciplineLabel =
    resultFilters.disciplina || activeDisciplina || "toate disciplinele";

  const visiblePages = Array.from(
    { length: dashboardData.totalPages },
    (_, index) => index + 1,
  ).filter((pageNumber) => {
    if (dashboardData.totalPages <= 5) {
      return true;
    }

    if (pageNumber === 1 || pageNumber === dashboardData.totalPages) {
      return true;
    }

    return Math.abs(pageNumber - page) <= 1;
  });

  const fetchDashboardData = useCallback(
    async ({
      nextSearch = activeSearch,
      nextDisciplina = activeDisciplina,
      nextPage = page,
      nextResultFilters = resultFilters,
      nextSortBy = sortBy,
      exportAll = false,
    } = {}) => {
      const params = buildDashboardQueryParams({
        nextSearch,
        nextDisciplina,
        nextResultFilters,
        nextSortBy,
        nextPage,
        exportAll,
      });

      const response = await fetch(
        `/api/profesor/attendance?${params.toString()}`,
        { cache: "no-store" },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Nu am putut încărca prezențele.");
      }

      return {
        ...EMPTY_DASHBOARD_DATA,
        ...data,
      };
    },
    [activeDisciplina, activeSearch, page, resultFilters, sortBy],
  );

  useEffect(() => {
    if (!hasSearched) {
      return undefined;
    }

    let isCancelled = false;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchDashboardData();

        if (!isCancelled) {
          setDashboardData(data);
          setPage(data.page);
        }
      } catch (err) {
        if (!isCancelled) {
          setDashboardData(EMPTY_DASHBOARD_DATA);
          setError(err.message);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [fetchDashboardData, hasSearched]);

  const resetSearchState = () => {
    setExpandedStudent(null);
    setShowFiltersModal(false);
    setResultFilters(INITIAL_RESULT_FILTERS);
    setDraftFilters(INITIAL_RESULT_FILTERS);
    setSortBy("name-asc");
    setDraftSortBy("name-asc");
    setPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    resetSearchState();
    setActiveSearch(search);
    setActiveDisciplina(disciplina);
    setHasSearched(true);
  };

  const handleShowAllStudents = () => {
    setSearch("");
    setDisciplina("");
    resetSearchState();
    setActiveSearch("");
    setActiveDisciplina("");
    setHasSearched(true);
  };

  const handleGoToPage = (nextPage) => {
    if (
      loading ||
      nextPage === page ||
      nextPage < 1 ||
      nextPage > dashboardData.totalPages
    ) {
      return;
    }

    setExpandedStudent(null);
    setShowFiltersModal(false);
    setPage(nextPage);
  };

  const handleOpenFilters = () => {
    setDraftFilters(resultFilters);
    setDraftSortBy(sortBy);
    setShowFiltersModal(true);
  };

  const handleApplyFilters = () => {
    setExpandedStudent(null);
    setResultFilters(draftFilters);
    setSortBy(draftSortBy);
    setPage(1);
    setShowFiltersModal(false);
  };

  const handleExportCurrentResults = async () => {
    if (dashboardData.totalAttendanceCount === 0) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await fetchDashboardData({ nextPage: 1, exportAll: true });
      downloadExcelFile(
        `prezente-dashboard-${new Date().toISOString().slice(0, 10)}.xlsx`,
        attendanceToExcelRows(data.exportAttendance),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCurrentResults = async () => {
    if (dashboardData.totalAttendanceCount === 0 || loading) {
      return;
    }

    const shouldDelete = window.confirm(
      `Sigur vrei să ștergi ${dashboardData.totalAttendanceCount} prezențe din rezultatul curent? Acțiunea va încerca să șteargă și pozele asociate și nu se poate anula.`,
    );

    if (!shouldDelete) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = buildDashboardQueryParams({
        nextSearch: activeSearch,
        nextDisciplina: activeDisciplina,
        nextResultFilters: resultFilters,
        nextSortBy: sortBy,
        nextPage: 1,
        exportAll: true,
      });
      const response = await fetch(
        `/api/profesor/attendance?${params.toString()}`,
        {
          method: "DELETE",
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Nu am putut șterge prezențele.");
      }

      const refreshedData = await fetchDashboardData({ nextPage: 1 });
      setDashboardData(refreshedData);
      setPage(refreshedData.page);
      setExpandedStudent(null);
      window.alert(
        `Au fost șterse ${data.deletedAttendanceCount || 0} prezențe.`,
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStudent = (studentKey) => {
    setExpandedStudent((current) =>
      current === studentKey ? null : studentKey,
    );
  };

  const fetchDisciplineCatalogData = async (selectedDiscipline) => {
    const params = new URLSearchParams({
      disciplina: selectedDiscipline,
    });
    const response = await fetch(
      `/api/profesor/discipline-group-attendance?${params.toString()}`,
      {
        cache: "no-store",
      },
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Nu am putut încărca situația pe disciplină.",
      );
    }

    return data;
  };

  const handleOpenDisciplineCatalog = async (selectedDiscipline) => {
    if (!selectedDiscipline || loading || disciplineCatalogLoading) {
      return;
    }
    setShowDisciplineCatalogModal(true);
    setDisciplineCatalogLoading(true);
    setDisciplineCatalogError("");
    setDisciplineCatalogData(null);

    try {
      const data = await fetchDisciplineCatalogData(selectedDiscipline);
      setDisciplineCatalogData(data);
    } catch (err) {
      setDisciplineCatalogError(err.message);
    } finally {
      setDisciplineCatalogLoading(false);
    }
  };

  const handleExportDisciplineCatalog = () => {
    if (!disciplineCatalogData?.groups?.length) {
      return;
    }

    downloadDisciplineCatalogWorkbook(
      `catalog-${disciplineCatalogData.disciplina
        .toLowerCase()
        .replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.xlsx`,
      disciplineCatalogData.disciplina,
      disciplineCatalogData.disciplineTypes,
      disciplineCatalogData.groups,
    );
  };

  const handleCloseDisciplineCatalogModal = () => {
    if (disciplineCatalogLoading) {
      return;
    }

    setShowDisciplineCatalogModal(false);
    setDisciplineCatalogError("");
  };

  const handleResetDraftFilters = () => {
    setDraftFilters(INITIAL_RESULT_FILTERS);
    setDraftSortBy("name-asc");
  };

  const handleChangeGroupFilter = (key, value) => {
    setGroupFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleChangeDraftFilter = (key, value) => {
    setDraftFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleLoadGroupAttendance = async (e) => {
    e.preventDefault();

    if (!groupFilters.studyYear || !groupFilters.groupCode) {
      setGroupAttendanceError("Selectează anul și grupa.");
      return;
    }

    setGroupAttendanceLoading(true);
    setGroupAttendanceError("");

    try {
      const params = new URLSearchParams();
      params.set("studyYear", groupFilters.studyYear);
      params.set("groupCode", groupFilters.groupCode);

      if (groupFilters.series) {
        params.set("series", groupFilters.series);
      }

      if (groupFilters.disciplina) {
        params.set("disciplina", groupFilters.disciplina);
      }

      const response = await fetch(
        `/api/profesor/group-attendance?${params.toString()}`,
        {
          cache: "no-store",
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Nu am putut încărca situația pe grupă.");
      }

      setGroupAttendanceData(data);
    } catch (err) {
      setGroupAttendanceError(err.message);
      setGroupAttendanceData(null);
    } finally {
      setGroupAttendanceLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fffaf4] px-4 py-6 text-[#2f2a25] sm:px-6 sm:py-10">
      <section className="mx-auto w-full max-w-5xl">
        <DashboardHero />

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.4fr]">
          <SearchPanel
            search={search}
            disciplina={disciplina}
            loading={loading}
            error={error}
            disciplineOptions={disciplineOptions}
            onSearchChange={setSearch}
            onDisciplinaChange={setDisciplina}
            onSubmit={handleSearch}
            onShowAllStudents={handleShowAllStudents}
          />

          <div className="rounded-[1.75rem] border border-orange-100 bg-white p-5 shadow-xl shadow-orange-100/70 sm:p-6">
            <ResultsOverview
              hasSearched={hasSearched}
              selectedDisciplineLabel={selectedDisciplineLabel}
              dashboardData={dashboardData}
              hasActiveResultFilters={hasActiveResultFilters}
              onExportCurrentResults={handleExportCurrentResults}
              onDeleteCurrentResults={handleDeleteCurrentResults}
              onOpenFilters={handleOpenFilters}
            />

            <DisciplineTotalsCard
              hasSearched={hasSearched}
              disciplineTotals={dashboardData.disciplineTotals}
              onSelectDiscipline={handleOpenDisciplineCatalog}
            />

            <PaginationCard
              hasSearched={hasSearched}
              totalStudents={dashboardData.totalStudents}
              page={dashboardData.page}
              totalPages={dashboardData.totalPages}
              pageStudentCount={dashboardData.pageStudentCount}
              pageAttendanceCount={dashboardData.pageAttendanceCount}
              totalAttendanceCount={dashboardData.totalAttendanceCount}
              visiblePages={visiblePages}
              loading={loading}
              hasMore={dashboardData.hasMore}
              onGoToPage={handleGoToPage}
            />

            <StudentsList
              hasSearched={hasSearched}
              totalStudents={dashboardData.totalStudents}
              students={dashboardData.students}
              expandedStudent={expandedStudent}
              onToggleStudent={handleToggleStudent}
            />
          </div>
        </div>

        <GroupAttendancePanel
          groupFilters={groupFilters}
          academicOptions={academicOptions}
          groupAttendanceData={groupAttendanceData}
          groupAttendanceLoading={groupAttendanceLoading}
          groupAttendanceError={groupAttendanceError}
          onChangeFilter={handleChangeGroupFilter}
          onSubmit={handleLoadGroupAttendance}
        />
      </section>

      <FiltersModal
        show={showFiltersModal}
        filterOptions={dashboardData.filterOptions}
        draftFilters={draftFilters}
        draftSortBy={draftSortBy}
        onChangeDraftFilter={handleChangeDraftFilter}
        onChangeDraftSortBy={setDraftSortBy}
        onClose={() => setShowFiltersModal(false)}
        onApply={handleApplyFilters}
        onReset={handleResetDraftFilters}
      />

      <DisciplineCatalogModal
        show={showDisciplineCatalogModal}
        loading={disciplineCatalogLoading}
        error={disciplineCatalogError}
        data={disciplineCatalogData}
        onClose={handleCloseDisciplineCatalogModal}
        onExport={handleExportDisciplineCatalog}
      />
    </main>
  );
}
