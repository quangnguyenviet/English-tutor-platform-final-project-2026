import { useState } from "react";
import {
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Banknote,
  Users,
  FileText,
  Eye,
  X,
  Filter,
  TrendingDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";
import ConfirmModal from "../../components/ui/ConfirmModal";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950 dark:text-slate-100";

const fmtVND = (n) => n.toLocaleString("vi-VN") + "₫";

function formatTs(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return (
    d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  );
}

export default function ComplaintManagement() {
  const { complaintList, resolveComplaint } = useAuth();

  const [query, setQuery] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [toastMessage, setToastMessage] = useState(null);
  const [viewingComplaint, setViewingComplaint] = useState(null);
  const [resolveModal, setResolveModal] = useState({ open: false, complaint: null, resolution: "" });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Metrics
  const pendingCount = complaintList.filter((c) => c.status === "pending").length;
  const resolvedCount = complaintList.filter((c) => c.status === "resolved").length;
  const totalRefund = complaintList
    .filter((c) => c.type === "REFUND" && c.status === "resolved")
    .reduce((sum, c) => sum + (c.refundAmount || 0), 0);
  const rematchCount = complaintList.filter((c) => c.type === "REMATCH").length;
  const refundCount = complaintList.filter((c) => c.type === "REFUND").length;

  const filtered = complaintList.filter(
    (c) =>
      (statusTab === "all" || c.status === statusTab) &&
      (typeFilter === "all" || c.type === typeFilter) &&
      (c.id.toLowerCase().includes(query.toLowerCase()) ||
        c.complainantName.toLowerCase().includes(query.toLowerCase()) ||
        c.receptionistName.toLowerCase().includes(query.toLowerCase()) ||
        c.classInfo.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase()))
  );

  function handleResolve() {
    if (!resolveModal.resolution.trim()) {
      showToast("Vui lòng nhập kết quả xử lý.");
      return;
    }
    resolveComplaint(resolveModal.complaint.id, resolveModal.resolution);
    showToast(`Đã đánh dấu khiếu nại ${resolveModal.complaint.id} là "Đã xử lí".`);
    setResolveModal({ open: false, complaint: null, resolution: "" });
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl fade-slide-in">
          <CheckCircle size={18} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Detail Modal */}
      {viewingComplaint && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setViewingComplaint(null)}
        >
          <div
            className="fade-slide-in relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  viewingComplaint.type === "REFUND" ? "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400" : "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                }`}>
                  {viewingComplaint.type === "REFUND" ? <Banknote size={18} /> : <RefreshCw size={18} />}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{viewingComplaint.id}</h3>
                  <p className="text-[11px] text-slate-400">{viewingComplaint.typeLabel}</p>
                </div>
              </div>
              <button onClick={() => setViewingComplaint(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-slate-400 mb-0.5">Người khiếu nại</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{viewingComplaint.complainantName}</p>
                  <p className="text-[11px] text-slate-400">{viewingComplaint.complainantRole === "tutor" ? "Gia sư" : "Phụ huynh"} • {viewingComplaint.complainantPhone}</p>
                  <p className="text-[11px] text-slate-400 font-mono">Mã: {viewingComplaint.complainantId}</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-0.5">Lễ tân tiếp nhận</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{viewingComplaint.receptionistName}</p>
                  <p className="text-[11px] text-slate-400 font-mono">Mã: {viewingComplaint.receptionistId}</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-0.5">Thời gian tiếp nhận</p>
                  <p className="font-medium text-slate-700 dark:text-slate-200">{formatTs(viewingComplaint.createdAt)}</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-0.5">Lớp liên quan</p>
                  <p className="font-medium text-slate-700 dark:text-slate-200">{viewingComplaint.classInfo}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{viewingComplaint.enrollmentId}</p>
                </div>
                {viewingComplaint.type === "REFUND" && (
                  <div>
                    <p className="text-slate-400 mb-0.5">Số tiền yêu cầu hoàn</p>
                    <p className="font-bold text-rose-600 dark:text-rose-400">{fmtVND(viewingComplaint.refundAmount)}</p>
                  </div>
                )}
                <div>
                  <p className="text-slate-400 mb-0.5">Trạng thái</p>
                  <Badge tone={viewingComplaint.status === "pending" ? "amber" : "emerald"}>
                    {viewingComplaint.statusLabel}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-slate-400 mb-0.5">Nội dung khiếu nại</p>
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">{viewingComplaint.description}</p>
              </div>
              {viewingComplaint.resolution && (
                <div>
                  <p className="text-slate-400 mb-0.5">Kết quả xử lý</p>
                  <p className="text-emerald-700 dark:text-emerald-300 leading-relaxed bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3">{viewingComplaint.resolution}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Xử lý lúc: {formatTs(viewingComplaint.resolvedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolveModal.open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setResolveModal({ open: false, complaint: null, resolution: "" })}
        >
          <div
            className="fade-slide-in relative w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-slate-200 p-5 dark:border-slate-800">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <CheckCircle size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Đánh dấu đã xử lý</h3>
                <p className="text-[11px] text-slate-400">{resolveModal.complaint?.id}</p>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Kết quả xử lý *</label>
                <textarea
                  className={`${inputClass} min-h-[80px]`}
                  value={resolveModal.resolution}
                  onChange={(e) => setResolveModal((p) => ({ ...p, resolution: e.target.value }))}
                  placeholder="Mô tả kết quả xử lý khiếu nại..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3.5 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setResolveModal({ open: false, complaint: null, resolution: "" })}>Hủy</Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleResolve}>
                <CheckCircle size={14} /> Xác nhận đã xử lý
              </Button>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title="Xử lý khiếu nại & Đối soát tài chính"
        description="Giám sát toàn bộ khiếu nại từ phụ huynh/gia sư, đối soát tài chính thu vào/chi ra."
      />

      {/* Financial Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={AlertCircle} label="Tổng khiếu nại" value={complaintList.length} tone="amber" />
        <StatCard icon={Clock} label="Chưa xử lí" value={pendingCount} tone="rose" hint={`${resolvedCount} đã xử lí`} />
        <StatCard icon={TrendingDown} label="Tổng tiền đã hoàn trả" value={fmtVND(totalRefund)} tone="rose" hint={`${refundCount} đơn hoàn tiền`} />
        <StatCard icon={RefreshCw} label="Ghép lại lớp" value={rematchCount} tone="blue" hint="Yêu cầu đổi gia sư" />
      </div>

      {/* Toolbar */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { value: "all", label: "Tất cả" },
              { value: "pending", label: "Chưa xử lí" },
              { value: "resolved", label: "Đã xử lí" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusTab(opt.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  statusTab === opt.value
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
            <span className="mx-1 text-slate-300 dark:text-slate-700">|</span>
            {[
              { value: "all", label: "Tất cả loại" },
              { value: "REFUND", label: "Hoàn tiền" },
              { value: "REMATCH", label: "Ghép lại lớp" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTypeFilter(opt.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  typeFilter === opt.value
                    ? "bg-slate-800 text-white dark:bg-slate-600"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo mã, tên, lớp..."
              className={`${inputClass} pl-8 w-56`}
            />
          </div>
        </div>
      </Card>

      {/* Complaint List */}
      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-left">
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Mã KN</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Loại</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Người khiếu nại</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Lễ tân tiếp nhận</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Lớp</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Số tiền hoàn</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Thời gian</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Trạng thái</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    Không tìm thấy khiếu nại nào phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">{c.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={c.type === "REFUND" ? "rose" : "blue"}>
                        {c.type === "REFUND" ? "Hoàn tiền" : "Ghép lại lớp"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{c.complainantName}</p>
                      <p className="text-[11px] text-slate-400">
                        {c.complainantRole === "tutor" ? "Gia sư" : "Phụ huynh"} • {c.complainantPhone}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700 dark:text-slate-200">{c.receptionistName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{c.receptionistId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700 dark:text-slate-200">{c.classInfo}</p>
                    </td>
                    <td className="px-4 py-3">
                      {c.type === "REFUND" ? (
                        <span className="font-semibold text-rose-600 dark:text-rose-400 font-mono">{fmtVND(c.refundAmount)}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-600 dark:text-slate-300">{formatTs(c.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={c.status === "pending" ? "amber" : "emerald"}>
                        {c.statusLabel}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingComplaint(c)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30 transition"
                          title="Xem chi tiết"
                        >
                          <Eye size={14} />
                        </button>
                        {c.status === "pending" && (
                          <button
                            onClick={() => setResolveModal({ open: true, complaint: c, resolution: "" })}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 transition"
                            title="Đánh dấu đã xử lý"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
