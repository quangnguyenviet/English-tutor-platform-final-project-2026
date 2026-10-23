import { useState } from "react";
import { X, SlidersHorizontal, BookOpen, User, MapPin, GraduationCap, Laptop } from "lucide-react";

export const PROVINCES_DATA = {
  "Tất cả": [],
  "Hà Nội": [
    "Tất cả quận/huyện",
    "Cầu Giấy",
    "Đống Đa",
    "Ba Đình",
    "Hai Bà Trưng",
    "Thanh Xuân",
    "Hoàng Mai",
    "Nam Từ Liêm",
    "Bắc Từ Liêm",
    "Tây Hồ",
    "Hà Đông",
    "Long Biên"
  ],
  "TP. Hồ Chí Minh": [
    "Tất cả quận/huyện",
    "Quận 1",
    "Quận 3",
    "Quận 5",
    "Quận 7",
    "Quận 10",
    "Bình Thạnh",
    "Phú Nhuận",
    "Tân Bình",
    "Gò Vấp",
    "TP. Thủ Đức"
  ]
};

export const SUBJECTS = [
  "IELTS",
  "TOEIC",
  "Tiếng Anh Giao tiếp",
  "Tiếng Anh THCS",
  "Tiếng Anh THPT",
  "Luyện thi Chuyên Anh",
  "Ngữ pháp & Từ vựng",
  "Phát âm chuẩn IPA",
  "Tiếng Anh Mất gốc / Foundation"
];

export const GRADE_LEVELS = [
  "Tất cả cấp lớp",
  "Tiểu học (Lớp 1 - 5)",
  "THCS (Lớp 6 - 9)",
  "THPT (Lớp 10 - 12)",
  "Luyện thi Đại học",
  "Người đi làm / Sinh viên"
];

export const LEARNING_MODES = [
  "Tất cả",
  "Online",
  "Tại nhà"
];

export const GENDERS = ["Tất cả", "Nam", "Nữ"];

export const DEFAULT_FILTERS = {
  search: "",
  province: "Tất cả",
  district: "",
  subjects: [],
  gradeLevel: "Tất cả cấp lớp",
  learningMode: "Tất cả",
  gender: "",
};

function FilterSection({ title, icon: Icon, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {Icon && <Icon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

function PillGroup({ options, selected, onToggle, multi = true }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const val = typeof opt === "object" ? opt.value : opt;
        const label = typeof opt === "object" ? opt.label : opt;
        const isActive = multi ? selected.includes(val) : (selected === val || (!selected && val === "Tất cả"));
        return (
          <button
            type="button"
            key={val}
            onClick={() => onToggle(val)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
              isActive
                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function TutorFilterSidebar({ onFilterChange, initialFilters = DEFAULT_FILTERS }) {
  const [filters, setFilters] = useState(initialFilters);
  const [mobileOpen, setMobileOpen] = useState(false);

  function update(key, value) {
    const next = { ...filters, [key]: value };
    // Nếu đổi province thì reset district
    if (key === "province") {
      next.district = "";
    }
    setFilters(next);
    onFilterChange?.(next);
  }

  function toggleMulti(key, val) {
    const arr = filters[key] || [];
    const next = arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
    update(key, next);
  }

  function toggleSingle(key, val) {
    if (val === "Tất cả") {
      update(key, "");
    } else {
      update(key, filters[key] === val ? "" : val);
    }
  }

  function reset() {
    setFilters(DEFAULT_FILTERS);
    onFilterChange?.(DEFAULT_FILTERS);
  }

  const activeCount =
    (filters.province && filters.province !== "Tất cả" ? 1 : 0) +
    (filters.district && filters.district !== "Tất cả quận/huyện" ? 1 : 0) +
    (filters.gradeLevel && filters.gradeLevel !== "Tất cả cấp lớp" ? 1 : 0) +
    (filters.learningMode && filters.learningMode !== "Tất cả" ? 1 : 0) +
    (filters.gender && filters.gender !== "Tất cả" ? 1 : 0) +
    filters.subjects.length +
    (filters.search ? 1 : 0);

  const availableDistricts = PROVINCES_DATA[filters.province] || [];

  const SidebarContent = (
    <div className="flex flex-col gap-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-slate-900 dark:text-white">Bộ lọc tìm gia sư</span>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
            Đặt lại bộ lọc
          </button>
        )}
      </div>

      {/* 1. Địa điểm động 2 cấp: Tỉnh/Thành phố -> Quận/Huyện */}
      <FilterSection title="Địa điểm hoạt động" icon={MapPin}>
        <div className="space-y-2">
          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 block">
              Tỉnh / Thành phố:
            </label>
            <select
              value={filters.province}
              onChange={(e) => update("province", e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer focus:border-blue-500 outline-none"
            >
              {Object.keys(PROVINCES_DATA).map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>

          {availableDistricts.length > 0 && (
            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                Quận / Huyện:
              </label>
              <select
                value={filters.district}
                onChange={(e) => update("district", e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer focus:border-blue-500 outline-none"
              >
                {availableDistricts.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </FilterSection>

      {/* 2. Chuyên môn Tiếng Anh */}
      <FilterSection title="Chuyên môn Tiếng Anh" icon={BookOpen}>
        <div className="space-y-2">
          <select
            value={filters.subjects[0] || ""}
            onChange={(e) => update("subjects", e.target.value ? [e.target.value] : [])}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer focus:border-blue-500 outline-none"
          >
            <option value="">Tất cả chuyên môn</option>
            {SUBJECTS.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
          <PillGroup
            options={SUBJECTS.slice(0, 5)}
            selected={filters.subjects}
            onToggle={(val) => toggleMulti("subjects", val)}
          />
        </div>
      </FilterSection>

      {/* 3. Cấp lớp học */}
      <FilterSection title="Cấp lớp học" icon={GraduationCap}>
        <select
          value={filters.gradeLevel}
          onChange={(e) => update("gradeLevel", e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer focus:border-blue-500 outline-none"
        >
          {GRADE_LEVELS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </FilterSection>

      {/* 4. Hình thức học (Online / Tại nhà) */}
      <FilterSection title="Hình thức học" icon={Laptop}>
        <div className="flex gap-1.5">
          {LEARNING_MODES.map((mode) => {
            const isSelected = filters.learningMode === mode;
            return (
              <button
                type="button"
                key={mode}
                onClick={() => update("learningMode", mode)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {mode}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* 5. Giới tính gia sư */}
      <FilterSection title="Giới tính" icon={User}>
        <div className="flex gap-2">
          {GENDERS.map((g) => {
            const isSelected = (!filters.gender && g === "Tất cả") || filters.gender === g;
            return (
              <button
                type="button"
                key={g}
                onClick={() => toggleSingle("gender", g)}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </FilterSection>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        type="button"
        className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white cursor-pointer hover:border-blue-500 transition-colors"
        onClick={() => setMobileOpen(true)}
        id="filter-mobile-toggle"
      >
        <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span>Bộ lọc nâng cao</span>
        {activeCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
            {activeCount}
          </span>
        )}
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-80 sm:w-96 max-w-[90vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 overflow-y-auto slide-in-left z-10">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Bộ lọc tìm kiếm gia sư</h3>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="cursor-pointer text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sticky top-20 shadow-xs">
        {SidebarContent}
      </div>
    </>
  );
}

export default TutorFilterSidebar;
