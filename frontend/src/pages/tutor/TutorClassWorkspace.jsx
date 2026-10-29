import { useCallback, useEffect, useState } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import { AlertCircle, CalendarDays, CalendarPlus, CheckCircle2, X } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import TrialSessionForm from "../../components/tutor/TrialSessionForm";
import FixedScheduleForm from "../../components/tutor/FixedScheduleForm";
import clsx from "clsx";
import { useAuth } from "../../context/AuthContext";
import { students } from "../../data/mockData";
import {
  apiCreateSession,
  apiCreateTrialSession,
  apiFinalizeSchedule,
  apiGetClassDetail,
  apiUpdateClassSchedules,
  apiUpdateTrialSession,
  formatSessionDate,
  mapClassDetail,
} from "../../lib/classroomApi";

/**
 * Layout provider của workspace riêng cho một lớp học (UC-T08).
 *
 * <p>Dữ liệu lớp (thông tin + lịch dạy thử) lấy từ API thật; banner thiết lập lịch
 * dạy thử và modal form hiển thị trên mọi tab. Bốn danh sách của các tab prototype
 * (lộ trình, buổi học, bài tập, tài liệu) vẫn dùng dữ liệu mock như trước.
 */
export default function TutorClassWorkspace() {
  const { classId } = useParams();
  const { token } = useAuth();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formInitial, setFormInitial] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Lịch dạy cố định (UC-T09): modal form chốt/sửa + tạo buổi học on-demand.
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleInitial, setScheduleInitial] = useState([]);
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [creatingSessionDate, setCreatingSessionDate] = useState(null);
  const [createError, setCreateError] = useState("");

  // Dữ liệu mock của các tab prototype — giữ nguyên hành vi của workspace cũ.
  const [demoStudent] = useState(() => students[0]);
  const [pathItems, setPathItems] = useState(demoStudent.learningPath || []);
  const [dailySessions, setDailySessions] = useState(demoStudent.dailySessions || []);
  const [exercisesList, setExercisesList] = useState(demoStudent.exercises || []);
  const [materialsList, setMaterialsList] = useState(demoStudent.materials || []);

  useEffect(() => {
    setPathItems(demoStudent.learningPath || []);
    setDailySessions(demoStudent.dailySessions || []);
    setExercisesList(demoStudent.exercises || []);
    setMaterialsList(demoStudent.materials || []);
  }, [classId, demoStudent]);

  const loadDetail = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const result = await apiGetClassDetail(token, classId);
      setDetail(mapClassDetail(result));
    } catch (err) {
      setError(err.message || "Không thể tải thông tin lớp học.");
    } finally {
      setLoading(false);
    }
  }, [token, classId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const openTrialForm = (initial) => {
    setFormInitial(initial || { teachingMode: detail?.teachingMode || "ONLINE" });
    setFormError("");
    setShowForm(true);
  };

  const closeTrialForm = () => {
    setShowForm(false);
    setFormError("");
  };

  const handleSubmitTrial = async (payload) => {
    if (!token || submitting) return;
    setSubmitting(true);
    setFormError("");
    try {
      if (detail.trialSession) {
        await apiUpdateTrialSession(token, classId, payload);
        setToast({ type: "success", message: "Đã cập nhật lịch dạy thử thành công." });
      } else {
        await apiCreateTrialSession(token, classId, payload);
        setToast({
          type: "success",
          message: `Đã thiết lập lịch dạy thử thành công cho ngày ${formatSessionDate(payload.sessionDate)}.`,
        });
      }
      setShowForm(false);
      loadDetail();
    } catch (err) {
      setFormError(err.message || "Không thể lưu lịch dạy thử.");
    } finally {
      setSubmitting(false);
    }
  };

  const openScheduleForm = (initialSlots) => {
    setScheduleInitial(initialSlots || []);
    setScheduleError("");
    setShowScheduleForm(true);
  };

  const closeScheduleForm = () => {
    setShowScheduleForm(false);
    setScheduleError("");
  };

  const handleSubmitSchedule = async (payload) => {
    if (!token || scheduleSubmitting) return;
    setScheduleSubmitting(true);
    setScheduleError("");
    try {
      if (detail.hasSchedules) {
        await apiUpdateClassSchedules(token, classId, payload);
        setToast({ type: "success", message: "Đã cập nhật lịch dạy cố định." });
      } else {
        await apiFinalizeSchedule(token, classId, payload);
        setToast({ type: "success", message: "Đã chốt lịch dạy cố định." });
      }
      closeScheduleForm();
      loadDetail();
    } catch (err) {
      setScheduleError(err.message || "Không thể lưu lịch dạy cố định.");
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const handleCreateSession = async (sessionDate, startTime) => {
    if (!token || creatingSessionDate) return;
    setCreatingSessionDate(sessionDate);
    setCreateError("");
    try {
      await apiCreateSession(token, classId, { sessionDate, startTime: startTime || null });
      setToast({
        type: "success",
        message: `Đã tạo buổi học chính thức cho ngày ${formatSessionDate(sessionDate)}.`,
      });
      loadDetail();
    } catch (err) {
      setCreateError(err.message || "Không thể tạo buổi học.");
    } finally {
      setCreatingSessionDate(null);
    }
  };

  if (loading && !detail) {
    return (
      <div className="space-y-6">
        <Card className="space-y-4 border-slate-200/80 p-5 dark:border-slate-800">
          <div className="h-6 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/70" />
            <div className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/70" />
            <div className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/70" />
          </div>
          <div className="h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/70" />
        </Card>
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="space-y-6">
        <Card className="space-y-3 border-slate-200/80 py-12 text-center dark:border-slate-800">
          <AlertCircle size={32} className="mx-auto text-rose-400" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{error}</p>
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDetail}
              className="cursor-pointer text-xs font-semibold"
            >
              Thử lại
            </Button>
            <Link
              to="/tutor/classes"
              className="inline-flex items-center rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-700"
            >
              Về danh sách lớp
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const needsTrialSetup = detail.status === "TRIAL" && !detail.trialSession;
  // Banner "Thiết lập lịch dạy cố định": lớp ACTIVE chưa có class_schedules (kế hoạch Phase 3).
  const needsScheduleSetup = detail.status === "ACTIVE" && !detail.hasSchedules;
  const basePath = `/tutor/classes/${classId}`;

  return (
    <div className="space-y-5">
      {toast && (
        <div
          className={clsx(
            "fixed right-5 top-5 z-50 flex max-w-md items-center gap-3 rounded-xl px-4 py-3.5 text-white shadow-2xl",
            toast.type === "error" ? "bg-rose-600" : "bg-blue-600",
          )}
        >
          {toast.type === "error" ? (
            <AlertCircle size={20} className="shrink-0" />
          ) : (
            <CheckCircle2 size={20} className="shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Banner nhắc thiết lập lịch dạy thử — hiển thị trên mọi tab của workspace */}
      {needsTrialSetup && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/30 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-300">
              <CalendarPlus size={18} />
            </span>
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Lớp học đang ở giai đoạn dạy thử
              </p>
              <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
                Hãy trao đổi với phụ huynh rồi thiết lập ngày, khung giờ và hình thức cho buổi học
                thử duy nhất của lớp.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => openTrialForm(null)}
            className="shrink-0 cursor-pointer bg-amber-600 px-4 text-xs font-bold text-white hover:bg-amber-700"
          >
            <CalendarPlus size={14} /> Thiết lập lịch dạy thử
          </Button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <CalendarPlus size={18} />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                    {detail.trialSession ? "Chỉnh sửa lịch dạy thử" : "Thiết lập lịch dạy thử"}
                  </h4>
                  <p className="text-[11px] text-slate-400">{detail.className}</p>
                </div>
              </div>
              <button
                onClick={closeTrialForm}
                className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <TrialSessionForm
              initial={formInitial}
              submitting={submitting}
              serverError={formError}
              onCancel={closeTrialForm}
              onSubmit={handleSubmitTrial}
            />
          </div>
        </div>
      )}

      {/* Banner nhắc thiết lập lịch dạy cố định (lớp ACTIVE chưa có ca) */}
      {needsScheduleSetup && (
        <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-900/60 dark:bg-blue-950/30 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300">
              <CalendarDays size={18} />
            </span>
            <div>
              <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                Thiết lập lịch dạy cố định
              </p>
              <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-300">
                Lớp đã được kích hoạt. Chọn các ca dạy trong tuần và khoảng hiệu lực của từng ca để
                hoàn thiện lịch học chính thức.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => openScheduleForm(null)}
            className="shrink-0 cursor-pointer bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700"
          >
            <CalendarPlus size={14} /> Thiết lập lịch dạy cố định
          </Button>
        </div>
      )}

      {/* Modal form lịch dạy cố định (chốt lần đầu hoặc sửa) */}
      {showScheduleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <CalendarDays size={18} />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                    {detail.hasSchedules ? "Cập nhật lịch dạy cố định" : "Thiết lập lịch dạy cố định"}
                  </h4>
                  <p className="text-[11px] text-slate-400">{detail.className}</p>
                </div>
              </div>
              <button
                onClick={closeScheduleForm}
                className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <FixedScheduleForm
              initialSlots={scheduleInitial}
              isUpdate={detail.hasSchedules}
              submitting={scheduleSubmitting}
              serverError={scheduleError}
              onCancel={closeScheduleForm}
              onSubmit={handleSubmitSchedule}
            />
          </div>
        </div>
      )}

      <Outlet
        context={{
          // API thật
          detail,
          classId,
          basePath,
          openTrialForm,
          openScheduleForm,
          onCreateSession: handleCreateSession,
          creatingSessionDate,
          createError,
          // Mock cho 4 tab prototype
          student: demoStudent,
          pathItems,
          setPathItems,
          dailySessions,
          setDailySessions,
          exercisesList,
          setExercisesList,
          materialsList,
          setMaterialsList,
        }}
      />
    </div>
  );
}
