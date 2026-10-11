import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Target, Award, Calendar, Send, Sparkles, Laptop, Check, Plus } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import { useStudentMatching } from "../../context/StudentMatchingContext";

export default function StudentOnboarding() {
  const navigate = useNavigate();
  const { selectedTutor, submitOnboarding, resetMatchingFlow } = useStudentMatching();

  const [formData, setFormData] = useState({
    targetGoal: "Luyện thi IELTS 6.5",
    currentLevel: "B1 / Trung cấp",
    learningModePref: "online", // "online" | "offline_home" | "offline_center"
    weakSkills: ["Viết", "Nói"],
    weeklySchedule: "3 buổi/tuần (Tối T2 - T4 - T6)",
    note: "Em muốn tập trung cải thiện từ vựng và cấu trúc câu cho Writing Task 2.",
  });

  function handleSkillToggle(skill) {
    setFormData((prev) => {
      const exists = prev.weakSkills.includes(skill);
      return {
        ...prev,
        weakSkills: exists ? prev.weakSkills.filter((s) => s !== skill) : [...prev.weakSkills, skill],
      };
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    submitOnboarding(formData);
    navigate("/student/chat");
  }

  const allSkills = ["Nghe", "Nói", "Đọc", "Viết", "Từ vựng", "Ngữ pháp"];

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => {
          resetMatchingFlow();
          navigate("/student/marketplace");
        }}
        className="mb-4 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400"
      >
        <ArrowLeft size={14} /> Quay lại Marketplace
      </button>

      <PageHeader
        className="mb-0"
        eyebrow="Bước 2/3 · Khai báo hồ sơ"
        title="Mục tiêu & Nhu cầu Học tập"
        description={`Cung cấp thông tin để Gia sư ${selectedTutor?.name || ""} thiết kế lộ trình cá nhân hóa cho bạn.`}
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Selected Tutor Banner */}
          <div className="flex items-center gap-3 rounded-xl bg-blue-50/80 p-3.5 border border-blue-200 dark:border-blue-900 dark:bg-blue-950/30">
            <Sparkles size={20} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                Gia sư đã chọn: <strong>{selectedTutor?.name}</strong> ({selectedTutor?.specialization?.join(", ")})
              </p>
              <p className="text-[11px] text-slate-500">Học phí: {selectedTutor?.ratePerHour}</p>
            </div>
          </div>

          {/* Goal selection */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <Target size={14} className="text-blue-600" /> Mục tiêu học tập chính
            </label>
            <select
              value={formData.targetGoal}
              onChange={(e) => setFormData({ ...formData, targetGoal: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900"
            >
              <option value="Luyện thi IELTS 6.5">Luyện thi IELTS 6.5</option>
              <option value="Luyện thi IELTS 7.0+">Luyện thi IELTS 7.0+</option>
              <option value="Tiếng Anh Giao Tiếp Phản Xạ">Tiếng Anh Giao Tiếp Phản Xạ</option>
              <option value="Củng cố Ngữ pháp & Lấy lại gốc">Củng cố Ngữ pháp & Lấy lại gốc</option>
              <option value="Luyện thi Chuyên / THPT Quốc Gia">Luyện thi Chuyên / THPT Quốc Gia</option>
            </select>
          </div>

          {/* Current Level */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <Award size={14} className="text-emerald-600" /> Trình độ hiện tại (Tự đánh giá)
            </label>
            <select
              value={formData.currentLevel}
              onChange={(e) => setFormData({ ...formData, currentLevel: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900"
            >
              <option value="A1 / Mất gốc">A1 / Mất gốc hoặc mới bắt đầu</option>
              <option value="A2 / Sơ cấp">A2 / Sơ cấp (Biết từ vựng cơ bản)</option>
              <option value="B1 / Trung cấp">B1 / Trung cấp (IELTS 4.5 - 5.5)</option>
              <option value="B2 / Khá">B2 / Khá (IELTS 6.0 - 6.5)</option>
            </select>
          </div>

          {/* Preferred Learning Mode */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <Laptop size={14} className="text-slate-400" strokeWidth={1.75} /> Hình thức học mong muốn
            </label>
            <select
              value={formData.learningModePref}
              onChange={(e) => setFormData({ ...formData, learningModePref: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm font-medium outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900"
            >
              <option value="online">Học Online (qua Zoom / Jitsi)</option>
              <option value="offline_home">Học trực tiếp tại nhà học sinh</option>
              <option value="offline_center">Học trực tiếp tại trung tâm</option>
            </select>
          </div>

          {/* Weak skills multi-select */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Kỹ năng cần ưu tiên cải thiện nhất (Chọn 1-3 kỹ năng)
            </label>
            <div className="flex flex-wrap gap-2">
              {allSkills.map((sk) => {
                const selected = formData.weakSkills.includes(sk);
                return (
                  <button
                    key={sk}
                    type="button"
                    onClick={() => handleSkillToggle(sk)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                      selected
                        ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-300"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {selected ? (
                      <Check size={12} strokeWidth={2.5} />
                    ) : (
                      <Plus size={12} strokeWidth={2.5} />
                    )}
                    {sk}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferred Weekly Schedule */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <Calendar size={14} className="text-amber-600" /> Khung giờ rảnh mong muốn
            </label>
            <input
              type="text"
              value={formData.weeklySchedule}
              onChange={(e) => setFormData({ ...formData, weeklySchedule: e.target.value })}
              placeholder="VD: 3 buổi/tuần (Tối T2-T4-T6)"
              className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900"
            />
          </div>

          {/* Note */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Ghi chú thêm cho Gia sư (Nếu có)
            </label>
            <textarea
              rows={3}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Nhập mong muốn cụ thể..."
              className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900"
            />
          </div>

          {/* Submit Action */}
          <Button type="submit" className="w-full">
            <Send size={16} /> Nộp Hồ sơ & Mở khung Chat với Gia sư
          </Button>
        </form>
      </Card>
    </div>
  );
}
