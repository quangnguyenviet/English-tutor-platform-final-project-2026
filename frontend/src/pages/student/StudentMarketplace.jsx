import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, MapPin, Search, User, Video, X } from "lucide-react";
import { apiGetPublicTutors } from "../../lib/tutorApi";
import { mapPublicTutor } from "../../lib/publicTutorMapper";
import { useStudentMatching } from "../../context/StudentMatchingContext";
import TutorCard from "../../components/guest/TutorCard";
import TutorDetailModal from "./TutorDetailModal";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import { EmptyState, ErrorBox, SkeletonRows } from "../../components/student/AsyncBlock";

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
  "Tiếng Anh Mất gốc / Foundation",
];

const TEACHING_MODES = [
  { label: "Tất cả hình thức", value: "" },
  { label: "Trực tuyến (Online)", value: "ONLINE" },
  { label: "Tại nhà", value: "AT_HOME" },
];

const PROVINCES = ["Tất cả khu vực", "Hà Nội", "TP. Hồ Chí Minh"];

const GENDERS = ["Tất cả giới tính", "Nam", "Nữ"];

export default function StudentMarketplace() {
  const navigate = useNavigate();
  const { selectTutorAndStartOnboarding } = useStudentMatching();

  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTutorForDetail, setSelectedTutorForDetail] = useState(null);

  // Filters
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedMode, setSelectedMode] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTutors = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const gender =
        selectedGender === "Nam" ? "MALE" : selectedGender === "Nữ" ? "FEMALE" : undefined;
      const province = selectedProvince && selectedProvince !== "Tất cả khu vực"
        ? selectedProvince.replace(/^TP\.\s*/i, "")
        : undefined;

      const res = await apiGetPublicTutors({
        page: currentPage - 1,
        size: 6,
        keyword: searchKeyword.trim() || undefined,
        specialty: selectedSubject ? [selectedSubject] : undefined,
        teachingMode: selectedMode || undefined,
        gender,
        province,
      });

      const items = (res?.items || []).map(mapPublicTutor);
      setTutors(items);
      setTotalPages(Math.max(1, res?.totalPages || 1));
    } catch (err) {
      setError(err.message || "Không thể tải danh sách gia sư. Vui lòng thử lại sau.");
      setTutors([]);
    } finally {
      setLoading(false);
    }
  }, [searchKeyword, selectedSubject, selectedMode, selectedProvince, selectedGender, currentPage]);

  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

  const handlePageChange = (pageNum) => {
    setCurrentPage(pageNum);
  };

  const handleResetFilters = () => {
    setSearchKeyword("");
    setSelectedSubject("");
    setSelectedMode("");
    setSelectedProvince("");
    setSelectedGender("");
    setCurrentPage(1);
  };

  function handleConnectTutor(tutorItem) {
    if (selectTutorAndStartOnboarding) {
      selectTutorAndStartOnboarding(tutorItem);
    }
    navigate("/student/onboarding");
  }

  const hasActiveFilters = Boolean(
    searchKeyword.trim() ||
    selectedSubject ||
    selectedMode ||
    (selectedProvince && selectedProvince !== "Tất cả khu vực") ||
    (selectedGender && selectedGender !== "Tất cả giới tính")
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20">
      <PageHeader
        className="mb-0"
        eyebrow="Bước 1/3 · Chọn gia sư"
        title="Khám phá Gia sư"
        description="Tìm kiếm gia sư phù hợp theo chuyên môn, hình thức học, khu vực và giới tính."
      />

      {/* Filter panel */}
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => {
              setSearchKeyword(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo tên gia sư hoặc trường đại học..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/40 dark:text-white dark:focus:bg-slate-900"
          />
        </div>

        {/* 4 Dropdowns */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Dropdown 1: Chuyên môn */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <BookOpen size={14} className="text-blue-600 dark:text-blue-400" strokeWidth={1.75} /> Chuyên môn
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="">Tất cả chuyên môn</option>
              {SUBJECTS.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown 2: Hình thức học */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Video size={14} className="text-blue-600 dark:text-blue-400" strokeWidth={1.75} /> Hình thức học
            </label>
            <select
              value={selectedMode}
              onChange={(e) => {
                setSelectedMode(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              {TEACHING_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown 3: Khu vực */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <MapPin size={14} className="text-blue-600 dark:text-blue-400" strokeWidth={1.75} /> Khu vực
            </label>
            <select
              value={selectedProvince}
              onChange={(e) => {
                setSelectedProvince(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              {PROVINCES.map((p) => (
                <option key={p} value={p === "Tất cả khu vực" ? "" : p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown 4: Giới tính */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <User size={14} className="text-blue-600 dark:text-blue-400" strokeWidth={1.75} /> Giới tính
            </label>
            <select
              value={selectedGender}
              onChange={(e) => {
                setSelectedGender(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
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
          <div className="flex justify-end border-t border-slate-200 pt-3 dark:border-slate-800">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex cursor-pointer items-center gap-1 text-xs text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
            >
              <X size={13} strokeWidth={1.75} /> Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          <SkeletonRows rows={3} className="h-44" />
        </div>
      )}

      {/* Error state */}
      {!loading && error && <ErrorBox message={error} onRetry={fetchTutors} />}

      {/* Empty state */}
      {!loading && !error && tutors.length === 0 && (
        <EmptyState
          icon={Search}
          title="Không tìm thấy gia sư phù hợp"
          description="Không có gia sư nào thỏa mãn tiêu chí lọc hiện tại. Thử chọn lại chuyên môn, hình thức hoặc từ khóa khác."
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Đặt lại bộ lọc
              </Button>
            ) : undefined
          }
        />
      )}

      {/* Tutor Cards Grid: 3 gia sư mỗi hàng, tối đa 2 hàng (6 gia sư/trang) */}
      {!loading && !error && tutors.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tutors.map((tutor, i) => (
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
                className="cursor-pointer rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-30 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  className={`h-9 w-9 cursor-pointer rounded-xl font-mono text-xs font-bold transition-all ${
                    currentPage === pageNum
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="cursor-pointer rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-30 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Tiếp
              </button>
            </div>
          )}
        </>
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
