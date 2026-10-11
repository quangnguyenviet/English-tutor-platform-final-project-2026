import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  X,
  BookOpen,
  Star,
  Award,
  FileText,
  PlayCircle,
  Download,
  Send,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Clock,
  HelpCircle,
  Check,
  Copy,
  Video,
  Key,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

export default function SessionDetailModal({ sessionItem, onClose }) {
  const [activeTab, setActiveTab] = useState("summary"); // "summary" | "tutor_eval" | "student_feedback" | "quiz"

  // Pre-fill student feedback state if available
  const existingFb = sessionItem?.studentFeedback || {};
  const [myRating, setMyRating] = useState(existingFb.rating || 5);
  const [selectedTags, setSelectedTags] = useState(
    existingFb.tags || ["Giảng bài dễ hiểu", "Nhiệt tình vui vẻ"]
  );
  const [feedbackComment, setFeedbackComment] = useState(existingFb.comment || "");
  const [isSubmitted, setIsSubmitted] = useState(!!existingFb.comment);
  const [toastMsg, setToastMsg] = useState(null);

  if (!sessionItem) return null;

  const availableTags = [
    "Giảng bài dễ hiểu",
    "Sửa phát âm siêu kỹ",
    "Nhiệt tình vui vẻ",
    "Chiến thuật đỉnh",
    "Tốc độ vừa phải",
    "Slide đẹp trực quan",
    "Tương tác nhiều",
  ];

  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    setToastMsg("Đã gửi đánh giá của bạn tới hệ thống và Gia sư thành công!");
    setTimeout(() => setToastMsg(null), 3000);
  };

  const summary = sessionItem.lessonSummary || {
    takeaways: [
      "Tổng quan lý thuyết trọng tâm của bài học.",
      "Thực hành ứng dụng từ vựng và mẫu câu giao tiếp.",
      "Sửa lỗi thường gặp trong bài kiểm tra."
    ],
    keyVocabulary: [
      { word: "Example", type: "n.", meaning: "Ví dụ minh họa" },
    ],
    slideUrl: "#"
  };

  const evalData = sessionItem.tutorEvaluation || {
    attitudeRating: 5,
    comprehensionRating: 5,
    homeworkRating: 5,
    comment: "Học sinh tham gia lớp đúng giờ, phát biểu hăng hái và tiếp thu bài tốt.",
    focusPoints: "Củng cố lại từ vựng cũ trước giờ học."
  };

  const quiz = sessionItem.endOfSessionQuiz || {
    id: "e1",
    title: "Bài kiểm tra củng cố kiến thức cuối buổi học",
    score: 9,
    maxScore: 10,
    questionCount: 5,
    status: "graded"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-xl animate-bounce text-xs font-semibold">
          <CheckCircle2 size={18} className="text-emerald-400 dark:text-emerald-600" />
          {toastMsg}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <img
              src={sessionItem.tutorAvatar}
              alt={sessionItem.tutorName}
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-200 dark:ring-slate-700 shrink-0 mt-0.5"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {sessionItem.tutorName}
                </span>
                <Badge tone="slate" size="xs">
                  {sessionItem.subject}
                </Badge>
                <Badge tone="slate" size="xs">
                  {sessionItem.learningMode === "offline" ? "Offline" : "Online"}
                </Badge>
                <span className="text-xs text-slate-400">&middot;</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {sessionItem.dayOfWeek} ({sessionItem.dateStr})
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5 line-clamp-1">
                {sessionItem.topic}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-4 bg-white dark:bg-slate-900 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab("summary")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-all shrink-0 ${activeTab === "summary"
                ? "border-slate-800 text-slate-900 dark:border-slate-100 dark:text-white font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
          >
            <BookOpen size={15} /> Tóm tắt kiến thức
          </button>

          <button
            onClick={() => setActiveTab("tutor_eval")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-all shrink-0 ${activeTab === "tutor_eval"
                ? "border-slate-800 text-slate-900 dark:border-slate-100 dark:text-white font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
          >
            <Award size={15} /> Gia sư đánh giá
          </button>

          <button
            onClick={() => setActiveTab("student_feedback")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-all shrink-0 ${activeTab === "student_feedback"
                ? "border-slate-800 text-slate-900 dark:border-slate-100 dark:text-white font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
          >
            <Star size={15} className="text-amber-500" /> Feedback của bạn
          </button>

          <button
            onClick={() => setActiveTab("quiz")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-all shrink-0 ${activeTab === "quiz"
                ? "border-slate-800 text-slate-900 dark:border-slate-100 dark:text-white font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
          >
            <HelpCircle size={15} /> Bài test cuối buổi
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* TAB 1: TÓM TẮT KIẾN THỨC */}
          {activeTab === "summary" && (
            <div className="space-y-4 animate-fadeIn">
              {/* Class Info Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg">
                      <Video size={18} />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        {sessionItem.learningMode === "offline" ? "Địa điểm & Thời gian Học Offline" : "Thông tin Phòng học Trực tuyến"}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {sessionItem.platform || (sessionItem.learningMode === "online" ? "Phòng học Online EdTech HD" : "Học Offline tại nhà/trung tâm")}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-200/70 dark:bg-slate-700/80 px-3 py-1 rounded-lg flex items-center gap-1">
                    <Clock size={13} /> {sessionItem.startTime} - {sessionItem.endTime} ({sessionItem.dayOfWeek})
                  </span>
                </div>

                {sessionItem.learningMode === "online" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {/* Mã Lớp / Room ID */}
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">🔑 Mã Lớp / Room ID</span>
                        <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                          {sessionItem.classCode || "JITSI-IELTS-8529"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(sessionItem.classCode || "JITSI-IELTS-8529");
                          setToastMsg("Đã sao chép Mã lớp học!");
                          setTimeout(() => setToastMsg(null), 2500);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1 shrink-0"
                      >
                        <Copy size={11} /> Copy
                      </button>
                    </div>

                    {/* Mật Khẩu Phòng */}
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">🔒 Mật khẩu phòng</span>
                        <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                          {sessionItem.passcode || "IELTS2026"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(sessionItem.passcode || "IELTS2026");
                          setToastMsg("Đã sao chép Mật khẩu!");
                          setTimeout(() => setToastMsg(null), 2500);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1 shrink-0"
                      >
                        <Copy size={11} /> Copy
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="text-slate-500 font-medium">📍 Địa điểm học Offline: </span>
                    <span className="font-bold text-slate-900 dark:text-white">{sessionItem.location}</span>
                  </div>
                )}

                {/* Meeting Link Direct Button */}
                {sessionItem.learningMode === "online" && sessionItem.meetingLink && (
                  <div className="pt-1 flex items-center justify-between gap-2 flex-wrap border-t border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      💡 Hãy mở phòng trước 5 phút để kiểm tra Micro và Camera.
                    </span>
                    <a
                      href={sessionItem.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <Video size={13} /> Vào phòng học trực tuyến <ExternalLink size={11} />
                    </a>
                  </div>
                )}
              </div>

              {/* Takeaways List */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                  <Sparkles size={16} className="text-slate-600 dark:text-slate-400" /> Kiến thức trọng tâm buổi học:
                </h4>
                <ul className="space-y-2 pl-2">
                  {summary.takeaways.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Vocabulary Table */}
              {summary.keyVocabulary && summary.keyVocabulary.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                    <FileText size={15} className="text-slate-600 dark:text-slate-400" /> Từ vựng & Collocations nổi bật:
                  </h4>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                        <tr>
                          <th className="p-2.5">Từ vựng / Cấu trúc</th>
                          <th className="p-2.5">Loại từ</th>
                          <th className="p-2.5">Ý nghĩa / Cách dùng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {summary.keyVocabulary.map((vocab, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 font-bold text-slate-900 dark:text-white">{vocab.word}</td>
                            <td className="p-2.5 text-slate-500 font-mono text-[11px]">{vocab.type}</td>
                            <td className="p-2.5 text-slate-700 dark:text-slate-300">{vocab.meaning}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Download Slide & Record Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                {sessionItem.learningMode === "online" && sessionItem.hasRecord && (
                  <Button variant="secondary" size="sm" className="flex-1 flex items-center justify-center gap-1.5 text-xs">
                    <PlayCircle size={15} className="text-slate-700 dark:text-slate-300" /> Xem Video Record ({sessionItem.recordDuration})
                  </Button>
                )}
                <Button variant="outline" size="sm" className="flex-1 flex items-center justify-center gap-1.5 text-xs">
                  <Download size={14} /> Tải Slide PDF bài học
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: GIA SƯ ĐÁNH GIÁ HỌC SINH */}
          {activeTab === "tutor_eval" && (
            <div className="space-y-4 animate-fadeIn">
              {/* Rating criteria breakdown */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Award size={18} className="text-amber-500" /> Điểm đánh giá buổi học từ {sessionItem.tutorName}:
                </h4>

                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-center shadow-2xs border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Thái độ học tập</span>
                    <div className="flex items-center justify-center text-amber-500 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className={i < evalData.attitudeRating ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-center shadow-2xs border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Khả năng tiếp thu</span>
                    <div className="flex items-center justify-center text-amber-500 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className={i < evalData.comprehensionRating ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-center shadow-2xs border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Hoàn thành BTVN</span>
                    <div className="flex items-center justify-center text-amber-500 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className={i < evalData.homeworkRating ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Feedback Text */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <p className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <MessageSquare size={15} /> Nhận xét chi tiết từ Gia sư:
                </p>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic text-xs">
                  &quot;{evalData.comment}&quot;
                </p>
              </div>

              {/* Focus Points Alert */}
              {evalData.focusPoints && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-2.5 text-slate-800 dark:text-slate-200">
                  <Sparkles size={16} className="text-slate-600 dark:text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-xs">🎯 Điểm cần lưu ý cho buổi học tới:</span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{evalData.focusPoints}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FEEDBACK CỦA HỌC SINH */}
          {activeTab === "student_feedback" && (
            <form onSubmit={handleFeedbackSubmit} className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div>
                  <label className="block font-bold text-slate-900 dark:text-white text-xs mb-1.5">
                    Đánh giá mức độ hài lòng về buổi học này:
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setMyRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          size={24}
                          className={star <= myRating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                      {myRating === 5 ? "Tuyệt vời ⭐⭐⭐⭐⭐" : `${myRating} Sao`}
                    </span>
                  </div>
                </div>

                {/* Quick Feedback Tags */}
                <div>
                  <label className="block font-bold text-slate-900 dark:text-white text-xs mb-2">
                    Chọn nhanh các điểm ấn tượng của Gia sư:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => handleTagToggle(tag)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${isSelected
                              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                            }`}
                        >
                          {isSelected && <Check size={12} />}
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Feedback Comment Textarea */}
                <div>
                  <label className="block font-bold text-slate-900 dark:text-white text-xs mb-1">
                    Gợi ý / Nhận xét thêm của bạn gửi tới Gia sư:
                  </label>
                  <textarea
                    rows={3}
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Nhập cảm nhận của bạn về buổi học..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                {isSubmitted ? (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={14} /> Bạn đã gửi đánh giá cho buổi học này!
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Đánh giá của bạn sẽ giúp Gia sư cải thiện buổi học tiếp theo.</span>
                )}
                <Button type="submit" size="sm" className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white font-bold">
                  <Send size={14} /> {isSubmitted ? "Cập nhật đánh giá" : "Gửi đánh giá"}
                </Button>
              </div>
            </form>
          )}

          {/* TAB 4: BÀI KIỂM TRA CUỐI BUỔI */}
          {activeTab === "quiz" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge tone="slate" size="xs">
                      End-of-Session Quiz
                    </Badge>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base mt-1">
                      {quiz.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Giao bởi {sessionItem.tutorName} &middot; {quiz.questionCount} câu hỏi trắc nghiệm / tự luận
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block">Kết quả bài làm</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {quiz.score}/{quiz.maxScore}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Trạng thái:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">✓ Đã hoàn thành & Chấm điểm</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Tỷ lệ chính xác:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {Math.round((quiz.score / quiz.maxScore) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Link
                  to={`/student/exercises/${quiz.id}`}
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-xl text-xs font-bold transition-transform active:scale-95 flex items-center gap-1.5"
                >
                  Xem chi tiết bài làm & Lời giải ➔
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

