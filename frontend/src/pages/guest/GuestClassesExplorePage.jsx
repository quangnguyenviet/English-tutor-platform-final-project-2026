import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Flame,
  ChevronRight,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import { publicClassListings } from "../../data/mockData";
import ClassRequestCard from "../../components/guest/ClassRequestCard";

export default function GuestClassesExplorePage() {
  const [selectedMode, setSelectedMode] = useState("all");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const classesPerPage = 6;

  // Filter & Sort
  const filteredListings = useMemo(() => {
    return publicClassListings
      .filter((item) => {
        // Mode filter
        if (selectedMode !== "all") {
          if (item.teachingMode !== selectedMode) return false;
        }

        // Grade filter
        if (selectedGrade !== "all") {
          if (selectedGrade === "tieuhoc" && !item.gradeLevel?.includes("Lớp 1") && !item.gradeLevel?.includes("Lớp 2") && !item.gradeLevel?.includes("Lớp 3") && !item.gradeLevel?.includes("Cấp 1") && !item.gradeLevel?.includes("Mầm non")) return false;
          if (selectedGrade === "thcs" && !item.gradeLevel?.includes("Lớp 6") && !item.gradeLevel?.includes("Lớp 7") && !item.gradeLevel?.includes("Lớp 8") && !item.gradeLevel?.includes("Lớp 9") && !item.gradeLevel?.includes("Cấp 2")) return false;
          if (selectedGrade === "thpt" && !item.gradeLevel?.includes("Lớp 10") && !item.gradeLevel?.includes("Lớp 11") && !item.gradeLevel?.includes("Lớp 12") && !item.gradeLevel?.includes("Cấp 3")) return false;
          if (selectedGrade === "nguoidilam" && !item.gradeLevel?.includes("Người đi làm") && !item.gradeLevel?.includes("Tự do") && !item.gradeLevel?.includes("Sinh viên")) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "fee_desc") return b.feePerSession - a.feePerSession;
        if (sortBy === "fee_asc") return a.feePerSession - b.feePerSession;
        return 0; // default newest
      });
  }, [selectedMode, selectedGrade, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredListings.length / classesPerPage);
  const paginatedListings = useMemo(() => {
    const start = (currentPage - 1) * classesPerPage;
    return filteredListings.slice(start, start + classesPerPage);
  }, [filteredListings, currentPage, classesPerPage]);

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
            <span>CẬP NHẬT LIÊN TỤC 24/7</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Danh sách toàn bộ lớp cần tìm gia sư
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Hàng trăm lớp học mới mỗi ngày với mức học phí hấp dẫn. Trung tâm cam kết thu phí sau khi nhận lương!
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
                <option value="Tại nhà">🏠 Tại nhà</option>
                <option value="Online">🌐 Online</option>
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
        <div className="flex items-center justify-end mb-4">
          <Link
            to="/tutor/register"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>Đăng ký hồ sơ để nhận lớp nhanh</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Grid List (6 items per page) */}
        {paginatedListings.length > 0 ? (
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

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
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
