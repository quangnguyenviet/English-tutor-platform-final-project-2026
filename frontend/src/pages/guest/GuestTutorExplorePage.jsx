import { useState, useMemo } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { Search, Users, ShieldCheck, TrendingUp, ChevronRight, BookOpen, Flame, SlidersHorizontal, Sparkles } from "lucide-react";
import { tutors, publicClassListings } from "../../data/mockData";
import TutorCard from "../../components/guest/TutorCard";
import ClassRequestCard from "../../components/guest/ClassRequestCard";
import TutorFilterSidebar, { DEFAULT_FILTERS } from "../../components/guest/TutorFilterSidebar";

// ── Helpers ────────────────────────────────────────────────────────────────────

// ── Filter Matching (3 Tiêu chí: Chuyên môn, Thành tích nổi bật, Giới tính) ─────

function applyFilters(list, filters) {
  return list.filter((t) => {
    // 1. Text search
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      const haystack = [
        t.name,
        t.university,
        t.location,
        t.currentAddress,
        t.gender,
        ...(t.subjects || []),
        ...(t.specialization || []),
        ...(t.highlights || []),
        t.bio || ""
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    // 2. Chuyên môn Tiếng Anh
    if (filters.subjects && filters.subjects.length > 0) {
      const matchSubject = filters.subjects.some((s) => {
        const sLow = s.toLowerCase();
        const combinedText = [
          ...(t.subjects || []),
          ...(t.specialization || []),
          t.bio || "",
          t.university || ""
        ].join(" ").toLowerCase();

        if (combinedText.includes(sLow)) return true;
        if (sLow.includes("ielts") && combinedText.includes("ielts")) return true;
        if (sLow.includes("toeic") && combinedText.includes("toeic")) return true;
        if (sLow.includes("giao tiếp") && (combinedText.includes("giao tiếp") || combinedText.includes("speaking"))) return true;
        if (sLow.includes("thpt") && (combinedText.includes("thpt") || combinedText.includes("cấp 3"))) return true;
        if (sLow.includes("thcs") && (combinedText.includes("thcs") || combinedText.includes("cấp 2") || combinedText.includes("chuyên"))) return true;
        if (sLow.includes("tiểu học") && (combinedText.includes("tiểu học") || combinedText.includes("cấp 1"))) return true;
        if (sLow.includes("ngữ pháp") && combinedText.includes("ngữ pháp")) return true;
        if (sLow.includes("phát âm") && (combinedText.includes("phát âm") || combinedText.includes("ipa"))) return true;
        if (sLow.includes("mất gốc") && combinedText.includes("mất gốc")) return true;

        return false;
      });
      if (!matchSubject) return false;
    }

    // 3. Thành tích nổi bật
    if (filters.highlights && filters.highlights.length > 0) {
      const matchHighlight = filters.highlights.some((h) => {
        const hLow = h.toLowerCase();
        const inHighlights = (t.highlights || []).some(
          (th) => th.toLowerCase().includes(hLow) || hLow.includes(th.toLowerCase())
        );
        if (inHighlights) return true;

        const bioAwardsText = [
          t.bio || "",
          t.highSchool || "",
          t.academicRank || "",
          ...(t.awards || []).map((a) => a.title || ""),
          ...(t.certificates || []).map((c) => c.name || "")
        ].join(" ").toLowerCase();

        return bioAwardsText.includes(hLow);
      });
      if (!matchHighlight) return false;
    }

    // 4. Giới tính
    if (filters.gender && filters.gender !== "Tất cả") {
      if ((t.gender || "").toLowerCase() !== filters.gender.toLowerCase()) return false;
    }

    return true;
  });
}

// ── Stats Banner ───────────────────────────────────────────────────────────────

function StatsBadge({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15">
      <Icon className="w-4 h-4 text-blue-300" />
      <span className="font-bold text-white text-sm">{value}</span>
      <span className="text-white/70 text-xs">{label}</span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function GuestTutorExplorePage() {
  const { openContactModal } = useOutletContext() || {};
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const tutorsPerPage = 6;

  const filteredTutors = useMemo(
    () => applyFilters(tutors, filters),
    [filters]
  );

  // Pagination calculation
  const totalPages = Math.ceil(filteredTutors.length / tutorsPerPage);
  const paginatedTutors = useMemo(() => {
    const start = (currentPage - 1) * tutorsPerPage;
    return filteredTutors.slice(start, start + tutorsPerPage);
  }, [filteredTutors, currentPage, tutorsPerPage]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (pageNum) => {
    setCurrentPage(pageNum);
    // Smooth scroll to top of list
    window.scrollTo({ top: 460, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-0 pb-20">
      {/* ══════════════════════════════════════════════════
          SECTION 1 — Hero
      ══════════════════════════════════════════════════ */}
      <section
        className="hero-gradient relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0B1220 0%, #111C31 60%, #1A2740 100%)" }}
      >
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 py-14 text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm text-white text-xs font-semibold tracking-wide mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Đội ngũ gia sư hàng đầu & Lớp học cập nhật liên tục
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-3 leading-tight tracking-tight">
            Tìm Gia Sư{" "}
            <span className="text-blue-300">
              Phù Hợp Nhất
            </span>
          </h1>
          <p className="text-white/80 text-sm sm:text-base mb-8 max-w-xl mx-auto leading-relaxed">
            Kết nối nhanh chóng với các gia sư chất lượng cao
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-3">
            <StatsBadge icon={Users} value={`${tutors.length}+`} label="Gia sư chọn lọc" />
            <StatsBadge icon={ShieldCheck} value="100%" label="Hồ sơ xác thực" />
            <StatsBadge icon={TrendingUp} value="98%" label="Hài lòng" />
            <StatsBadge icon={BookOpen} value="10+" label="Chuyên môn Tiếng Anh" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 2 — Filter Sidebar + Tutor Grid
      ══════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8">
        {/* Mobile filter toggle row */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{filteredTutors.length}</span> gia sư
          </p>
          <TutorFilterSidebar onFilterChange={handleFilterChange} />
        </div>

        <div className="flex gap-6 items-start">
          {/* Desktop sidebar */}
          <div className="hidden lg:block w-72 shrink-0">
            <TutorFilterSidebar onFilterChange={handleFilterChange} />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Result count + sort */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-muted-foreground hidden lg:block">
                Tìm thấy{" "}
                <span className="font-bold text-foreground">{filteredTutors.length}</span> gia sư
                {filters.search && (
                  <> cho &ldquo;<span className="text-primary">{filters.search}</span>&rdquo;</>
                )}
                {totalPages > 1 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (Trang {currentPage} / {totalPages})
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Sắp xếp:</span>
                <select className="border border-border rounded-lg px-2 py-1 text-xs bg-card text-foreground cursor-pointer">
                  <option>Mới tham gia</option>
                  <option>Giá thấp nhất</option>
                  <option>Kinh nghiệm nhiều nhất</option>
                </select>
              </div>
            </div>

            {/* Tutor grid */}
            {paginatedTutors.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {paginatedTutors.map((tutor, i) => (
                    <TutorCard
                      key={tutor.id}
                      tutor={tutor}
                      index={i}
                      onContact={openContactModal}
                    />
                  ))}
                </div>

                {/* Pagination Controls (Ô 1, 2, 3, 4...) */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-1.5 sm:gap-2">
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
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentPage === pageNum
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
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Không tìm thấy gia sư</h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Thử điều chỉnh bộ lọc hoặc tìm với từ khóa khác.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 3 — Public Class Listings (Lớp cần gia sư)
      ══════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-16">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold tracking-wide">
              <Flame className="w-3.5 h-3.5" />
              <span>MỚI NHẤT</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">Danh sách lớp cần tìm gia sư</h2>
          </div>
          <Link
            id="view-all-classes-btn"
            to="/classes"
            className="hidden sm:flex items-center gap-1 text-sm text-primary font-semibold hover:underline cursor-pointer"
          >
            Xem toàn bộ ({publicClassListings.length} lớp)
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Divider */}
        <div className="w-full h-px mb-8 bg-border" />

        {/* Class request grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {publicClassListings.slice(0, 6).map((listing, i) => (
            <ClassRequestCard
              key={listing.id}
              listing={listing}
              index={i}
            />
          ))}
        </div>


      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 4 — CTA Banner
      ══════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-16">
        <div
          className="rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden border border-border"
          style={{ background: "linear-gradient(135deg, #0B1220 0%, #111C31 60%, #1A2740 100%)" }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
              Bạn là gia sư muốn tìm học sinh?
            </h2>
            <p className="text-white/80 mb-8 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
              Đăng ký ngay hôm nay để được kết nối với hàng trăm phụ huynh đang có nhu cầu tìm gia sư phù hợp.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                id="cta-register-tutor-btn"
                to="/tutor/register"
                className="px-8 py-3.5 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer transition-all shadow-md active:scale-95 inline-flex items-center justify-center"
              >
                Đăng ký làm gia sư
              </Link>
              <button
                id="cta-find-tutor-btn"
                onClick={openContactModal}
                className="px-8 py-3.5 rounded-xl font-semibold text-sm text-white border border-white/25 hover:bg-white/10 cursor-pointer transition-all"
              >
                Tìm gia sư cho con
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default GuestTutorExplorePage;
