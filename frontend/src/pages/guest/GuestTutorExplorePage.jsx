import { useState, useMemo } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { Search, Users, ShieldCheck, TrendingUp, ChevronRight, BookOpen, Flame, SlidersHorizontal, Sparkles } from "lucide-react";
import { tutors, publicClassListings } from "../../data/mockData";
import TutorCard from "../../components/guest/TutorCard";
import ClassRequestCard from "../../components/guest/ClassRequestCard";
import TutorFilterSidebar, { DEFAULT_FILTERS } from "../../components/guest/TutorFilterSidebar";

// Helper lọc gia sư theo tiêu chí
function applyFilters(list, filters) {
  let result = list.filter((t) => {
    // 1. Text search
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      const haystack = [
        t.name,
        t.university,
        t.location,
        t.currentAddress,
        t.district,
        t.province,
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

    // 2. Địa điểm 2 cấp: Tỉnh/Thành phố & Quận/Huyện
    if (filters.province && filters.province !== "Tất cả") {
      const provLow = filters.province.toLowerCase();
      const tutorLocation = [t.location, t.province, t.currentAddress].join(" ").toLowerCase();
      if (!tutorLocation.includes(provLow) && !provLow.includes(tutorLocation)) {
        // Fallback kiểm tra "Hà Nội" hoặc "Hồ Chí Minh"
        if (filters.province === "Hà Nội" && !tutorLocation.includes("hà nội") && !tutorLocation.includes("hn")) return false;
        if (filters.province === "TP. Hồ Chí Minh" && !tutorLocation.includes("hồ chí minh") && !tutorLocation.includes("tp.hcm") && !tutorLocation.includes("sài gòn")) return false;
      }
    }

    if (filters.district && filters.district !== "Tất cả quận/huyện") {
      const distLow = filters.district.toLowerCase();
      const tutorDistrict = [t.district, t.currentAddress, t.location].join(" ").toLowerCase();
      if (!tutorDistrict.includes(distLow)) return false;
    }

    // 3. Chuyên môn Tiếng Anh
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
        if (sLow.includes("ngữ pháp") && combinedText.includes("ngữ pháp")) return true;
        if (sLow.includes("phát âm") && (combinedText.includes("phát âm") || combinedText.includes("ipa"))) return true;
        if (sLow.includes("mất gốc") && combinedText.includes("mất gốc")) return true;

        return false;
      });
      if (!matchSubject) return false;
    }

    // 4. Cấp lớp học
    if (filters.gradeLevel && filters.gradeLevel !== "Tất cả cấp lớp") {
      const gradeLow = filters.gradeLevel.toLowerCase();
      const tutorGrades = (t.gradeLevels || []).join(" ").toLowerCase();
      const combined = [tutorGrades, t.bio || "", ...(t.specialization || [])].join(" ").toLowerCase();
      if (gradeLow.includes("tiểu học") && !combined.includes("tiểu học") && !combined.includes("lớp 1") && !combined.includes("lớp 5")) return false;
      if (gradeLow.includes("thcs") && !combined.includes("thcs") && !combined.includes("lớp 6") && !combined.includes("lớp 9") && !combined.includes("cấp 2")) return false;
      if (gradeLow.includes("thpt") && !combined.includes("thpt") && !combined.includes("lớp 10") && !combined.includes("lớp 12") && !combined.includes("cấp 3")) return false;
      if (gradeLow.includes("đại học") && !combined.includes("đại học")) return false;
    }

    // 5. Hình thức học
    if (filters.learningMode && filters.learningMode !== "Tất cả") {
      if (filters.learningMode === "Online" && t.learningMode !== "online" && t.learningMode !== "both") return false;
      if (filters.learningMode === "Tại nhà" && t.learningMode !== "offline" && t.learningMode !== "both") return false;
    }

    // 6. Thành tích nổi bật
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

    // 7. Giới tính
    if (filters.gender && filters.gender !== "Tất cả") {
      if ((t.gender || "").toLowerCase() !== filters.gender.toLowerCase()) return false;
    }

    return true;
  });

  // Sắp xếp danh sách
  if (filters.sortBy === "price_asc") {
    result.sort((a, b) => {
      const priceA = parseInt((a.ratePerHour || "0").replace(/[^0-9]/g, ""), 10);
      const priceB = parseInt((b.ratePerHour || "0").replace(/[^0-9]/g, ""), 10);
      return priceA - priceB;
    });
  } else if (filters.sortBy === "price_desc") {
    result.sort((a, b) => {
      const priceA = parseInt((a.ratePerHour || "0").replace(/[^0-9]/g, ""), 10);
      const priceB = parseInt((b.ratePerHour || "0").replace(/[^0-9]/g, ""), 10);
      return priceB - priceA;
    });
  } else if (filters.sortBy === "newest") {
    result.sort((a, b) => (b.id || "").localeCompare(a.id || ""));
  }

  return result;
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
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const tutorsPerPage = 6; // Chuẩn 6 gia sư / trang theo UC-P02

  const filteredTutors = useMemo(
    () => applyFilters(tutors, filters),
    [filters]
  );

  const totalPages = Math.ceil(filteredTutors.length / tutorsPerPage) || 1;
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
            Hồ sơ gia sư tiếng Anh được thẩm định năng lực 100%
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-3 leading-tight tracking-tight">
            Khám Phá & Chọn Gia Sư <span className="text-blue-300">Phù Hợp Nhất</span>
          </h1>
          <p className="text-white/80 text-xs sm:text-sm mb-6 max-w-xl mx-auto leading-relaxed">
            Tra cứu đội ngũ gia sư chuyên môn cao theo khu vực, cấp lớp và phong cách sư phạm. Đăng ký học thử 01 buổi miễn phí.
          </p>

          <div className="flex flex-wrap justify-center gap-2.5">
            <StatsBadge icon={Users} value={`${tutors.length}+`} label="Gia sư chọn lọc" />
            <StatsBadge icon={ShieldCheck} value="100%" label="Xác thực chứng chỉ" />
            <StatsBadge icon={TrendingUp} value="98%" label="Hài lòng" />
            <StatsBadge icon={BookOpen} value="10+" label="Chuyên môn Tiếng Anh" />
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
            Tìm thấy <span className="font-bold text-slate-900 dark:text-white">{filteredTutors.length}</span> gia sư
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
                <span className="font-bold text-slate-900 dark:text-white">{filteredTutors.length}</span> gia sư
                {totalPages > 1 && (
                  <span className="ml-1 text-slate-400">
                    (Trang {currentPage} / {totalPages})
                  </span>
                )}
              </p>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Sắp xếp:</span>
                <select
                  value={filters.sortBy || "relevant"}
                  onChange={(e) => handleFilterChange({ ...filters, sortBy: e.target.value })}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer outline-none focus:border-blue-500"
                >
                  <option value="relevant">Phù hợp nhất</option>
                  <option value="price_asc">Học phí: Thấp đến cao</option>
                  <option value="price_desc">Học phí: Cao đến thấp</option>
                  <option value="newest">Mới tham gia</option>
                </select>
              </div>
            </div>

            {/* Tutor Grid */}
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

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
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
          <Link
            id="view-all-classes-btn"
            to="/classes"
            className="hidden sm:flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
          >
            Xem toàn bộ ({publicClassListings.length} lớp)
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

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
