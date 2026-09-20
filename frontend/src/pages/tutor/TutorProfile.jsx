import { useState } from "react";
import {
  Check,
  MapPin,
  Plus,
  Save,
  X,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Info,
  Lock,
  Zap,
  RefreshCw,
  Upload,
  Trash2,
  CheckCircle2,
  XCircle,
  FileCheck,
  ArrowRight,
  Sliders,
  FileText,
  CreditCard,
  GraduationCap,
  Camera,
  Video,
  Play,
  Film,
  Sparkles
} from "lucide-react";
import clsx from "clsx";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";

// Subject Options
const subjectOptions = [
  "IELTS",
  "IELTS Writing",
  "IELTS Reading",
  "Giao tiếp cơ bản",
  "Phát âm",
  "Nghe hiểu",
  "Speaking nâng cao",
  "Debate",
  "Ngữ pháp",
  "Từ vựng nâng cao",
  "Từ vựng học thuật",
];

const levelOptions = [
  { value: "teacher", label: "Giáo viên / Giảng viên", desc: "Đang giảng dạy tại trường học hoặc trung tâm" },
  { value: "professional", label: "Người đi làm / Chuyên gia", desc: "Đang làm việc tại doanh nghiệp hoặc làm tự do" },
  { value: "student", label: "Sinh viên Đại học", desc: "Đang theo học tại các trường Đại học / Cao đẳng" },
];

const levelLabels = {
  teacher: "Giáo viên / Giảng viên",
  professional: "Người đi làm / Chuyên gia",
  student: "Sinh viên Đại học",
};

const weekDays = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const dayBlocks = ["Sáng", "Chiều", "Tối"];

// Style utilities strictly following DESIGN.md
const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-950 transition-all";

const pendingInputClass =
  "w-full rounded-lg border border-amber-300 bg-amber-50/40 px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-amber-700/80 dark:bg-amber-950/20 dark:text-slate-100 dark:focus:ring-amber-950 transition-all";

const chipClass = (active) =>
  clsx(
    "rounded-full border px-3 py-1.5 text-xs font-medium transition cursor-pointer select-none",
    active
      ? "border-blue-600 bg-blue-600 text-white"
      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700"
  );

// Baseline approved profile data
const defaultApprovedProfile = {
  tutorId: "t1",
  status: "approved", // "approved" | "pending_approval" | "rejected"
  rejectionReason: "",

  // Basic Info (Instant Update - No Admin approval required)
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
  avatarFileName: "anh_chan_dung_lananh.jpg",
  videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
  videoFileName: "video_gioi_thieu_lananh.mp4",
  videoEmbedUrl: "https://www.youtube.com/watch?v=demo_tutor_intro",
  subjects: ["IELTS", "Giao tiếp cơ bản", "Ngữ pháp", "Phát âm"],
  bio: "Chuyên viên phiên dịch & giảng dạy tiếng Anh chuyên sâu luyện thi IELTS và tiếng Anh giao tiếp doanh nghiệp.",
  serviceAreas: ["Quận 1, TP.HCM", "Quận 3, TP.HCM", "Dạy online"],
  availability: ["Thứ 2|Tối", "Thứ 4|Tối", "Thứ 6|Tối", "Thứ 7|Sáng", "Thứ 7|Chiều", "Chủ nhật|Sáng"],
  phone: "0987 654 321",
  zalo: "0987 654 321",

  // Important Info: Academic & Proof Documents (Requires Admin approval)
  qualificationLevel: "professional", // "teacher" | "professional" | "graduated" | "student"
  currentRole: "Chuyên viên Dịch thuật & Đối ngoại",
  birthYear: "2001 (25 tuổi)",
  hometown: "Nam Định",
  currentAddress: "Quận 3, TP.HCM",
  university: "Đại học Ngoại Thương TP.HCM - Ngôn ngữ Anh",
  highSchool: "THPT Chuyên Lê Hồng Phong (Nam Định)",
  graduationScore: "28.5 điểm khối D01",
  academicRank: "Xuất sắc (GPA 3.85/4.0)",

  // Academic Proof Files
  degreeScanName: "bang_dai_hoc_ngoai_thuong_lananh.pdf",
  transcriptScanName: "bang_diem_gpa_ngoai_thuong_lananh.pdf",

  // Extra Certificates
  certificates: [
    { id: "c1", name: "IELTS 8.5 Overall", issuer: "British Council", year: "2022", fileName: "ielts_8.5_certificate.pdf", status: "approved" },
    { id: "c2", name: "Chứng chỉ Nghiệp vụ Sư phạm", issuer: "ĐH Sư phạm TP.HCM", year: "2019", fileName: "nghiep_vu_su_pham.pdf", status: "approved" },
  ],
};

function emptyCertForm() {
  return { name: "", issuer: "", year: "", fileName: "" };
}

// Important fields metadata
const IMPORTANT_FIELDS_META = {
  avatarFileName: { label: "Ảnh chân dung gia sư (Rõ mặt)", format: (v) => v || "anh_chan_dung.jpg" },
  qualificationLevel: { label: "Vai trò / Phân loại gia sư", format: (v) => levelLabels[v] || v },
  currentRole: { label: "Công việc / Lĩnh vực hiện tại" },
  birthYear: { label: "Năm sinh / Tuổi" },
  hometown: { label: "Quê quán" },
  currentAddress: { label: "Nơi ở hiện tại" },
  university: { label: "Trường ĐH & Chuyên ngành" },
  highSchool: { label: "Trường THPT Cấp 3" },
  graduationScore: { label: "Điểm tốt nghiệp THPT / Thi ĐH" },
  academicRank: { label: "Xếp loại Học lực / GPA" },
  degreeScanName: { label: "Minh chứng Bằng ĐH / Thẻ SV" },
  transcriptScanName: { label: "Minh chứng Bảng điểm GPA / Học bạ" },
};

export default function TutorProfile() {
  // Official active approved profile
  const [approvedProfile, setApprovedProfile] = useState(defaultApprovedProfile);

  // Overall profile approval state: "approved" | "pending_approval" | "rejected"
  const [profileStatus, setProfileStatus] = useState("approved");
  const [rejectionReason, setRejectionReason] = useState("");

  // Working form data state
  const [formData, setFormData] = useState(defaultApprovedProfile);

  // Pending changes dictionary for important fields: { [fieldName]: { oldVal, newVal } }
  const [pendingChanges, setPendingChanges] = useState({});

  // Pending certificates awaiting admin approval
  const [pendingCertificates, setPendingCertificates] = useState([]);

  // Certificate form state
  const [certForm, setCertForm] = useState(emptyCertForm());
  const [simulatedCertFile, setSimulatedCertFile] = useState(null);

  // New service area input
  const [newArea, setNewArea] = useState("");

  // System notification banner
  const [notification, setNotification] = useState(null);

  // ----------------------------------------------------
  // Basic Info Handlers (Instant Update)
  // ----------------------------------------------------
  function toggleSubject(s) {
    setFormData((prev) => {
      const nextSubjects = prev.subjects.includes(s)
        ? prev.subjects.filter((x) => x !== s)
        : [...prev, s];
      return { ...prev, subjects: nextSubjects };
    });
  }

  function toggleSlot(day, block) {
    const key = `${day}|${block}`;
    setFormData((prev) => {
      const nextSlots = prev.availability.includes(key)
        ? prev.availability.filter((x) => x !== key)
        : [...prev, key];
      return { ...prev, availability: nextSlots };
    });
  }

  function addServiceArea() {
    const value = newArea.trim();
    if (!value || formData.serviceAreas.includes(value)) return;
    setFormData((prev) => ({ ...prev, serviceAreas: [...prev.serviceAreas, value] }));
    setNewArea("");
  }

  function removeServiceArea(area) {
    setFormData((prev) => ({
      ...prev,
      serviceAreas: prev.serviceAreas.filter((a) => a !== area),
    }));
  }

  // ----------------------------------------------------
  // Academic & Proof File Selection Simulators
  // ----------------------------------------------------
  function handleAvatarFileUpload(e) {
    const file = e.target.files?.[0];
    if (file) {
      const tempUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        avatarFileName: file.name,
        avatarUrl: tempUrl,
      }));
    }
  }

  function handleVideoFileUpload(e) {
    const file = e.target.files?.[0];
    if (file) {
      const tempUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        videoFileName: file.name,
        videoUrl: tempUrl,
      }));
    }
  }

  function handleRemoveVideo() {
    setFormData((prev) => ({
      ...prev,
      videoFileName: "",
      videoUrl: "",
      videoEmbedUrl: "",
    }));
  }

  function handleProofFileUpload(fieldKey, e) {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, [fieldKey]: file.name }));
    }
  }

  function handleCertFileSelect(e) {
    const file = e.target.files?.[0];
    if (file) {
      setSimulatedCertFile(file.name);
      setCertForm((f) => ({ ...f, fileName: file.name }));
    }
  }

  function addCertificateRequest() {
    if (!certForm.name.trim()) return;
    const newCert = {
      id: `cert-pending-${Date.now()}`,
      name: certForm.name.trim(),
      issuer: certForm.issuer.trim() || "Chưa cập nhật",
      year: certForm.year.trim() || new Date().getFullYear().toString(),
      fileName: certForm.fileName || `${certForm.name.trim().toLowerCase().replace(/\s+/g, "_")}_scan.pdf`,
      status: "pending_approval",
      submittedAt: new Date().toLocaleDateString("vi-VN"),
    };

    setPendingCertificates((prev) => [...prev, newCert]);
    setCertForm(emptyCertForm());
    setSimulatedCertFile(null);
    setProfileStatus("pending_approval");
    setNotification({
      type: "important",
      title: "Đã ghi nhận chứng chỉ mới",
      message: "Chứng chỉ đã được xếp vào danh sách chờ Admin phê duyệt.",
    });
  }

  function removePendingCert(id) {
    setPendingCertificates((prev) => prev.filter((c) => c.id !== id));
  }

  function removeApprovedCert(id) {
    const certToRemove = approvedProfile.certificates.find((c) => c.id === id);
    if (!certToRemove) return;

    setPendingChanges((prev) => ({
      ...prev,
      [`remove_cert_${id}`]: {
        type: "remove_certificate",
        certId: id,
        certName: certToRemove.name,
        label: `Yêu cầu gỡ chứng chỉ: ${certToRemove.name}`,
        oldVal: certToRemove.name,
        newVal: "[Yêu cầu xóa]",
      },
    }));

    setProfileStatus("pending_approval");
    setNotification({
      type: "important",
      title: "Yêu cầu gỡ chứng chỉ đang chờ duyệt",
      message: `Admin sẽ xem xét yêu cầu gỡ chứng chỉ "${certToRemove.name}".`,
    });
  }

  function cancelCertRemoveRequest(id) {
    setPendingChanges((prev) => {
      const next = { ...prev };
      delete next[`remove_cert_${id}`];
      return next;
    });
  }

  // ----------------------------------------------------
  // Save Logic
  // ----------------------------------------------------
  function handleSaveProfile() {
    let hasBasicChanges = false;
    let hasImportantChanges = false;
    const newPendingObj = { ...pendingChanges };

    // Check Basic fields
    const basicKeys = ["subjects", "bio", "serviceAreas", "availability", "phone", "zalo", "videoUrl", "videoFileName", "videoEmbedUrl"];
    basicKeys.forEach((key) => {
      if (JSON.stringify(formData[key]) !== JSON.stringify(approvedProfile[key])) {
        hasBasicChanges = true;
      }
    });

    // Check Important fields & Proof Files
    const importantKeys = [
      "avatarFileName",
      "qualificationLevel",
      "currentRole",
      "birthYear",
      "hometown",
      "currentAddress",
      "university",
      "highSchool",
      "graduationScore",
      "academicRank",
      "degreeScanName",
      "transcriptScanName",
    ];

    importantKeys.forEach((key) => {
      const oldVal = approvedProfile[key];
      const newVal = formData[key];
      if (String(oldVal).trim() !== String(newVal).trim()) {
        hasImportantChanges = true;
        const meta = IMPORTANT_FIELDS_META[key];
        const formatFn = meta?.format || ((v) => String(v));
        newPendingObj[key] = {
          fieldKey: key,
          label: meta?.label || key,
          oldVal: formatFn(oldVal),
          newVal: formatFn(newVal),
          rawNewVal: newVal,
        };
      } else {
        delete newPendingObj[key];
      }
    });

    if (pendingCertificates.length > 0) {
      hasImportantChanges = true;
    }

    let updatedApproved = { ...approvedProfile };

    if (hasBasicChanges) {
      basicKeys.forEach((key) => {
        updatedApproved[key] = formData[key];
      });
      setApprovedProfile(updatedApproved);
    }

    if (hasImportantChanges || Object.keys(newPendingObj).length > 0) {
      setPendingChanges(newPendingObj);
      setProfileStatus("pending_approval");
      setNotification({
        type: "important",
        title: "Đã cập nhật thông tin & Giấy tờ minh chứng",
        message: "Thông tin cơ bản đã áp dụng ngay. Lý lịch học tập, vai trò & bằng cấp mới đã được chuyển sang hàng chờ Admin phê duyệt.",
      });
    } else if (hasBasicChanges) {
      setNotification({
        type: "basic",
        title: "Cập nhật thành công",
        message: "Thông tin cơ bản đã có hiệu lực ngay lập tức.",
      });
    } else {
      setNotification({
        type: "info",
        title: "Không có thay đổi",
        message: "Không có dữ liệu nào mới được thay đổi.",
      });
    }
  }

  function handleCancelAllPending() {
    setPendingChanges({});
    setPendingCertificates([]);
    setFormData(approvedProfile);
    setProfileStatus("approved");
    setRejectionReason("");
    setNotification({
      type: "info",
      title: "Đã hủy các thay đổi chờ duyệt",
      message: "Hồ sơ đã được khôi phục về trạng thái được duyệt ban đầu.",
    });
  }

  // ----------------------------------------------------
  // Admin Simulation Actions (Prototype testing)
  // ----------------------------------------------------
  function simulateAdminApprove() {
    const newApproved = { ...approvedProfile };

    Object.keys(pendingChanges).forEach((key) => {
      const item = pendingChanges[key];
      if (item.type === "remove_certificate") {
        newApproved.certificates = newApproved.certificates.filter((c) => c.id !== item.certId);
      } else if (item.fieldKey) {
        newApproved[item.fieldKey] = item.rawNewVal;
      }
    });

    if (pendingCertificates.length > 0) {
      const approvedCerts = pendingCertificates.map((c) => ({ ...c, status: "approved" }));
      newApproved.certificates = [...newApproved.certificates, ...approvedCerts];
    }

    setApprovedProfile(newApproved);
    setFormData(newApproved);
    setPendingChanges({});
    setPendingCertificates([]);
    setProfileStatus("approved");
    setRejectionReason("");

    setNotification({
      type: "basic",
      title: "Admin đã phê duyệt",
      message: "Tất cả thông tin lý lịch & minh chứng đã được phê duyệt và áp dụng chính thức.",
    });
  }

  function simulateAdminReject() {
    setProfileStatus("rejected");
    setRejectionReason(
      "Admin phản hồi: Ảnh chụp minh chứng Bằng ĐH / Thẻ Sinh Viên chưa rõ nét. Vui lòng tải lại ảnh bản scan đầy đủ 4 góc."
    );
    setNotification({
      type: "rejected",
      title: "Yêu cầu bổ sung thông tin",
      message: "Admin đã gửi yêu cầu chỉnh sửa/bổ sung file minh chứng.",
    });
  }

  function applyPresetState(state) {
    if (state === "approved") {
      setProfileStatus("approved");
      setPendingChanges({});
      setPendingCertificates([]);
      setFormData(approvedProfile);
      setRejectionReason("");
    } else if (state === "pending") {
      const mockPending = {
        university: {
          fieldKey: "university",
          label: "Trường ĐH & Chuyên ngành",
          oldVal: "Đại học Sư Phạm TP.HCM - Sư phạm Tiếng Anh",
          newVal: "Đại học Ngoại Thương TP.HCM - Kinh tế đối ngoại",
          rawNewVal: "Đại học Ngoại Thương TP.HCM - Kinh tế đối ngoại",
        },
        degreeScanName: {
          fieldKey: "degreeScanName",
          label: "Minh chứng Bằng ĐH / Thẻ SV mới",
          oldVal: "bang_dai_hoc_su_pham_lananh.pdf",
          newVal: "bang_ngoai_thuong_scan_moi.pdf",
          rawNewVal: "bang_ngoai_thuong_scan_moi.pdf",
        },
      };
      const mockPendingCert = [
        {
          id: "cert-demo-1",
          name: "TESOL 120-hour Advanced Certificate",
          issuer: "Australian International College",
          year: "2025",
          fileName: "tesol_120h_lananh.pdf",
          status: "pending_approval",
          submittedAt: "10/09/2026",
        },
      ];

      setPendingChanges(mockPending);
      setPendingCertificates(mockPendingCert);
      setProfileStatus("pending_approval");
      setFormData((prev) => ({
        ...prev,
        university: "Đại học Ngoại Thương TP.HCM - Kinh tế đối ngoại",
        degreeScanName: "bang_ngoai_thuong_scan_moi.pdf",
      }));
    } else if (state === "rejected") {
      setProfileStatus("rejected");
      setRejectionReason(
        "Admin phản hồi: Ảnh bản scan Bằng tốt nghiệp ĐH bị mờ mất phần dấu mộc. Vui lòng chụp lại rõ ràng phần mộc đỏ của nhà trường."
      );
    }
  }

  const pendingCount = Object.keys(pendingChanges).length + pendingCertificates.length;

  return (
    <div className="space-y-6 pb-20">
      {/* ---------------------------------------------------- */}
      {/* PROTOTYPE TESTING BAR */}
      {/* ---------------------------------------------------- */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sliders size={18} className="text-slate-600 dark:text-slate-400 shrink-0" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Thử nghiệm prototype luồng duyệt hồ sơ &amp; minh chứng
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chuyển trạng thái hoặc giả lập thao tác Admin để kiểm thử giao diện:
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => applyPresetState("approved")}
              className={clsx(
                "rounded-md px-2.5 py-1 text-xs font-medium transition",
                profileStatus === "approved" && pendingCount === 0
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              )}
            >
              1. Đã duyệt (Approved)
            </button>
            <button
              type="button"
              onClick={() => applyPresetState("pending")}
              className={clsx(
                "rounded-md px-2.5 py-1 text-xs font-medium transition",
                profileStatus === "pending_approval" || pendingCount > 0
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              )}
            >
              2. Chờ duyệt (Pending)
            </button>
            <button
              type="button"
              onClick={() => applyPresetState("rejected")}
              className={clsx(
                "rounded-md px-2.5 py-1 text-xs font-medium transition",
                profileStatus === "rejected"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              )}
            >
              3. Yêu cầu sửa (Rejected)
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3 dark:border-slate-800 text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-400">Giả lập thao tác Admin:</span>
          <button
            type="button"
            onClick={simulateAdminApprove}
            className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-white hover:bg-emerald-700 transition"
          >
            <CheckCircle2 size={13} /> Duyệt hồ sơ ngay
          </button>
          <button
            type="button"
            onClick={simulateAdminReject}
            className="inline-flex items-center gap-1 rounded bg-rose-600 px-2.5 py-1 text-white hover:bg-rose-700 transition"
          >
            <XCircle size={13} /> Gửi yêu cầu sửa
          </button>

          {pendingCount > 0 && (
            <button
              type="button"
              onClick={handleCancelAllPending}
              className="inline-flex items-center gap-1 rounded bg-slate-200 px-2.5 py-1 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition sm:ml-auto"
            >
              <RefreshCw size={13} /> Đặt lại mặc định
            </button>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* PAGE HEADER */}
      {/* ---------------------------------------------------- */}
      <PageHeader
        title="Quản lý Hồ sơ Năng lực Gia sư"
        description="Khai báo ảnh chân dung rõ mặt, thông tin giảng dạy, vai trò / kinh nghiệm, lý lịch học tập kèm file minh chứng và thời gian rảnh."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <span className="text-rose-500 font-bold text-sm">*</span> Trường bắt buộc
          </span>
        }
      />

      {/* SYSTEM NOTIFICATION */}
      {notification && (
        <div
          className={clsx(
            "flex items-start justify-between gap-3 rounded-lg p-3.5 text-sm transition border",
            notification.type === "basic" && "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-200",
            notification.type === "important" && "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200",
            notification.type === "rejected" && "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200",
            notification.type === "info" && "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
          )}
        >
          <div className="flex items-start gap-2.5">
            {notification.type === "basic" && <Zap className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" size={16} />}
            {notification.type === "important" && <Clock className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" size={16} />}
            {notification.type === "rejected" && <AlertTriangle className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" size={16} />}
            {notification.type === "info" && <Info className="mt-0.5 shrink-0 text-slate-600 dark:text-slate-400" size={16} />}
            <div>
              <p className="font-semibold">{notification.title}</p>
              <p className="text-xs opacity-90 mt-0.5">{notification.message}</p>
            </div>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STATUS CARDS */}
      {/* ---------------------------------------------------- */}
      {profileStatus === "approved" && pendingCount === 0 && (
        <Card className="border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-slate-50">
                    Trạng thái hồ sơ: Đã phê duyệt chính thức
                  </h3>
                  <Badge tone="emerald">Đang hoạt động</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  Lý lịch học tập, minh chứng bằng cấp &amp; định danh của bạn đã được Admin xác thực chính thức.
                </p>
              </div>
            </div>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0">
              Mã Gia Sư: TS-001 (Nguyễn Lan Anh)
            </div>
          </div>
        </Card>
      )}

      {(profileStatus === "pending_approval" || pendingCount > 0) && (
        <Card className="border-amber-200 bg-amber-50/40 dark:border-amber-900/60 dark:bg-amber-950/20">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white">
                  <Clock size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-slate-50">
                      Trạng thái: Có {pendingCount} thông tin &amp; minh chứng chờ Admin xét duyệt
                    </h3>
                    <Badge tone="amber">Đang chờ duyệt</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    Trong thời gian chờ duyệt, hồ sơ và file minh chứng cũ vẫn hiển thị bình thường trên hệ thống.
                  </p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={handleCancelAllPending} className="shrink-0">
                <X size={14} /> Hủy các yêu cầu chờ duyệt
              </Button>
            </div>

            {/* PENDING SUMMARY TABLE */}
            <div className="rounded-lg border border-amber-200 bg-white p-3 dark:border-amber-900/60 dark:bg-slate-900">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileCheck size={14} className="text-amber-600" /> Các mục đang chờ phê duyệt:
              </h4>

              <div className="space-y-1.5 text-xs">
                {Object.keys(pendingChanges).map((key) => {
                  const item = pendingChanges[key];
                  return (
                    <div
                      key={key}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 rounded bg-slate-50 p-2 dark:bg-slate-800/60"
                    >
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {item.label}:
                      </span>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <span className="line-through text-slate-400">{item.oldVal}</span>
                        <ArrowRight size={12} className="text-amber-600" />
                        <span className="font-semibold text-slate-900 dark:text-slate-100 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded">
                          {item.newVal}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {pendingCertificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 rounded bg-slate-50 p-2 dark:bg-slate-800/60"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Chứng chỉ bổ sung:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded">
                        {cert.name} ({cert.issuer} - {cert.year})
                      </span>
                      <button
                        type="button"
                        onClick={() => removePendingCert(cert.id)}
                        className="text-rose-600 hover:text-rose-800 ml-1"
                        title="Hủy chứng chỉ này"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {profileStatus === "rejected" && (
        <Card className="border-rose-200 bg-rose-50/40 dark:border-rose-900/60 dark:bg-rose-950/20">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-600 text-white">
              <AlertTriangle size={20} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-slate-50">
                  Trạng thái: Admin yêu cầu bổ sung / chỉnh sửa
                </h3>
                <Badge tone="rose">Cần chỉnh sửa</Badge>
              </div>
              <div className="rounded-lg border border-rose-200 bg-white p-3 text-xs text-slate-700 dark:border-rose-900/60 dark:bg-slate-900 dark:text-slate-300">
                <p className="font-semibold text-rose-700 dark:text-rose-400 mb-1 flex items-center gap-1">
                  <Info size={14} /> Phản hồi từ Admin:
                </p>
                <p>{rejectionReason || "Ảnh minh chứng Bằng ĐH / CCCD chưa rõ nét. Vui lòng tải lại ảnh bản scan đầy đủ 4 góc văn bằng."}</p>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Vui lòng cập nhật thông tin &amp; file đính kèm bên dưới rồi nhấn <strong>"Lưu thay đổi hồ sơ"</strong> để gửi lại cho Admin.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION 1: MÔN / KỸ NĂNG (CƠ BẢN ⚡) */}
      {/* ---------------------------------------------------- */}
      <Card>
        <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Môn / Kỹ năng có thể giảng dạy <span className="text-rose-500 font-bold ml-0.5">*</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chọn các môn hoặc kỹ năng chuyên môn bạn nhận dạy.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Zap size={13} className="text-blue-500" /> Cập nhật ngay
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {subjectOptions.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => toggleSubject(s)}
              className={chipClass(formData.subjects.includes(s))}
            >
              {s}
            </button>
          ))}
        </div>
      </Card>

      {/* ---------------------------------------------------- */}
      {/* SECTION 2: GIỚI THIỆU BẢN THÂN & Ảnh ĐẠI DIỆN (CƠ BẢN ⚡) */}
      {/* ---------------------------------------------------- */}
      <Card>
        <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Ảnh chân dung, Giới thiệu ngắn &amp; Liên hệ
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload ảnh đại diện gia sư (yêu cầu rõ mặt) và mô tả phương pháp giảng dạy.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Zap size={13} className="text-blue-500" /> Cập nhật ngay
          </span>
        </div>

        <div className="space-y-5">
          {/* AVATAR UPLOAD SUB-SECTION */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative group shrink-0">
                <img
                  src={formData.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
                  alt="Ảnh chân dung gia sư"
                  className="h-24 w-24 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-md"
                />
                <label className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/50 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer">
                  <Camera size={20} />
                  <input
                    type="file"
                    onChange={handleAvatarFileUpload}
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                  />
                </label>
              </div>

              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Ảnh chân dung gia sư <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </h3>
                  {pendingChanges.avatarFileName ? (
                    <Badge tone="amber">Ảnh mới chờ duyệt</Badge>
                  ) : (
                    <Badge tone="emerald">Bắt buộc rõ mặt</Badge>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Ảnh đại diện hiển thị công khai cho Phụ huynh &amp; Học sinh. Bắt buộc chụp <strong>chân dung chính diện, rõ gương mặt, không đeo khẩu trang hoặc kính râm</strong>.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <label className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition cursor-pointer shadow-xs">
                    <Upload size={13} /> Tải ảnh chân dung mới
                    <input
                      type="file"
                      onChange={handleAvatarFileUpload}
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                    />
                  </label>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    File: {formData.avatarFileName || "anh_chan_dung_lananh.jpg"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* OPTIONAL VIDEO INTRO SUB-SECTION */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  <Video size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    Video Giới thiệu &amp; Thử giảng <span className="text-slate-400 font-normal normal-case">(Không bắt buộc)</span>
                  </h3>
                </div>
              </div>
              <Badge tone="indigo">
                <Sparkles size={11} className="mr-1" /> Khuyên dùng · Đóng góp 85% ấn tượng
              </Badge>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Tải lên video ngắn (khoảng 2-5 phút, hoặc dán link bài giảng dài hơn nếu có) để giới thiệu phong cách truyền đạt hoặc bài giảng thử về chủ đề thế mạnh (VD: IELTS Speaking part 2, Ngữ pháp cơ bản). Video giúp phụ huynh &amp; học sinh hình dung rõ nét nhất trước khi nhận lớp.
            </p>

            <div className="grid gap-3 sm:grid-cols-2 pt-1">
              {/* Option 1: Direct File Upload */}
              <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Upload size={13} className="text-blue-500" /> Tải file video trực tiếp (.mp4, .webm)
                </span>
                <div className="flex items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition cursor-pointer shrink-0">
                    <Film size={13} /> Chọn file video
                    <input
                      type="file"
                      onChange={handleVideoFileUpload}
                      className="hidden"
                      accept="video/mp4,video/webm,video/quicktime"
                    />
                  </label>
                  <span className="truncate text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {formData.videoFileName || "Chưa có file video"}
                  </span>
                </div>
              </div>

              {/* Option 2: Paste Video Link */}
              <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Play size={13} className="text-rose-500" /> Dán đường dẫn link (YouTube, TikTok, Drive...)
                </span>
                <input
                  type="url"
                  value={formData.videoEmbedUrl || ""}
                  onChange={(e) => setFormData({ ...formData, videoEmbedUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Giới thiệu ngắn bản thân &amp; Phong cách giảng dạy <span className="text-rose-500 font-bold ml-0.5">*</span>
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              placeholder="Kinh nghiệm giảng dạy, thế mạnh chuyên môn..."
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Số điện thoại liên hệ <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Số Zalo liên hệ <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={formData.zalo}
                onChange={(e) => setFormData({ ...formData, zalo: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* ---------------------------------------------------- */}
      {/* SECTION 3: VAI TRÒ & PHÂN LOẠI GIA SƯ (QUAN TRỌNG 🔒) */}
      {/* ---------------------------------------------------- */}
      <Card>
        <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              Vai trò &amp; Phân loại Gia sư
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Khai báo vai trò hiện tại (Giáo viên, Người đi làm, Sinh viên) và công việc / lĩnh vực công tác.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Lock size={13} className="text-amber-500" /> Cần Admin duyệt
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Vai trò / Đối tượng gia sư <span className="text-rose-500 font-bold ml-0.5">*</span></span>
              {pendingChanges.qualificationLevel && (
                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Clock size={11} /> Chờ duyệt
                </span>
              )}
            </label>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {levelOptions.map((o) => {
                const isSelected = formData.qualificationLevel === o.value;
                return (
                  <button
                    type="button"
                    key={o.value}
                    onClick={() => setFormData({ ...formData, qualificationLevel: o.value })}
                    className={clsx(
                      "flex flex-col items-start rounded-xl border p-3 text-left transition cursor-pointer select-none",
                      isSelected
                        ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 dark:border-blue-500 ring-2 ring-blue-500/20"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                    )}
                  >
                    <span className={clsx("text-xs font-bold", isSelected ? "text-blue-700 dark:text-blue-300" : "text-slate-800 dark:text-slate-200")}>
                      {o.label}
                    </span>
                    <span className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {o.desc}
                    </span>
                  </button>
                );
              })}
            </div>
            {pendingChanges.qualificationLevel && (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded border border-amber-200 dark:border-amber-900">
                Chờ duyệt: <strong>{pendingChanges.qualificationLevel.newVal}</strong> (Đang hiển thị: {pendingChanges.qualificationLevel.oldVal})
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Công việc / Lĩnh vực công tác hiện tại</span>
              {pendingChanges.currentRole && (
                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Clock size={11} /> Chờ duyệt
                </span>
              )}
            </label>
            <input
              type="text"
              value={formData.currentRole || ""}
              onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
              placeholder="VD: Software Engineer, Chuyên viên Marketing, Biên phiên dịch..."
              className={pendingChanges.currentRole ? pendingInputClass : inputClass}
            />
            {pendingChanges.currentRole && (
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                Chờ duyệt: <strong>{pendingChanges.currentRole.newVal}</strong>
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* ---------------------------------------------------- */}
      {/* SECTION 4: LÝ LỊCH HỌC TẬP & FILE MINH CHỨNG (QUAN TRỌNG 🔒) */}
      {/* ---------------------------------------------------- */}
      <Card>
        <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <GraduationCap size={18} className="text-blue-600" />
              Lý lịch Học tập &amp; File Minh chứng
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Khai báo học vấn kèm file/ảnh scan Bằng Đại Học / Thẻ Sinh Viên &amp; Bảng điểm để Admin đối soát chính xác.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Lock size={13} className="text-amber-500" /> Cần Admin duyệt
          </span>
        </div>

        {/* PART A: ACADEMIC TEXT FIELDS */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            1. Thông tin Học vấn &amp; Xuất thân
          </h3>

          <div className="grid gap-4 xs:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Năm sinh / Tuổi <span className="text-rose-500 font-bold ml-0.5">*</span></span>
                {pendingChanges.birthYear && <span className="text-[11px] text-amber-600 font-medium">Chờ duyệt</span>}
              </label>
              <input
                type="text"
                value={formData.birthYear}
                onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                placeholder="VD: 2001 (25 tuổi)"
                className={pendingChanges.birthYear ? pendingInputClass : inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Quê quán <span className="text-rose-500 font-bold ml-0.5">*</span></span>
                {pendingChanges.hometown && <span className="text-[11px] text-amber-600 font-medium">Chờ duyệt</span>}
              </label>
              <input
                type="text"
                value={formData.hometown}
                onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
                placeholder="VD: Nam Định"
                className={pendingChanges.hometown ? pendingInputClass : inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Nơi ở hiện tại <span className="text-rose-500 font-bold ml-0.5">*</span></span>
                {pendingChanges.currentAddress && <span className="text-[11px] text-amber-600 font-medium">Chờ duyệt</span>}
              </label>
              <input
                type="text"
                value={formData.currentAddress}
                onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
                placeholder="VD: Quận 3, TP.HCM"
                className={pendingChanges.currentAddress ? pendingInputClass : inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Trường THPT Cấp 3</span>
                {pendingChanges.highSchool && <span className="text-[11px] text-amber-600 font-medium">Chờ duyệt</span>}
              </label>
              <input
                type="text"
                value={formData.highSchool}
                onChange={(e) => setFormData({ ...formData, highSchool: e.target.value })}
                placeholder="VD: THPT Chuyên Lê Hồng Phong"
                className={pendingChanges.highSchool ? pendingInputClass : inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Trường ĐH &amp; Chuyên ngành <span className="text-rose-500 font-bold ml-0.5">*</span></span>
                {pendingChanges.university && <span className="text-[11px] text-amber-600 font-medium">Chờ duyệt</span>}
              </label>
              <input
                type="text"
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                placeholder="VD: ĐH Ngoại Thương - Ngôn ngữ Anh"
                className={pendingChanges.university ? pendingInputClass : inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Điểm tốt nghiệp THPT / Thi ĐH</span>
                {pendingChanges.graduationScore && <span className="text-[11px] text-amber-600 font-medium">Chờ duyệt</span>}
              </label>
              <input
                type="text"
                value={formData.graduationScore}
                onChange={(e) => setFormData({ ...formData, graduationScore: e.target.value })}
                placeholder="VD: 28.5 điểm khối D01"
                className={pendingChanges.graduationScore ? pendingInputClass : inputClass}
              />
            </div>

            <div className="xs:col-span-2 lg:col-span-3">
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Xếp loại Học lực &amp; GPA Đại học</span>
                {pendingChanges.academicRank && <span className="text-[11px] text-amber-600 font-medium">Chờ duyệt</span>}
              </label>
              <input
                type="text"
                value={formData.academicRank}
                onChange={(e) => setFormData({ ...formData, academicRank: e.target.value })}
                placeholder="VD: Xuất sắc (GPA 3.85/4.0)"
                className={pendingChanges.academicRank ? pendingInputClass : inputClass}
              />
            </div>
          </div>
        </div>

        {/* PART B: PROOF FILES */}
        <div className="mt-6 space-y-4 border-t border-slate-100 pt-5 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <FileText size={15} className="text-blue-600" />
            2. File Minh chứng Học vấn (Bằng ĐH / Thẻ Sinh Viên &amp; Bảng điểm)
          </h3>

          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-900/60 space-y-3">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Degree / Student ID Scan */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Minh chứng Bằng Tốt Nghiệp ĐH / Thẻ Sinh Viên <span className="text-rose-500 font-bold ml-0.5">*</span></span>
                  {pendingChanges.degreeScanName ? (
                    <span className="text-[10px] font-bold text-amber-600">File mới chờ duyệt</span>
                  ) : (
                    <Badge tone="emerald">Đã xác minh</Badge>
                  )}
                </label>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-center gap-2 truncate">
                    <FileText size={14} className="text-blue-500 shrink-0" />
                    <span className="truncate font-mono text-slate-700 dark:text-slate-300">
                      {formData.degreeScanName}
                    </span>
                  </div>
                  <label className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition cursor-pointer shrink-0 ml-2">
                    <Upload size={12} /> Tải file mới
                    <input type="file" onChange={(e) => handleProofFileUpload("degreeScanName", e)} className="hidden" accept="image/*,.pdf" />
                  </label>
                </div>
              </div>

              {/* GPA Transcript Scan */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Minh chứng Bảng điểm GPA / Học bạ THPT</span>
                  {pendingChanges.transcriptScanName ? (
                    <span className="text-[10px] font-bold text-amber-600">File mới chờ duyệt</span>
                  ) : (
                    <Badge tone="emerald">Đã xác minh</Badge>
                  )}
                </label>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-center gap-2 truncate">
                    <FileText size={14} className="text-blue-500 shrink-0" />
                    <span className="truncate font-mono text-slate-700 dark:text-slate-300">
                      {formData.transcriptScanName}
                    </span>
                  </div>
                  <label className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition cursor-pointer shrink-0 ml-2">
                    <Upload size={12} /> Tải file mới
                    <input type="file" onChange={(e) => handleProofFileUpload("transcriptScanName", e)} className="hidden" accept="image/*,.pdf" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ---------------------------------------------------- */}
      {/* SECTION 5: BẰNG CẤP & CHỨNG CHỈ (QUAN TRỌNG 🔒) */}
      {/* ---------------------------------------------------- */}
      <Card>
        <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Chứng chỉ và thành tích đặc biệt
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Danh sách văn bằng, chứng chỉ ngoại ngữ (IELTS, TESOL...), giải thưởng hoặc thành tích đặc biệt đính kèm.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Lock size={13} className="text-amber-500" /> Cần Admin duyệt
          </span>
        </div>

        {/* List of certificates */}
        <div className="space-y-3 mb-5">
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900 overflow-hidden text-sm">
            {approvedProfile.certificates.map((c) => {
              const isPendingRemoval = pendingChanges[`remove_cert_${c.id}`];
              return (
                <div
                  key={c.id}
                  className={clsx(
                    "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 transition",
                    isPendingRemoval ? "bg-rose-50/50 dark:bg-rose-950/20" : ""
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 mt-0.5">
                      <FileCheck size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-slate-900 dark:text-slate-50">
                          {c.name}
                        </p>
                        <Badge tone="emerald">Đã duyệt</Badge>
                      </div>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {[c.issuer, c.year].filter(Boolean).join(" · ")} | File: <span className="font-mono text-slate-600 dark:text-slate-300">{c.fileName}</span>
                      </p>

                      {isPendingRemoval && (
                        <p className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                          Đang có yêu cầu gỡ chứng chỉ chờ Admin duyệt...
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isPendingRemoval ? (
                      <Button variant="secondary" size="sm" onClick={() => cancelCertRemoveRequest(c.id)}>
                        Hủy yêu cầu gỡ
                      </Button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => removeApprovedCert(c.id)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition"
                      >
                        <Trash2 size={13} /> Yêu cầu gỡ
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {pendingCertificates.map((c) => (
              <div
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-amber-50/40 dark:bg-amber-950/20 text-sm"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 mt-0.5">
                    <Clock size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-slate-900 dark:text-slate-50">
                        {c.name}
                      </p>
                      <Badge tone="amber">Chờ duyệt</Badge>
                    </div>
                    <p className="truncate text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      {[c.issuer, c.year].filter(Boolean).join(" · ")} | File đính kèm: <span className="font-mono">{c.fileName}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => removePendingCert(c.id)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                  >
                    <X size={13} /> Hủy thêm
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add cert form */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50 space-y-3">
          <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Plus size={14} className="text-blue-600" /> Thêm chứng chỉ / thành tích đặc biệt:
          </h3>

          <div className="grid gap-3 sm:grid-cols-3">
            <input
              value={certForm.name}
              onChange={(e) => setCertForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Tên chứng chỉ / thành tích (VD: IELTS 8.0, Giải Nhất HSG...)"
              className={inputClass}
            />
            <input
              value={certForm.issuer}
              onChange={(e) => setCertForm((f) => ({ ...f, issuer: e.target.value }))}
              placeholder="Đơn vị cấp (VD: British Council)"
              className={inputClass}
            />
            <input
              value={certForm.year}
              onChange={(e) => setCertForm((f) => ({ ...f, year: e.target.value }))}
              placeholder="Năm cấp (VD: 2024)"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition cursor-pointer">
              <Upload size={13} />
              <span>{simulatedCertFile ? `Đã chọn: ${simulatedCertFile}` : "Tải file scan minh chứng (PDF, JPG)"}</span>
              <input type="file" onChange={handleCertFileSelect} className="hidden" accept="image/*,.pdf" />
            </label>

            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={addCertificateRequest}
              disabled={!certForm.name.trim()}
            >
              <Plus size={14} /> Thêm vào danh sách chờ duyệt
            </Button>
          </div>
        </div>
      </Card>

      {/* ---------------------------------------------------- */}
      {/* SECTION 6: KHU VỰC NHẬN LỚP (CƠ BẢN ⚡) */}
      {/* ---------------------------------------------------- */}
      <Card>
        <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Khu vực nhận lớp &amp; Hình thức dạy <span className="text-rose-500 font-bold ml-0.5">*</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Khu vực di chuyển giảng dạy hoặc chọn dạy Online.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Zap size={13} className="text-blue-500" /> Cập nhật ngay
          </span>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {formData.serviceAreas.map((area) => (
            <span
              key={area}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <MapPin size={12} className="text-slate-500" /> {area}
              <button
                onClick={() => removeServiceArea(area)}
                title="Xóa"
                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 ml-0.5"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {formData.serviceAreas.length === 0 && (
            <p className="text-sm text-slate-400">Chưa khai báo khu vực nào.</p>
          )}
        </div>

        <div className="flex max-w-sm gap-2">
          <input
            value={newArea}
            onChange={(e) => setNewArea(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addServiceArea();
              }
            }}
            placeholder="VD: Quận 7, TP.HCM hoặc Dạy Online"
            className={inputClass}
          />
          <Button variant="secondary" type="button" onClick={addServiceArea} disabled={!newArea.trim()}>
            <Plus size={14} /> Thêm
          </Button>
        </div>
      </Card>

      {/* ---------------------------------------------------- */}
      {/* SECTION 7: LỊCH RẢNH (CƠ BẢN ⚡) */}
      {/* ---------------------------------------------------- */}
      <Card padded={false} className="overflow-hidden">
        <div className="p-5 pb-3 flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Lịch rảnh có thể nhận lớp mới <span className="text-rose-500 font-bold ml-0.5">*</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chọn các khung giờ bạn rảnh để tiếp nhận lớp học sinh mới.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Zap size={13} className="text-blue-500" /> Cập nhật ngay
          </span>
        </div>

        <div className="overflow-x-auto p-4 lg:p-5">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-20"></th>
                {weekDays.map((day) => (
                  <th
                    key={day}
                    className="pb-2 text-center text-xs font-medium text-slate-600 dark:text-slate-400"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dayBlocks.map((block) => (
                <tr key={block}>
                  <td className="py-1 pr-3 text-xs font-medium text-slate-500 dark:text-slate-400">{block}</td>
                  {weekDays.map((day) => {
                    const key = `${day}|${block}`;
                    const active = formData.availability.includes(key);
                    return (
                      <td key={day} className="p-1 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSlot(day, block)}
                          title={`${day} - ${block}`}
                          className={clsx(
                            "flex h-8 w-full items-center justify-center rounded-md border transition cursor-pointer",
                            active
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-200 text-transparent hover:border-slate-300 dark:border-slate-800"
                          )}
                        >
                          <Check size={14} />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ---------------------------------------------------- */}
      {/* STICKY BOTTOM BAR */}
      {/* ---------------------------------------------------- */}
      <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 p-3.5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Save size={16} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Lưu thay đổi thông tin hồ sơ
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Thông tin cơ bản có hiệu lực ngay · Thông tin học vấn &amp; minh chứng gửi Admin duyệt
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Button variant="secondary" size="sm" onClick={handleCancelAllPending}>
              Khôi phục ban đầu
            </Button>
          )}
          <Button size="sm" onClick={handleSaveProfile}>
            <Save size={14} /> Lưu thay đổi hồ sơ
          </Button>
        </div>
      </div>
    </div>
  );
}
