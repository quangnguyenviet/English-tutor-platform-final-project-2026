import { useState } from "react";
import {
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Banknote,
  Plus,
  Eye,
  X,
  FileWarning,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";

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

export default function ReceptionistComplaints() {
  const { session, complaintList, addComplaint, resolveComplaint } = useAuth();

  const [query, setQuery] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [toastMessage, setToastMessage] = useState(null);
  const [viewingComplaint, setViewingComplaint] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [resolveModal, setResolveModal] = useState({ open: false, complaint: null, resolution: "" });

  const [form, setForm] = useState({
    type: "REFUND",
    complainantName: "",
    complainantRole: "tutor",
    complainantPhone: "",
    complainantId: "",
    classInfo: "",
    enrollmentId: "",
    refundAmount: "",
    description: "",
  });

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

  const filtered = complaintList.filter(
    (c) =>
      (statusTab === "all" || c.status === statusTab) &&
      (typeFilter === "all" || c.type === typeFilter) &&
      (c.id.toLowerCase().includes(query.toLowerCase()) ||
        c.complainantName.toLowerCase().includes(query.toLowerCase()) ||
        c.classInfo.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase()))
  );

  function handleCreate() {
    if (!form.complainantName.trim() || !form.description.trim()) {
      showToast("Vui lòng điền đầy đủ tên người khiếu nại và nội dung.");
      return;
    }
    addComplaint({
      type: form.type,
      typeLabel: form.type === "REFUND" ? "Hoàn tiền cho gia sư" : "Ghép lại lớp cho phụ huynh",
      complainantId: form.complainantId || `id-${Date.now()}`,
      complainantName: form.complainantName,
      complainantRole: form.complainantRole,
      complainantPhone: form.complainantPhone,
      receptionistId: "r1",
      receptionistName: session?.name || "Lễ tân",
      enrollmentId: form.enrollmentId,
      classInfo: form.classInfo,
      refundAmount: form.type === "REFUND" ? Number(form.refundAmount) || 0 : 0,
      description: form.description,
    });
    showToast("Đã tạo đơn khiếu nại mới thành công!");
    setShowCreateForm(false);
    setForm({
      type: "REFUND",
      complainantName: "",
      complainantRole: "tutor",
      complainantPhone: "",
      complainantId: "",
      classInfo: "",
      enrollmentId: "",
      refundAmount: "",
      description: "",
    });
  }

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
                  <p className="text-slate-400 mb-0.5">Thời gian</p>
                  <p className="font-medium text-slate-700 dark:text-slate-200">{formatTs(viewingComplaint.createdAt)}</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-0.5">Lớp liên quan</p>
                  <p className="font-medium text-slate-700 dark:text-slate-200">{viewingComplaint.classInfo}</p>
                </div>
                {viewingComplaint.type === "REFUND" && (
                  <div>
                    <p className="text-slate-400 mb-0.5">Số tiền hoàn</p>
                    <p className="font-bold text-rose-600 dark:text-rose-400">{fmtVND(viewingComplaint.refundAmount)}</p>
                  </div>
                )}
                <div>
                  <p className="text-slate-400 mb-0.5">Trạng thái</p>
                  <Badge tone={viewingComplaint.status === "pending" ? "amber" : "emerald"}>{viewingComplaint.statusLabel}</Badge>
                </div>
              </div>
              <div>
                <p className="text-slate-400 mb-0.5">Nội dung</p>
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={() => setResolveModal({ open: false, complaint: null, resolution: "" })}>
          <div className="fade-slide-in relative w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-slate-200 p-5 dark:border-slate-800">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <CheckCircle size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Đánh dấu đã xử lý</h3>
                <p className="text-[11px] text-slate-400">{resolveModal.complaint?.id}</p>
              </div>
            </div>
            <div className="p-5">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Kết quả xử lý *</label>
              <textarea
                className={`${inputClass} min-h-[80px]`}
                value={resolveModal.resolution}
                onChange={(e) => setResolveModal((p) => ({ ...p, resolution: e.target.value }))}
                placeholder="Mô tả kết quả xử lý..."
              />
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3.5 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setResolveModal({ open: false, complaint: null, resolution: "" })}>Hủy</Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleResolve}>
                <CheckCircle size={14} /> Xác nhận
              </Button>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title="Xử lý khiếu nại"
        description="Tiếp nhận và ghi nhận khiếu nại từ phụ huynh hoặc gia sư đến trực tiếp trung tâm."
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={AlertCircle} label="Tổng khiếu nại" value={complaintList.length} tone="amber" />
        <StatCard icon={Clock} label="Chưa xử lí" value={pendingCount} tone="rose" hint={`${resolvedCount} đã xử lí`} />
        <StatCard icon={Banknote} label="Tổng đã hoàn trả" value={fmtVND(totalRefund)} tone="rose" />
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
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm kiếm..."
                className={`${inputClass} pl-8 w-48`}
              />
            </div>
            <Button size="sm" onClick={() => setShowCreateForm(true)}>
              <Plus size={14} /> Tạo đơn khiếu nại
            </Button>
          </div>
        </div>
      </Card>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <FileWarning size={16} className="text-rose-500" /> Tạo đơn khiếu nại mới
            </h3>
            <button onClick={() => setShowCreateForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Loại khiếu nại *</label>
              <select className={inputClass} value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                <option value="REFUND">Hoàn tiền cho gia sư</option>
                <option value="REMATCH">Ghép lại lớp cho phụ huynh</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Vai trò người khiếu nại *</label>
              <select className={inputClass} value={form.complainantRole} onChange={(e) => setForm((p) => ({ ...p, complainantRole: e.target.value }))}>
                <option value="tutor">Gia sư</option>
                <option value="parent">Phụ huynh</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Họ tên người khiếu nại *</label>
              <input className={inputClass} value={form.complainantName} onChange={(e) => setForm((p) => ({ ...p, complainantName: e.target.value }))} placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Mã người khiếu nại</label>
              <input className={inputClass} value={form.complainantId} onChange={(e) => setForm((p) => ({ ...p, complainantId: e.target.value }))} placeholder="t1, ph-1..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">SĐT</label>
              <input className={inputClass} value={form.complainantPhone} onChange={(e) => setForm((p) => ({ ...p, complainantPhone: e.target.value }))} placeholder="0901 234 567" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Lớp liên quan</label>
              <input className={inputClass} value={form.classInfo} onChange={(e) => setForm((p) => ({ ...p, classInfo: e.target.value }))} placeholder="Lớp Nguyễn Minh Anh (IELTS)" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Mã Enrollment</label>
              <input className={inputClass} value={form.enrollmentId} onChange={(e) => setForm((p) => ({ ...p, enrollmentId: e.target.value }))} placeholder="e-101" />
            </div>
            {form.type === "REFUND" && (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Số tiền yêu cầu hoàn (₫)</label>
                <input className={inputClass} type="number" value={form.refundAmount} onChange={(e) => setForm((p) => ({ ...p, refundAmount: e.target.value }))} placeholder="450000" />
              </div>
            )}
          </div>
          <div className="mt-3">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nội dung khiếu nại chi tiết *</label>
            <textarea className={`${inputClass} min-h-[80px]`} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Mô tả nội dung khiếu nại..." />
          </div>
          <div className="mt-4 flex items-center gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={() => setShowCreateForm(false)}>Hủy</Button>
            <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white" onClick={handleCreate}>
              <Plus size={14} /> Tạo đơn khiếu nại
            </Button>
          </div>
        </Card>
      )}

      {/* Complaint List */}
      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-left">
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Mã KN</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Loại</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Người khiếu nại</th>
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
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">Không tìm thấy khiếu nại nào.</td>
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
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{c.classInfo}</td>
                    <td className="px-4 py-3">
                      {c.type === "REFUND" ? (
                        <span className="font-semibold text-rose-600 dark:text-rose-400 font-mono">{fmtVND(c.refundAmount)}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatTs(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={c.status === "pending" ? "amber" : "emerald"}>{c.statusLabel}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setViewingComplaint(c)} className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30 transition" title="Xem chi tiết">
                          <Eye size={14} />
                        </button>
                        {c.status === "pending" && (
                          <button onClick={() => setResolveModal({ open: true, complaint: c, resolution: "" })} className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 transition" title="Đánh dấu đã xử lý">
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
