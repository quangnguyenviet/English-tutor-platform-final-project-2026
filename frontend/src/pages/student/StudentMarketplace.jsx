import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Award, User, X, Search } from "lucide-react";
import { tutors } from "../../data/mockData";
import { useStudentMatching } from "../../context/StudentMatchingContext";
import TutorCard from "../../components/guest/TutorCard";
import TutorDetailModal from "./TutorDetailModal";

const SUBJECTS = [
  "IELTS",
  "TOEIC",
  "Tiếng Anh Giao tiếp",
  "Tiếng Anh THCS",
  "Tiếng Anh THPT",
  "Tiếng Anh Tiểu học",
  "Luyện thi Chuyên Anh",
  "Ngữ pháp & Từ vựng",
  "Phát âm chuẩn IPA",
  "Tiếng Anh Mất gốc / Foundation"
];

const HIGHLIGHT_OPTIONS = [
  "Học sinh giỏi Quốc Gia",
  "Học sinh trường chuyên (Cấp 3)",
  "Học sinh giỏi Tỉnh/TP",
  "Huy chương vàng Quốc Tế",
  "Du học sinh",
  "Thủ khoa",
  "Á khoa",
  "Học bổng",
  "Chuyên dạy học sinh mất gốc",
  "Chuyên luyện thi Đại học"
];

const GENDERS = ["Tất cả giới tính", "Nam", "Nữ"];

export default function StudentMarketplace() {
  const navigate = useNavigate();
  const { selectTutorAndStartOnboarding } = useStudentMatching();

  const [selectedTutorForDetail, setSelectedTutorForDetail] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedHighlight, setSelectedHighlight] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // 3 gia sư mỗi hàng, tối đa 2 hàng = 6 gia sư / trang
  const tutorsPerPage = 6;

  // Filter tutors by 3 criteria
  const filteredTutors = useMemo(() => {
    return tutors.filter((t) => {
      // 1. Chuyên môn Tiếng Anh
      if (selectedSubject) {
        const sLow = selectedSubject.toLowerCase();
        const combinedText = [
          ...(t.subjects || []),
          ...(t.specialization || []),
          t.bio || "",
          t.university || ""
        ].join(" ").toLowerCase();

        let matched = combinedText.includes(sLow);
        if (!matched) {
          if (sLow.includes("ielts") && combinedText.includes("ielts")) matched = true;
          if (sLow.includes("toeic") && combinedText.includes("toeic")) matched = true;
          if (sLow.includes("giao tiếp") && (combinedText.includes("giao tiếp") || combinedText.includes("speaking"))) matched = true;
          if (sLow.includes("thpt") && (combinedText.includes("thpt") || combinedText.includes("cấp 3"))) matched = true;
          if (sLow.includes("thcs") && (combinedText.includes("thcs") || combinedText.includes("cấp 2") || combinedText.includes("chuyên"))) matched = true;
          if (sLow.includes("tiểu học") && (combinedText.includes("tiểu học") || combinedText.includes("cấp 1"))) matched = true;
          if (sLow.includes("ngữ pháp") && combinedText.includes("ngữ pháp")) matched = true;
          if (sLow.includes("phát âm") && (combinedText.includes("phát âm") || combinedText.includes("ipa"))) matched = true;
          if (sLow.includes("mất gốc") && combinedText.includes("mất gốc")) matched = true;
        }
        if (!matched) return false;
      }

      // 2. Thành tích nổi bật
      if (selectedHighlight) {
        const hLow = selectedHighlight.toLowerCase();
        let matched = (t.highlights || []).some(
          (th) => th.toLowerCase().includes(hLow) || hLow.includes(th.toLowerCase())
        );

        if (!matched) {
          const bioAwardsText = [
            t.bio || "",
            t.highSchool || "",
            t.academicRank || "",
            ...(t.awards || []).map((a) => a.title || ""),
            ...(t.certificates || []).map((c) => c.name || "")
          ].join(" ").toLowerCase();

          matched = bioAwardsText.includes(hLow);
        }
        if (!matched) return false;
      }

      // 3. Giới tính
      if (selectedGender && selectedGender !== "Tất cả giới tính") {
        if ((t.gender || "").toLowerCase() !== selectedGender.toLowerCase()) return false;
      }

      return true;
    });
  }, [selectedSubject, selectedHighlight, selectedGender]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredTutors.length / tutorsPerPage);
  const paginatedTutors = useMemo(() => {
    const start = (currentPage - 1) * tutorsPerPage;
    return filteredTutors.slice(start, start + tutorsPerPage);
  }, [filteredTutors, currentPage, tutorsPerPage]);

  const handlePageChange = (pageNum) => {
    setCurrentPage(pageNum);
  };

  const handleResetFilters = () => {
    setSelectedSubject("");
    setSelectedHighlight("");
    setSelectedGender("");
    setCurrentPage(1);
  };

  function handleConnectTutor(tutorItem) {
    selectTutorAndStartOnboarding(tutorItem);
    navigate("/student/onboarding");
  }

  const hasActiveFilters = Boolean(
    selectedSubject ||
    selectedHighlight ||
    (selectedGender && selectedGender !== "Tất cả giới tính")
  );

  return (
    <div className="space-y-6 pb-20">
      {/* 3 Dropdown Filters at the Top */}
      <div className="bg-card border border-border p-4 rounded-2xl shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Dropdown 1: Chuyên môn */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <BookOpen size={14} className="text-primary" /> Chuyên môn
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground cursor-pointer focus:border-primary outline-none transition-colors"
            >
              <option value="">Tất cả chuyên môn</option>
              {SUBJECTS.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown 2: Thành tích nổi bật */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Award size={14} className="text-primary" /> Thành tích nổi bật
            </label>
            <select
              value={selectedHighlight}
              onChange={(e) => {
                setSelectedHighlight(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground cursor-pointer focus:border-primary outline-none transition-colors"
            >
              <option value="">Tất cả thành tích</option>
              {HIGHLIGHT_OPTIONS.map((hl) => (
                <option key={hl} value={hl}>
                  {hl}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown 3: Giới tính */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <User size={14} className="text-primary" /> Giới tính
            </label>
            <select
              value={selectedGender}
              onChange={(e) => {
                setSelectedGender(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground cursor-pointer focus:border-primary outline-none transition-colors"
            >
              {GENDERS.map((g) => (
                <option key={g} value={g === "Tất cả giới tính" ? "" : g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear filter action */}
        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-border flex justify-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              <X size={13} /> Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Tutor Cards Grid: 3 gia sư mỗi hàng, tối đa 2 hàng (6 gia sư/trang) */}
      {paginatedTutors.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedTutors.map((tutor, i) => (
              <TutorCard
                key={tutor.id}
                tutor={tutor}
                index={i}
                onViewDetail={(t) => setSelectedTutorForDetail(t)}
                onConnect={(t) => handleConnectTutor(t)}
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
                      ? "bg-primary text-primary-foreground shadow-xs scale-105"
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
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-2xl p-6 bg-card">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
            <Search className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1">Không tìm thấy gia sư phù hợp</h3>
          <p className="text-muted-foreground text-xs max-w-xs mb-4">
            Không có gia sư nào thỏa mãn cả 3 tiêu chí lọc hiện tại. Thử chọn lại chuyên môn hoặc thành tích khác.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      )}

      {/* Tutor Detail Modal */}
      {selectedTutorForDetail && (
        <TutorDetailModal
          tutor={selectedTutorForDetail}
          onClose={() => setSelectedTutorForDetail(null)}
          onSelectTutor={(t) => handleConnectTutor(t)}
        />
      )}
    </div>
  );
}
