import { useState } from "react";
import { Link } from "react-router-dom";
import { Library, Plus, Trash2, FileText } from "lucide-react";
import { exerciseBank } from "../../../data/mockData";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import { exerciseStatus } from "./manageHelpers";

export default function ManageAssignments({
  classId,
  exercisesList,
  setExercisesList,
  pathItems,
}) {
  const [tab, setTab] = useState("assigned");
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  function sessionLabel(sessionId) {
    const item = pathItems.find((it) => it.id === sessionId);
    return item ? `Buổi ${item.session}: ${item.topic}` : null;
  }

  function deleteExercise(id) {
    setExercisesList((prev) => prev.filter((ex) => ex.id !== id));
  }

  function applyBankExercise(bankEx) {
    setExercisesList((prev) => [
      {
        id: `ex-bank-${bankEx.id}-${Date.now()}`,
        title: bankEx.title,
        skill: bankEx.skill,
        difficulty: bankEx.difficulty,
        type: bankEx.type,
        status: "assigned",
        assignedDate: "Hôm nay",
        sessionId: null,
        fromLibrary: true,
      },
      ...prev,
    ]);
    setShowExercisePicker(false);
  }

  const filteredExercises = exercisesList.filter((ex) => {
    if (tab === "assigned") return ex.status === "assigned";
    return ex.status === "submitted" || ex.status === "graded";
  });

  return (
    <div className="space-y-4">
      {tab === "assigned" && (
        <div className="flex justify-end gap-2">
          <Link
            to={`/tutor/classes/${classId}/exercises/add`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            <Plus size={14} /> Thêm bài tập
          </Link>
          <button
            onClick={() => setShowExercisePicker((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:text-blue-400"
          >
            <Library size={14} /> Chọn từ Kho bài tập
          </button>
        </div>
      )}

      {showExercisePicker && (
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">Chọn bài tập từ Kho</h3>
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {exerciseBank.map((bankEx) => (
              <div
                key={bankEx.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{bankEx.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {bankEx.skill} &middot; {bankEx.difficulty} &middot; {bankEx.type}
                  </p>
                </div>
                <Button size="sm" onClick={() => applyBankExercise(bankEx)} type="button">
                  Thêm
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Bài được thêm là bản sao riêng — sửa nội dung sau đó không ảnh hưởng tới bài gốc trong Kho.
          </p>
        </Card>
      )}

      {/* Tab navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setTab("assigned")}
          className={`px-4 py-2.5 text-sm font-medium transition ${
            tab === "assigned"
              ? "border-b-2 border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Bài tập đã giao
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs tabular-nums dark:bg-slate-800">
            {exercisesList.filter((ex) => ex.status === "assigned").length}
          </span>
        </button>
        <button
          onClick={() => setTab("submitted")}
          className={`px-4 py-2.5 text-sm font-medium transition ${
            tab === "submitted"
              ? "border-b-2 border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Bài làm đã nộp
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs tabular-nums dark:bg-slate-800">
            {exercisesList.filter((ex) => ex.status === "submitted" || ex.status === "graded").length}
          </span>
        </button>
      </div>

      <Card padded={false}>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredExercises.map((ex) => (
            <div key={ex.id} className="group flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <Link
                  to={`/tutor/classes/${classId}/exercises/${ex.id}`}
                  state={{ exercise: ex, sessionLabel: sessionLabel(ex.sessionId) }}
                  className="text-sm font-medium text-slate-900 hover:accent-text hover:underline dark:text-slate-50 dark:hover:accent-text-dark"
                >
                  {ex.title}
                </Link>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {ex.skill} &middot; {ex.difficulty} &middot; {ex.type} &middot; Giao ngày {ex.assignedDate}
                </p>
                <p className="mt-1 text-xs">
                  {sessionLabel(ex.sessionId) ? (
                    <span className="inline-flex items-center gap-1 accent-text dark:accent-text-dark">
                      <FileText size={11} /> {sessionLabel(ex.sessionId)}
                    </span>
                  ) : (
                    <span className="text-slate-400">Chưa gắn buổi học</span>
                  )}
                </p>
                {ex.status === "graded" && ex.feedback && (
                  <p className="mt-1.5 rounded-md bg-slate-50 px-2 py-1.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Nhận xét: {ex.feedback}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {ex.status === "graded" && (
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {ex.score}/{ex.maxScore}
                  </span>
                )}
                {ex.fromLibrary && (
                  <Badge tone="neutral">
                    <Library size={11} /> Từ kho
                  </Badge>
                )}
                <Badge tone={exerciseStatus[ex.status].tone}>{exerciseStatus[ex.status].label}</Badge>
                {tab === "assigned" && (
                  <div className="flex items-center gap-1 opacity-40 transition group-hover:opacity-100">
                    <button
                      onClick={() => deleteExercise(ex.id)}
                      title="Xóa"
                      className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredExercises.length === 0 && (
            <p className="p-6 text-center text-sm text-slate-400">
              {tab === "assigned" ? "Chưa có bài tập nào." : "Học sinh chưa nộp bài làm nào."}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}