import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  CheckCircle2,
  TrendingUp,
  Clock,
  Award,
  Zap,
  BookOpen,
  Calendar,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { getStudentById } from "../../data/mockData";

export default function ParentProgressViewPage() {
  const [lookupPhone, setLookupPhone] = useState("0966 223 344");
  const [isSearched, setIsSearched] = useState(true);
  const student = getStudentById("s1");

  const handleSearch = (e) => {
    e.preventDefault();
    if (!lookupPhone.trim()) return;
    setIsSearched(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-semibold border border-emerald-300 dark:border-emerald-800">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Cổng Tra cứu Tiến độ Dành riêng cho Phụ huynh</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Theo dõi Tiến độ Thực chất của Con
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Minh bạch hóa kết quả học tập thông qua biểu đồ định lượng, tỷ lệ hoàn thành bài tập về nhà và chỉ số tiến bộ năng lực Elo.
          </p>
        </div>

        {/* Lookup Box */}
        <div className="max-w-lg mx-auto bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={lookupPhone}
                onChange={(e) => setLookupPhone(e.target.value)}
                placeholder="Nhập SĐT phụ huynh (VD: 0966 223 344)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer"
            >
              Tra cứu
            </button>
          </form>
        </div>

        {isSearched && student && (
          <div className="space-y-6 animate-fade-in">
            {/* Child Profile Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                  {student.initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{student.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {student.grade} - Trình độ {student.level}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Mục tiêu: <strong className="text-slate-800 dark:text-slate-200">{student.goal}</strong> &middot; Phụ huynh: {student.parentName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4" /> Lớp học đang hoạt động ổn định
                </span>
              </div>
            </div>

            {/* Metric Cards - Effort vs Mastery (FR-15) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Card 1: Effort Metric */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Chỉ số Chăm chỉ & Nề nếp</h3>
                  </div>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg">
                    Rất tích cực
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tỷ lệ nộp bài đúng hạn</span>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {student.effortMetrics?.onTimeSubmissionRate || 90}%
                    </p>
                    <p className="text-[11px] text-emerald-600 font-semibold">✓ Không nợ bài tập tuần</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Chuỗi ôn tập Spaced Repetition</span>
                    <p className="text-2xl font-black text-amber-500">
                      {student.effortMetrics?.currentStreak || 5} ngày
                    </p>
                    <p className="text-[11px] text-slate-500">Tự giác ôn 5 phút mỗi ngày</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                    <span>Tỷ lệ hoàn thành bài luyện tập (PRACTICE)</span>
                    <span className="font-bold text-slate-900 dark:text-white">94%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: "94%" }} />
                  </div>
                </div>
              </div>

              {/* Card 2: Mastery Growth */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Tăng trưởng Năng lực (Elo Score)</h3>
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg">
                    Tăng +18 điểm Elo
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Chỉ số Tinh thông (Overall Elo)</span>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                      {student.studentKnowledgeProfile?.overallElo || 74}/100
                    </p>
                    <p className="text-[11px] text-slate-500">Chuẩn B1+ Foundation</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Điểm bài kiểm tra gần nhất</span>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      8.5/10
                    </p>
                    <p className="text-[11px] text-emerald-600 font-semibold">Tăng 1.5 điểm so với đầu khóa</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                    <span>Mức độ đạt mục tiêu IELTS 6.0</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">72%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: "72%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Top Strengths and Weaknesses for Parents */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Kỹ năng con tiếp thu vượt trội
                </h4>
                <div className="space-y-2">
                  {student.studentKnowledgeProfile?.strengths?.slice(0, 3).map((st, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{st.name}</span>
                      <span className="font-black text-emerald-700 dark:text-emerald-400">{st.masteryElo}/100 Elo</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Điểm yếu gia sư đang tập trung khắc phục
                </h4>
                <div className="space-y-2">
                  {student.studentKnowledgeProfile?.weaknesses?.slice(0, 3).map((wk, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 text-xs">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{wk.name}</p>
                        <p className="text-[10px] text-slate-500">{wk.suggestion}</p>
                      </div>
                      <span className="font-black text-rose-600 dark:text-rose-400">{wk.masteryElo}/100 Elo</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tutor Feedback Note */}
            <div className="bg-blue-50/60 dark:bg-blue-950/30 p-5 rounded-2xl border border-blue-200 dark:border-blue-900 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm font-bold">
                LA
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">Nhận xét định kỳ từ Gia sư Lan Anh</span>
                  <span className="text-[11px] text-slate-500">Cập nhật 2 ngày trước</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  &quot;Khôi có ý thức học bài rất nghiêm túc, đặc biệt nộp bài tập về nhà đầy đủ. Kỹ năng Phát âm và Đọc hiểu tiến bộ rõ rệt sau 4 tuần. Hiện tại cô đang tập trung rèn thêm cho em dạng bẫy nghe trong Section 3 và kỹ năng viết lại câu. Phụ huynh hoàn toàn yên tâm về tiến độ của con!&quot;
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
