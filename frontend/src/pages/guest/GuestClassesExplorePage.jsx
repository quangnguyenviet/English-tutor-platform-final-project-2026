import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Flame,
  ChevronRight,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import ClassRequestCard from "../../components/guest/ClassRequestCard";
import { apiGetPublicClasses, mapPublicClass } from "../../lib/publicClassApi";
import { getPageWindow } from "../../lib/pagination";

const CLASSES_PER_PAGE = 6;
const MODE_PARAM = { all: "", "Tại nhà": "AT_HOME", Online: "ONLINE" };

export default function GuestClassesExplorePage() {
  const [publicClassListings, setPublicClassListings] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedMode, setSelectedMode] = useState("all");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  // Lọc, sắp xếp và phân trang đều chạy ở server; mỗi lần chỉ tải một trang.
  useEffect(() => {
    let isMounted = true;

    async function loadClasses() {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const result = await apiGetPublicClasses({
          page: currentPage - 1,
          size: CLASSES_PER_PAGE,
          teachingMode: MODE_PARAM[selectedMode],
          gradeGroup: selectedGrade === "all" ? "" : selectedGrade,
          sort: sortBy,
        });
        if (!isMounted) return;
        setPublicClassListings(result.items.map(mapPublicClass));
        setTotalItems(result.totalItems);
        setTotalPages(Math.max(result.totalPages, 1));
      } catch (error) {
        if (isMounted) setErrorMessage(error.message || "Không thể tải danh sách lớp cần gia sư.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadClasses();
    return () => {
      isMounted = false;
    };
  }, [currentPage, selectedMode, selectedGrade, sortBy]);

  const paginatedListings = publicClassListings;

  const handleResetFilters = () => {
    setSelectedMode("all");
    setSelectedGrade("all");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const handlePageChange = (pageNum) => {
    setCurrentPage(pageNum);
    window.scrollTo({ top: 220, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* ══════════════════════════════════════════════════
          HERO BANNER
      ══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Flame className="w-3.5 h-3.5 text-primary" />
            <span>DỮ LIỆU TRỰC TIẾP TỪ HỆ THỐNG</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Danh sách toàn bộ lớp cần tìm gia sư
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Theo dõi các lớp đang mở và chọn yêu cầu phù hợp với chuyên môn, lịch dạy của bạn.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FILTER & CONTENT SECTION
      ══════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Filter Controls Bar */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm mb-8 space-y-3">
          {(selectedMode !== "all" || selectedGrade !== "all" || sortBy !== "newest") && (
            <div className="flex items-center justify-end pb-1 border-b border-border/60">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Đặt lại bộ lọc</span>
              </button>
            </div>
          )}

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Sắp xếp */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Sắp xếp:</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="newest">Mới nhất</option>
                <option value="fee_desc">Học phí cao nhất</option>
                <option value="fee_asc">Học phí thấp nhất</option>
              </select>
            </div>

            {/* Mode Select */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Hình thức dạy:</label>
              <select
                value={selectedMode}
                onChange={(e) => {
                  setSelectedMode(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="all">Tất cả hình thức</option>
                <option value="Tại nhà">Tại nhà</option>
                <option value="Online">Online</option>
              </select>
            </div>

            {/* Grade Select */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Cấp học:</label>
              <select
                value={selectedGrade}
                onChange={(e) => {
                  setSelectedGrade(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="all">Tất cả cấp học</option>
                <option value="tieuhoc">Tiểu học (Lớp 1-5)</option>
                <option value="thcs">THCS (Lớp 6-9)</option>
                <option value="thpt">THPT (Lớp 10-12)</option>
                <option value="nguoidilam">Người đi làm / Tự do</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Link to Register */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-muted-foreground">
            Tìm thấy <span className="font-bold text-foreground">{totalItems}</span> lớp
          </p>
          <Link
            to="/tutor/register"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>Đăng ký hồ sơ để nhận lớp nhanh</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Grid List (6 items per page) */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-label="Đang tải danh sách lớp">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-72 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : errorMessage ? (
          <div className="p-10 text-center rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-card">
            <BookOpen className="w-10 h-10 mx-auto text-rose-400" />
            <h3 className="mt-3 text-base font-bold text-foreground">Không thể tải danh sách lớp</h3>
            <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
          </div>
        ) : paginatedListings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedListings.map((listing, i) => (
                <ClassRequestCard key={listing.id} listing={listing} index={i} />
              ))}
            </div>

            {/* Pagination Tabs 1, 2, 3 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-10">
                <button
                  type="button"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
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
                        ? "bg-primary text-primary-foreground shadow-md scale-105"
                        : "border border-border bg-card hover:bg-muted text-foreground"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  Tiếp
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center rounded-3xl border border-border bg-card space-y-4 my-8">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">Không tìm thấy lớp học phù hợp</h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                Hãy thử chọn tiêu chí khác hoặc bấm &ldquo;Đặt lại&rdquo; để xem toàn bộ danh sách lớp.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
