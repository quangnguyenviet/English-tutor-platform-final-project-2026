import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import clsx from "clsx";
import { getAvailableClasses, locationData } from "./mockAvailableClasses";

export default function AvailableClasses() {
  const [classes, setClasses] = useState([]);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("Tất cả");
  const [selectedMode, setSelectedMode] = useState("Tất cả");
  const [selectedCity, setSelectedCity] = useState("Tất cả");
  const [selectedDistrict, setSelectedDistrict] = useState("Tất cả");
  const [selectedTuitionRange, setSelectedTuitionRange] = useState("Tất cả");
  const [selectedScheduleSlot, setSelectedScheduleSlot] = useState("Tất cả");
  const [selectedTutorRequirement, setSelectedTutorRequirement] = useState("Tất cả");

  // Accordion toggle state
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    setClasses(getAvailableClasses());
  }, []);

  const activeFiltersCount = [
    selectedSubject !== "Tất cả",
    selectedMode !== "Tất cả",
    selectedCity !== "Tất cả",
    selectedDistrict !== "Tất cả",
    selectedTuitionRange !== "Tất cả",
    selectedScheduleSlot !== "Tất cả",
    selectedTutorRequirement !== "Tất cả",
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedSubject("Tất cả");
    setSelectedMode("Tất cả");
    setSelectedCity("Tất cả");
    setSelectedDistrict("Tất cả");
    setSelectedTuitionRange("Tất cả");
    setSelectedScheduleSlot("Tất cả");
    setSelectedTutorRequirement("Tất cả");
  };

  // Lọc danh sách lớp học
  const filteredClasses = classes.filter((cls) => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = cls.title.toLowerCase().includes(term);
      const matchSubject = cls.subject.toLowerCase().includes(term);
      const matchCity = cls.city.toLowerCase().includes(term);
      const matchDistrict = cls.district.toLowerCase().includes(term);
      const matchReq = cls.requirements.toLowerCase().includes(term);
      if (!matchTitle && !matchSubject && !matchCity && !matchDistrict && !matchReq) {
        return false;
      }
    }
    if (selectedSubject !== "Tất cả" && cls.gradeCategory !== selectedSubject) return false;
    if (selectedMode !== "Tất cả" && cls.teachingMode !== selectedMode) return false;
    if (selectedCity !== "Tất cả" && cls.city !== selectedCity) return false;
    if (selectedDistrict !== "Tất cả" && cls.district !== selectedDistrict) return false;
    if (selectedTutorRequirement !== "Tất cả" && cls.tutorTypeRequirement !== selectedTutorRequirement) return false;

    // Lọc theo khung học phí
    if (selectedTuitionRange !== "Tất cả") {
      if (selectedTuitionRange === "negotiable") {
        if (cls.tuitionType !== "negotiable") return false;
      } else if (selectedTuitionRange === "under200") {
        if (cls.tuition && cls.tuition >= 200000) return false;
      } else if (selectedTuitionRange === "200to400") {
        if (!cls.tuition || cls.tuition < 200000 || cls.tuition > 400000) return false;
      } else if (selectedTuitionRange === "above400") {
        if (!cls.tuition || cls.tuition <= 400000) return false;
      }
    }

    // Lọc theo ca học
    if (selectedScheduleSlot !== "Tất cả") {
      if (!cls.schedule) return true;
      const scheduleLower = cls.schedule.toLowerCase();
      if (selectedScheduleSlot === "weekend" && !scheduleLower.includes("chủ nhật") && !scheduleLower.includes("thứ 7")) return false;
      if (selectedScheduleSlot === "evening" && !scheduleLower.includes("18:") && !scheduleLower.includes("19:") && !scheduleLower.includes("20:")) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Sàn Lớp Học Cần Gia Sư"
        description="Danh sách các lớp học mới đăng từ Học sinh & Phụ huynh. Bấm xem chi tiết từng lớp để xem đầy đủ thông tin và gửi đơn ứng tuyển."
      />

      {/* BỘ LỌC TÌM KIẾM TINH GỌN */}
      <Card className="p-4 border-slate-200/80 dark:border-slate-800 transition-all">
        {/* Header Bar của Bộ Lọc */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Ô Tìm Kiếm Từ Khóa */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập từ khóa tìm kiếm (tên lớp, môn học, khu vực, yêu cầu...)"
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 transition-all shadow-xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={clsx(
                "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all border shadow-xs cursor-pointer",
                isFilterOpen || activeFiltersCount > 0
                  ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:border-blue-600"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800 dark:hover:bg-slate-800"
              )}
            >
              <Filter size={15} />
              <span>Bộ Lọc Nâng Cao</span>
              {activeFiltersCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-blue-600">
                  {activeFiltersCount}
                </span>
              )}
              {isFilterOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {(activeFiltersCount > 0 || searchTerm) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/60 transition-colors"
                title="Xóa tất cả bộ lọc"
              >
                <RotateCcw size={13} />
                <span className="hidden sm:inline">Đặt lại</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Chips */}
        {(activeFiltersCount > 0 || searchTerm) && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400 mr-1">Đang lọc theo:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/50">
                Từ khóa: "{searchTerm}"
                <button onClick={() => setSearchTerm("")} className="hover:text-rose-600 dark:hover:text-rose-400">
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedSubject !== "Tất cả" && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/50">
                Môn: {selectedSubject}
                <button onClick={() => setSelectedSubject("Tất cả")} className="hover:text-rose-600 dark:hover:text-rose-400">
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedMode !== "Tất cả" && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/50">
                Hình thức: {selectedMode}
                <button onClick={() => setSelectedMode("Tất cả")} className="hover:text-rose-600 dark:hover:text-rose-400">
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedCity !== "Tất cả" && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/50">
                Tỉnh/Thành: {selectedCity}
                <button
                  onClick={() => {
                    setSelectedCity("Tất cả");
                    setSelectedDistrict("Tất cả");
                  }}
                  className="hover:text-rose-600 dark:hover:text-rose-400"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedDistrict !== "Tất cả" && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/50">
                Quận/Huyện: {selectedDistrict}
                <button onClick={() => setSelectedDistrict("Tất cả")} className="hover:text-rose-600 dark:hover:text-rose-400">
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedTuitionRange !== "Tất cả" && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/50">
                Phí: {
                  selectedTuitionRange === "under200" ? "< 200,000 VNĐ" :
                  selectedTuitionRange === "200to400" ? "200,000 - 400,000 VNĐ" :
                  selectedTuitionRange === "above400" ? "> 400,000 VNĐ" : "Thỏa thuận"
                }
                <button onClick={() => setSelectedTuitionRange("Tất cả")} className="hover:text-rose-600 dark:hover:text-rose-400">
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedScheduleSlot !== "Tất cả" && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/50">
                Ca học: {selectedScheduleSlot === "evening" ? "Ca Tối" : "Cuối tuần"}
                <button onClick={() => setSelectedScheduleSlot("Tất cả")} className="hover:text-rose-600 dark:hover:text-rose-400">
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedTutorRequirement !== "Tất cả" && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/50">
                Đối tượng: {selectedTutorRequirement}
                <button onClick={() => setSelectedTutorRequirement("Tất cả")} className="hover:text-rose-600 dark:hover:text-rose-400">
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Bảng chọn bộ lọc dạng Accordion Dropdown */}
        {isFilterOpen && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Lớp / Môn học
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="Tất cả">Tất cả môn / lớp</option>
                  <option value="Lớp 1">Tiếng Anh Lớp 1</option>
                  <option value="Lớp 2">Tiếng Anh Lớp 2</option>
                  <option value="TOEIC">Luyện Thi TOEIC</option>
                  <option value="IELTS">Luyện Thi IELTS</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Yêu cầu đối tượng gia sư
                </label>
                <select
                  value={selectedTutorRequirement}
                  onChange={(e) => setSelectedTutorRequirement(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="Tất cả">Tất cả đối tượng</option>
                  <option value="Giáo viên">Giáo viên</option>
                  <option value="Sinh viên">Sinh viên</option>
                  <option value="Không yêu cầu">Không yêu cầu</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Hình thức dạy
                </label>
                <select
                  value={selectedMode}
                  onChange={(e) => setSelectedMode(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="Tất cả">Tất cả hình thức</option>
                  <option value="Offline">Offline (Tại nhà)</option>
                  <option value="Online">Online (Zoom/Meet)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Tỉnh / Thành phố
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setSelectedDistrict("Tất cả");
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="Tất cả">Tất cả Tỉnh/Thành</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Quận / Huyện
                </label>
                <select
                  value={selectedDistrict}
                  disabled={selectedCity === "Tất cả"}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="Tất cả">Tất cả Quận/Huyện</option>
                  {(locationData[selectedCity] || []).map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Mức học phí / buổi
                </label>
                <select
                  value={selectedTuitionRange}
                  onChange={(e) => setSelectedTuitionRange(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="Tất cả">Tất cả mức phí</option>
                  <option value="under200">Dưới 200,000 VNĐ</option>
                  <option value="200to400">200,000 - 400,000 VNĐ</option>
                  <option value="above400">Trên 400,000 VNĐ</option>
                  <option value="negotiable">Thỏa thuận với Phụ huynh</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Thời gian dạy rảnh
                </label>
                <select
                  value={selectedScheduleSlot}
                  onChange={(e) => setSelectedScheduleSlot(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="Tất cả">Tất cả ca học</option>
                  <option value="evening">Ca Tối (Sau 18h)</option>
                  <option value="weekend">Cuối tuần (T7, Chủ Nhật)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* DANH SÁCH THẺ LỚP HỌC */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Tìm thấy <strong className="text-blue-600 dark:text-blue-400">{filteredClasses.length}</strong> lớp học phù hợp
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {filteredClasses.map((cls) => {
            return (
              <Card
                key={cls.id}
                className={clsx(
                  "flex flex-col justify-between transition-all hover:border-blue-300 dark:hover:border-blue-800 border-slate-200/80 dark:border-slate-800 p-5 space-y-4",
                  cls.applied && "bg-slate-50/80 dark:bg-slate-900/40 border-blue-200 dark:border-blue-900/50"
                )}
              >
                <div className="space-y-3">
                  {/* Top Badges Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                        {cls.subject}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {cls.teachingMode}
                      </span>
                      {cls.badges.includes("urgent") && (
                        <span className="rounded bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                          Cần gấp
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">{cls.postedAt}</span>
                  </div>

                  {/* Class Title */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">{cls.title}</h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Mã lớp: <strong className="font-mono text-slate-700 dark:text-slate-300">{cls.id}</strong>
                    </p>
                  </div>

                  {/* Grid thông số tóm tắt */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Khu vực:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{cls.city} ({cls.district})</span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block">Học phí:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {cls.tuitionType === "fixed" ? `${cls.tuition.toLocaleString()} VNĐ/buổi` : "Thỏa thuận"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block">Tần suất:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{cls.sessionsPerWeek} buổi / tuần</span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block">Đối tượng:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{cls.tutorTypeRequirement}</span>
                    </div>
                  </div>

                  {/* Trạng thái đã ứng tuyển */}
                  {cls.applied && (
                    <div className="rounded bg-blue-50/80 p-2 text-xs font-semibold text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>Bạn đã ứng tuyển lớp học này</span>
                    </div>
                  )}
                </div>

                {/* Button Link - NÚT XEM CHI TIẾT LỚP HỌC (CHUYỂN SANG ROUTE CHI TIẾT) */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    to={`/tutor/available-classes/${cls.id}`}
                    className={clsx(
                      "w-full inline-flex items-center justify-center font-bold text-xs py-2.5 rounded-lg transition-colors shadow-xs text-center",
                      cls.applied
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    )}
                  >
                    {cls.applied ? "Xem Chi Tiết Lớp (Đã Ứng Tuyển)" : "Xem Chi Tiết Lớp Học"}
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredClasses.length === 0 && (
          <Card className="py-12 text-center text-slate-400 space-y-2 border-slate-200/80 dark:border-slate-800">
            <AlertCircle size={32} className="mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Không tìm thấy lớp học nào phù hợp với bộ lọc.</p>
            <p className="text-xs">Vui lòng thử đặt lại bộ lọc để xem danh sách lớp.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
