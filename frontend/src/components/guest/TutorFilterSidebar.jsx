import { useState } from "react";
import { X, SlidersHorizontal, BookOpen, User, Award } from "lucide-react";

export const SUBJECTS = [
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

export const GENDERS = ["Tất cả", "Nam", "Nữ"];

export const HIGHLIGHT_OPTIONS = [
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

export const DEFAULT_FILTERS = {
  search: "",
  subjects: [],
  highlights: [],
  gender: "",
};

function FilterSection({ title, icon: Icon, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
        {Icon && <Icon className="w-3.5 h-3.5 text-primary" />}
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
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-muted/60 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground hover:bg-muted"
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
    (filters.gender && filters.gender !== "Tất cả" ? 1 : 0) +
    filters.subjects.length +
    filters.highlights.length +
    (filters.search ? 1 : 0);

  const SidebarContent = (
    <div className="flex flex-col gap-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-foreground">Bộ lọc tìm gia sư</span>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* 1. Chuyên môn Tiếng Anh */}
      <FilterSection title="Chuyên môn" icon={BookOpen}>
        <div className="space-y-2">
          <select
            value={filters.subjects[0] || ""}
            onChange={(e) => update("subjects", e.target.value ? [e.target.value] : [])}
            className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground cursor-pointer focus:border-primary outline-none"
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

      {/* 2. Thành tích nổi bật */}
      <FilterSection title="Thành tích nổi bật" icon={Award}>
        <div className="space-y-2">
          <select
            value={filters.highlights[0] || ""}
            onChange={(e) => update("highlights", e.target.value ? [e.target.value] : [])}
            className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground cursor-pointer focus:border-primary outline-none"
          >
            <option value="">Tất cả thành tích</option>
            {HIGHLIGHT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <PillGroup
            options={HIGHLIGHT_OPTIONS.slice(0, 4)}
            selected={filters.highlights}
            onToggle={(val) => toggleMulti("highlights", val)}
          />
        </div>
      </FilterSection>

      {/* 3. Giới tính */}
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
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
              >
                {g === "Tất cả" ? "Tất cả" : g}
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
        className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => setMobileOpen(true)}
        id="filter-mobile-toggle"
      >
        <SlidersHorizontal className="w-4 h-4 text-primary" />
        <span>Bộ lọc (3 tiêu chí)</span>
        {activeCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
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
          <div className="absolute left-0 top-0 bottom-0 w-80 sm:w-96 max-w-[90vw] bg-card border-r border-border p-5 overflow-y-auto slide-in-left z-10">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
              <h3 className="font-bold text-foreground text-sm">Bộ lọc tìm kiếm gia sư</h3>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block rounded-2xl border border-border bg-card p-5 sticky top-20 shadow-xs">
        {SidebarContent}
      </div>
    </>
  );
}

export default TutorFilterSidebar;
