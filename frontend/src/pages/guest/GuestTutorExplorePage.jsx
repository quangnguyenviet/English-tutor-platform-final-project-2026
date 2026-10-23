import { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { Search, Users, ShieldCheck, ChevronRight, Flame, BookOpen } from "lucide-react";
import TutorCard from "../../components/guest/TutorCard";
import ClassRequestCard from "../../components/guest/ClassRequestCard";
import TutorFilterSidebar, { DEFAULT_FILTERS } from "../../components/guest/TutorFilterSidebar";
import { apiGetPublicTutors } from "../../lib/tutorApi";
import { mapPublicTutor } from "../../lib/publicTutorMapper";
import { getPageWindow } from "../../lib/pagination";
import { apiGetPublicClasses, mapPublicClass } from "../../lib/publicClassApi";

const TUTORS_PER_PAGE = 6;
const SEARCH_DEBOUNCE_MS = 400;

const GRADE_GROUP_BY_LABEL = {
  "Tiểu học (Lớp 1 - 5)": "tieuhoc",
  "THCS (Lớp 6 - 9)": "thcs",
  "THPT (Lớp 10 - 12)": "thpt",
  "Luyện thi Đại học": "thpt",
  "Người đi làm / Sinh viên": "nguoidilam",
};

// "TP. Hồ Chí Minh" -> "Hồ Chí Minh": backend tìm theo cụm từ, không theo tiền tố hành chính.
const stripCityPrefix = (value) => value.replace(/^TP\.\s*/i, "");

/** Chuyển bộ lọc trên giao diện thành query params cho API tìm gia sư. */
function buildTutorQuery(filters, page) {
  const province = filters.province && filters.province !== "Tất cả" ? stripCityPrefix(filters.province) : "";
  const district =
    filters.district && filters.district !== "Tất cả quận/huyện" ? stripCityPrefix(filters.district) : "";
  const genderMap = { Nam: "MALE", "Nữ": "FEMALE" };
  const modeMap = { Online: "ONLINE", "Tại nhà": "AT_HOME" };

  return {
    page: page - 1,
    size: TUTORS_PER_PAGE,
    keyword: filters.search?.trim(),
    province,
    district,
    gender: genderMap[filters.gender],
    teachingMode: modeMap[filters.learningMode],
    specialty: filters.subjects,
    gradeGroup: GRADE_GROUP_BY_LABEL[filters.gradeLevel],
  };
}

function StatsBadge({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15">
      <Icon className="w-4 h-4 text-blue-300" />
      <span className="font-bold text-white text-sm">{value}</span>
      <span className="text-white/70 text-xs">{label}</span>
    </div>
  );
}

export function GuestTutorExplorePage() {
  const { openContactModal } = useOutletContext() || {};
  const [tutors, setTutors] = useState([]);
  const [totalTutors, setTotalTutors] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingTutors, setIsLoadingTutors] = useState(true);
  const [tutorError, setTutorError] = useState("");
  const [publicClassListings, setPublicClassListings] = useState([]);
  const [totalClasses, setTotalClasses] = useState(0);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [classError, setClassError] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState(DEFAULT_FILTERS.search);
  const [currentPage, setCurrentPage] = useState(1);

  // Chỉ gọi API sau khi người dùng ngừng gõ ô tìm kiếm.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    let isMounted = true;

    async function loadTutors() {
      setIsLoadingTutors(true);
      setTutorError("");
      try {
        const result = await apiGetPublicTutors(
          buildTutorQuery({ ...filters, search: debouncedSearch }, currentPage),
        );
        if (!isMounted) return;
        setTutors(result.items.map(mapPublicTutor));
        setTotalTutors(result.totalItems);
        setTotalPages(Math.max(result.totalPages, 1));
      } catch (error) {
        if (isMounted) setTutorError(error.message || "Không thể tải danh sách gia sư.");
      } finally {
        if (isMounted) setIsLoadingTutors(false);
      }
    }

    loadTutors();
    return () => {
      isMounted = false;
    };
  }, [filters, debouncedSearch, currentPage]);

  useEffect(() => {
    let isMounted = true;

    async function loadClasses() {
      setIsLoadingClasses(true);
      setClassError("");
      try {
        const result = await apiGetPublicClasses({ page: 0, size: 6 });
        if (!isMounted) return;
        setPublicClassListings(result.items.map(mapPublicClass));
        setTotalClasses(result.totalItems);
      } catch (error) {
        if (isMounted) setClassError(error.message || "Không thể tải danh sách lớp cần gia sư.");
      } finally {
        if (isMounted) setIsLoadingClasses(false);
      }
    }

    loadClasses();
    return () => {
      isMounted = false;
    };
  }, []);

  const paginatedTutors = tutors;

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (pageNum) => {
    setCurrentPage(pageNum);
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-0 pb-20">
      {/* ══════════════════════════════════════════════════
          HERO BANNER
      ══════════════════════════════════════════════════ */}
      <section
        className="hero-gradient relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0B1220 0%, #111C31 60%, #1A2740 100%)" }}
      >
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm text-white text-xs font-semibold tracking-wide mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Hồ sơ gia sư tiếng Anh đã được EnglishPath thẩm định
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-3 leading-tight tracking-tight">
            Khám Phá & Chọn Gia Sư <span className="text-blue-300">Phù Hợp Nhất</span>
          </h1>
          <p className="text-white/80 text-xs sm:text-sm mb-6 max-w-xl mx-auto leading-relaxed">
            Tra cứu đội ngũ gia sư chuyên môn cao theo khu vực, cấp lớp và phong cách sư phạm. Nhận tư vấn để được ghép gia sư phù hợp.
          </p>

          <div className="flex flex-wrap justify-center gap-2.5">
            <StatsBadge
              icon={Users}
              value={isLoadingTutors && totalTutors === 0 ? "..." : totalTutors}
              label="Gia sư đang hoạt động"
            />
            <StatsBadge icon={ShieldCheck} value="Đã duyệt" label="Hồ sơ công khai" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FILTER SIDEBAR + TUTOR GRID
      ══════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8">
        {/* Mobile filter toggle */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tìm thấy <span className="font-bold text-slate-900 dark:text-white">{totalTutors}</span> gia sư
          </p>
          <TutorFilterSidebar onFilterChange={handleFilterChange} initialFilters={filters} />
        </div>

        <div className="flex gap-6 items-start">
          {/* Desktop sidebar */}
          <div className="hidden lg:block w-72 shrink-0">
            <TutorFilterSidebar onFilterChange={handleFilterChange} initialFilters={filters} />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Result count & Sort controls */}
            <div className="flex items-center justify-between mb-4 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <p className="text-slate-500 dark:text-slate-400">
                Hiển thị <span className="font-bold text-slate-900 dark:text-white">{paginatedTutors.length}</span> trên tổng số{" "}
                <span className="font-bold text-slate-900 dark:text-white">{totalTutors}</span> gia sư
                {totalPages > 1 && (
                  <span className="ml-1 text-slate-400">
                    (Trang {currentPage} / {totalPages})
                  </span>
                )}
              </p>
            </div>

            {/* Tutor Grid */}
            {isLoadingTutors ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="Đang tải danh sách gia sư">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="h-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 animate-pulse" />
                ))}
              </div>
            ) : tutorError ? (
              <div className="flex flex-col items-center justify-center py-16 text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/50">
                <Search className="w-10 h-10 text-rose-400 mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Không thể tải danh sách gia sư</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{tutorError}</p>
              </div>
            ) : paginatedTutors.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedTutors.map((tutor, i) => (
                    <TutorCard
                      key={tutor.id}
                      tutor={tutor}
                      index={i}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      Trước
                    </button>

                    {getPageWindow(currentPage, totalPages).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white shadow-md scale-105"
                            : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      Tiếp
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-20 text-center p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-400">
                  <Search size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  Không tìm thấy gia sư phù hợp
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mb-4">
                  Không có gia sư nào khớp với toàn bộ tiêu chí lọc hiện tại của bạn. Thử nới lỏng hoặc đặt lại bộ lọc.
                </p>
                <button
                  type="button"
                  onClick={() => handleFilterChange(DEFAULT_FILTERS)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          LỚP CẦN TÌM GIA SƯ
      ══════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wide">
              <Flame className="w-3.5 h-3.5" />
              <span>MỚI CẬP NHẬT</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Danh sách lớp cần tìm gia sư</h2>
          </div>
          {!isLoadingClasses && !classError && (
            <Link
              id="view-all-classes-btn"
              to="/classes"
              className="hidden sm:flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
            >
              Xem toàn bộ ({totalClasses} lớp)
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {isLoadingClasses ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="Đang tải danh sách lớp">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-72 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : classError ? (
          <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-slate-900 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {classError}
          </div>
        ) : publicClassListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicClassListings.slice(0, 6).map((listing, i) => (
              <ClassRequestCard key={listing.id} listing={listing} index={i} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Hiện chưa có lớp nào đang mở</p>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════
          CTA FOOTER
      ══════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-16">
        <div
          className="rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden border border-slate-200 dark:border-slate-800"
          style={{ background: "linear-gradient(135deg, #0B1220 0%, #111C31 60%, #1A2740 100%)" }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
              Bạn muốn tìm gia sư kèm riêng cho con?
            </h2>
            <p className="text-white/80 mb-8 max-w-md mx-auto text-xs sm:text-sm leading-relaxed">
              Điền nhanh biểu mẫu Smart-Match Form để trung tâm tư vấn hồ sơ phù hợp nhất chỉ trong vòng 12 giờ.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                id="cta-find-tutor-btn"
                onClick={openContactModal}
                className="px-8 py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 text-white hover:bg-blue-700 cursor-pointer transition-all shadow-md active:scale-95"
              >
                Đăng ký học thử 01 buổi miễn phí
              </button>
              <Link
                id="cta-register-tutor-btn"
                to="/tutor/register"
                className="px-8 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white border border-white/20 hover:bg-white/10 cursor-pointer transition-all inline-flex items-center justify-center"
              >
                Đăng ký làm gia sư
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default GuestTutorExplorePage;
