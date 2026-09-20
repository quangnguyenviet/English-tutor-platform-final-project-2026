import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FileText,
  Clock,
  ArrowRight,
  BookOpen,
  Filter,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getStudentById } from "../../data/mockData";

export default function StudentExercises() {
  const { session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const student = getStudentById(session?.studentId || "s1");

  const tutorParam = searchParams.get("tutor") || "all";
  const [selectedTutor, setSelectedTutor] = useState(tutorParam);
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    if (searchParams.get("tutor")) {
      setSelectedTutor(searchParams.get("tutor"));
    }
  }, [searchParams]);

  const handleSelectTutor = (tutorId) => {
    setSelectedTutor(tutorId);
    if (tutorId === "all") {
      searchParams.delete("tutor");
    } else {
      searchParams.set("tutor", tutorId);
    }
    setSearchParams(searchParams);
  };

  const rawExercises = student?.exercises || [];

  // Tutors list for selection (No photos, clean text & subject)
  const tutors = [
    { id: "all", name: "Tất cả gia sư", subject: "Toàn bộ bài tập" },
    { id: "t1", name: "Cô Lan Anh", subject: "IELTS 6.5+" },
    { id: "t2", name: "Thầy Minh Quân", subject: "Writing Task 2" },
    { id: "t3", name: "Cô Thu Hà", subject: "Giao tiếp & IPA" },
  ];

  // Compute pending count per tutor
  const getAssignedCount = (tutorId) => {
    if (tutorId === "all") return rawExercises.filter((e) => e.status === "assigned").length;
    return rawExercises.filter((e) => e.tutorId === tutorId && e.status === "assigned").length;
  };

  const statusList = [
    { id: "all", label: "Tất cả" },
    { id: "assigned", label: "Chưa làm" },
    { id: "submitted", label: "Chờ chấm" },
    { id: "graded", label: "Đã chấm" },
  ];

  // Filter exercises
  const filteredExercises = rawExercises.filter((ex) => {
    const matchTutor = selectedTutor === "all" || ex.tutorId === selectedTutor;
    const matchStatus = selectedStatus === "all" || ex.status === selectedStatus;
    return matchTutor && matchStatus;
  });

  const activeTutor = tutors.find((t) => t.id === selectedTutor) || tutors[0];

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Page Header - Clean & Minimal */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Bài tập & Kiểm tra</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Chọn gia sư để xem và làm bài tập được giao.
        </p>
      </div>

      {/* ===== MINIMAL TUTOR SELECTOR (NO PHOTOS, CLEAN PILLS) ===== */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
          Chọn gia sư muốn làm bài:
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {tutors.map((tutor) => {
            const isSelected = selectedTutor === tutor.id;
            const assignedCount = getAssignedCount(tutor.id);

            return (
              <button
                key={tutor.id}
                onClick={() => handleSelectTutor(tutor.id)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center gap-2 border ${
                  isSelected
                    ? "bg-foreground text-background border-foreground shadow-xs"
                    : "bg-card text-foreground border-border hover:bg-muted/60"
                }`}
              >
                <span>{tutor.name}</span>
                {tutor.id !== "all" && (
                  <span className={`text-[11px] ${isSelected ? "text-background/80" : "text-muted-foreground"}`}>
                    ({tutor.subject})
                  </span>
                )}
                {assignedCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      isSelected
                        ? "bg-background text-foreground"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {assignedCount} cần làm
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== STATUS FILTER & ACTIVE CONTEXT ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border">
        {/* Status filter buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground mr-1 flex items-center gap-1">
            <Filter size={13} /> Lọc:
          </span>
          {statusList.map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStatus(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedStatus === st.id
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Exercises count indicator */}
        <div className="text-xs text-muted-foreground">
          {selectedTutor !== "all" ? (
            <span>
              Đang xem bài của <strong>{activeTutor.name}</strong> ({filteredExercises.length} bài)
            </span>
          ) : (
            <span>Tổng cộng: <strong>{filteredExercises.length}</strong> bài tập</span>
          )}
        </div>
      </div>

      {/* ===== EXERCISE CARDS LIST ===== */}
      <div className="space-y-3">
        {filteredExercises.map((ex) => {
          const isAssigned = ex.status === "assigned";
          const isGraded = ex.status === "graded";
          const isSubmitted = ex.status === "submitted";

          return (
            <div
              key={ex.id}
              className="rounded-2xl border border-border bg-card p-4 sm:p-5 hover:border-primary/40 transition-colors space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                {/* Left content: Title & metadata */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  {/* Meta tag line */}
                  <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{ex.tutorName}</span>
                    <span>&middot;</span>
                    <span className="px-2 py-0.5 rounded-md bg-muted/60 border border-border text-[11px]">
                      {ex.subject}
                    </span>
                    <span>&middot;</span>
                    <span className="px-2 py-0.5 rounded-md bg-muted/60 text-[11px]">
                      {ex.mode === "practice" ? "Luyện tập" : "Kiểm tra"}
                    </span>
                    {ex.dueDate && isAssigned && (
                      <>
                        <span>&middot;</span>
                        <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                          <Clock size={12} /> Hạn nộp: {ex.dueDate}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Exercise Title */}
                  <h3 className="text-base font-semibold text-foreground hover:text-primary transition-colors">
                    {ex.title}
                  </h3>

                  {/* Details */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-0.5">
                    <span>Kỹ năng: {ex.skill}</span>
                    <span>&middot;</span>
                    <span>Độ khó: {ex.difficulty}</span>
                    <span>&middot;</span>
                    <span>Dạng: {ex.type}</span>
                  </div>

                  {/* Tutor note if any */}
                  {ex.tutorNote && isAssigned && (
                    <p className="text-xs text-muted-foreground italic pt-1">
                      💡 Nhắn nhủ: &ldquo;{ex.tutorNote}&rdquo;
                    </p>
                  )}

                  {/* Tutor feedback if graded */}
                  {isGraded && ex.feedback && (
                    <div className="mt-2 p-3 rounded-xl bg-muted/40 border border-border text-xs">
                      <p className="font-semibold text-foreground mb-0.5">
                        Nhận xét của {ex.tutorName}:
                      </p>
                      <p className="text-muted-foreground italic">&ldquo;{ex.feedback}&rdquo;</p>
                    </div>
                  )}
                </div>

                {/* Right content: Status badge & Button */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                  <div className="flex items-center gap-2">
                    {isGraded && (
                      <span className="text-sm font-bold text-foreground">
                        {ex.score}/{ex.maxScore} đ
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        isAssigned
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400"
                          : isSubmitted
                          ? "bg-muted text-muted-foreground border-border"
                          : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                      }`}
                    >
                      {isAssigned ? "Chưa làm" : isSubmitted ? "Chờ chấm" : "Đã chấm"}
                    </span>
                  </div>

                  {isAssigned ? (
                    <Link
                      to={`/student/exercises/${ex.id}`}
                      className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      Làm bài <ArrowRight size={13} />
                    </Link>
                  ) : (
                    <Link
                      to={`/student/exercises/${ex.id}`}
                      className="px-3.5 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-medium transition-colors"
                    >
                      Xem lại
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredExercises.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-2">
            <BookOpen className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-foreground">Không có bài tập nào</p>
            <p className="text-xs text-muted-foreground">
              Không tìm thấy bài tập nào phù hợp với bộ lọc hiện tại.
            </p>
            <button
              onClick={() => {
                handleSelectTutor("all");
                setSelectedStatus("all");
              }}
              className="mt-2 text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              Xem tất cả bài tập
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
