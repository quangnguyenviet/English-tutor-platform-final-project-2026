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
  Upload,
  Trash2,
  CheckCircle2,
  XCircle,
  FileCheck,
  ArrowRight,
  Sliders,
  FileText,
  GraduationCap,
  Camera,
  Video,
  Play,
  Film,
  Sparkles,
  DollarSign,
  Tag,
  User,
  FileEdit,
  Globe,
  UserCheck,
  RefreshCw,
  Power,
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
  "Phát âm IPA",
  "Nghe hiểu",
  "Speaking nâng cao",
  "TOEIC / VSTEP",
  "Ngữ pháp THPT",
  "Từ vựng học thuật",
];

const levelOptions = [
  { value: "teacher", label: "Giáo viên / Giảng viên", desc: "Đang giảng dạy tại trường học hoặc trung tâm ngoại ngữ" },
  { value: "professional", label: "Người đi làm / Chuyên gia", desc: "Đang làm việc tại doanh nghiệp hoặc giảng dạy tự do" },
  { value: "student", label: "Sinh viên Đại học", desc: "Đang theo học tại các trường Đại học / Cao đẳng" },
];

const levelLabels = {
  teacher: "Giáo viên / Giảng viên",
  professional: "Người đi làm / Chuyên gia",
  student: "Sinh viên Đại học",
};

const weekDays = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const dayBlocks = ["Sáng", "Chiều", "Tối"];

// Style utilities
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-950 transition-all";

const chipClass = (active) =>
  clsx(
    "rounded-full border px-3 py-1.5 text-xs font-medium transition cursor-pointer select-none",
    active
      ? "border-blue-600 bg-blue-600 text-white shadow-xs"
      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700"
  );

// Baseline profile data complying with UC-T01 specification
const defaultApprovedProfile = {
  tutorId: "t1",
  status: "approved", // "draft" | "pending_approval" | "approved" | "rejected"
  rejectionReason: "",

  // Bước 1: Thông tin cá nhân & Liên hệ
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
  avatarFileName: "anh_chan_dung_lananh.jpg",
  fullName: "Nguyễn Lan Anh",
  gender: "female", // "male" | "female"
  birthDate: "2001-08-15",
  phone: "0987 654 321",
  phoneBackup: "0912 345 678",
  zalo: "0987 654 321",
  facebookUrl: "https://facebook.com/lananh.english.tutor",
  hometown: "Nam Định",
  livingAddress: "Số 45 Ngõ 12, Đường Nguyễn Chí Thanh, Quận 3, TP.HCM",

  // Bước 2: Trình độ học vấn & Chứng chỉ
  qualificationLevel: "professional", // "teacher" | "professional" | "graduated" | "student"
  currentRole: "Chuyên viên Dịch thuật & Giảng dạy Tiếng Anh",
  university: "Đại học Ngoại Thương TP.HCM",
  faculty: "Ngôn ngữ Anh thương mại",
  graduationStatus: "graduated", // "student" | "graduated" | "lecturer"
  graduationScore: "28.5 điểm khối D01",
  academicRank: "Xuất sắc (GPA 3.85/4.0)",

  // Minh chứng học vấn & Bằng cấp
  degreeScanName: "bang_dai_hoc_ngoai_thuong_lananh.pdf",
  transcriptScanName: "bang_diem_gpa_ngoai_thuong_lananh.pdf",
  idCardScanName: "cccd_mat_truoc_lananh.jpg",

  certificates: [
    { id: "c1", name: "IELTS 8.5 Overall", issuer: "British Council", year: "2023", score: "8.5 (Listening 9.0, Speaking 8.5)", fileName: "ielts_8.5_certificate.pdf", status: "approved" },
    { id: "c2", name: "Chứng chỉ Nghiệp vụ Sư phạm Tiếng Anh", issuer: "ĐH Sư phạm TP.HCM", year: "2022", score: "Xuất sắc", fileName: "nghiep_vu_su_pham.pdf", status: "approved" },
  ],

  // Bước 3: Năng lực, Kinh nghiệm & Video giới thiệu
  yearsExperience: "3 năm kinh nghiệm gia sư & giảng dạy trung tâm",
  specializations: ["IELTS Speaking", "Luyện thi THPTQG", "Tiếng Anh Giao tiếp Doanh nghiệp", "Phát âm IPA"],
  bio: "Em là cựu sinh viên chuyên Ngôn ngữ Anh ĐH Ngoại Thương, sở hữu IELTS 8.5 và chứng chỉ Nghiệp vụ Sư phạm. Em có 3 năm kinh nghiệm giảng dạy cá nhân hóa, giúp nhiều học sinh nâng từ 5.0 lên 7.5+ IELTS và đỗ trường chuyên.",
  videoUrl: "https://www.youtube.com/watch?v=demo_tutor_intro",
  videoFileName: "video_gioi_thieu_lananh.mp4",

  // Bước 4: Bảng giá học phí & Hình thức dạy (Cốt lõi UC-T01)
  feeUnit: "giờ",
  teachingFormat: "both", // "online" | "offline" | "both"
  serviceAreas: ["Quận 1, TP.HCM", "Quận 3, TP.HCM", "Quận Bình Thạnh, TP.HCM"],
  pricingList: [
    { id: "p1", program: "Luyện thi IELTS (Overall & 4 Kỹ năng)", feeOnline: "250000", feeOffline: "350000", active: true, desc: "Luyện Speaking & Writing chuyên sâu, chấm bài chi tiết" },
    { id: "p2", program: "Luyện thi TOEIC / VSTEP", feeOnline: "180000", feeOffline: "250000", active: true, desc: "Bám sát cấu trúc đề thi, luyện giải đề tốc độ" },
    { id: "p3", program: "Tiếng Anh Giao tiếp & Phát âm IPA", feeOnline: "160000", feeOffline: "220000", active: true, desc: "Sửa chuẩn phát âm IPA, phản xạ hội thoại tự nhiên" },
    { id: "p4", program: "Tiếng Anh Phổ thông (Cấp 2, 3 / Ôn thi 10, THPTQG)", feeOnline: "140000", feeOffline: "200000", active: true, desc: "Nắm vững ngữ pháp bám sát sách giáo khoa & đề thi chuẩn" },
    { id: "p5", program: "Tiếng Anh Trẻ em / Mầm non & Tiểu học", feeOnline: "120000", feeOffline: "180000", active: false, desc: "Giảng dạy qua hình ảnh & bài hát tương tác sinh động" },
  ],
  feeNote: "Học phí tính theo giờ dạy. Đã bao gồm tài liệu điện tử, kho bài tập AI & đề thi thử định kỳ. Giảm 10% khi học sinh đăng ký gói theo tháng (từ 16 giờ trở lên).",

  // Bước 5: Khung thời gian rảnh
  availability: ["Thứ 2|Tối", "Thứ 4|Tối", "Thứ 6|Tối", "Thứ 7|Sáng", "Thứ 7|Chiều", "Chủ nhật|Sáng"],
};

function emptyCertForm() {
  return { name: "", issuer: "", year: "", score: "", fileName: "" };
}

// Important fields metadata for Admin verification
const IMPORTANT_FIELDS_META = {
  avatarFileName: { label: "Ảnh chân dung gia sư (Rõ mặt)", format: (v) => v || "anh_chan_dung.jpg" },
  qualificationLevel: { label: "Vai trò / Phân loại gia sư", format: (v) => levelLabels[v] || v },
  currentRole: { label: "Công việc / Lĩnh vực hiện tại" },
  birthDate: { label: "Ngày tháng năm sinh" },
  hometown: { label: "Quê quán" },
  livingAddress: { label: "Địa chỉ cư trú hiện tại" },
  university: { label: "Trường ĐH & Chuyên ngành" },
  graduationScore: { label: "Điểm tốt nghiệp THPT / Thi ĐH" },
  academicRank: { label: "Xếp loại Học lực / GPA" },
  degreeScanName: { label: "Minh chứng Bằng ĐH / Thẻ SV" },
  transcriptScanName: { label: "Minh chứng Bảng điểm GPA / Học bạ" },
  idCardScanName: { label: "Minh chứng CMND / CCCD" },
};

export default function TutorProfile() {
  // Official active approved profile
  const [approvedProfile, setApprovedProfile] = useState(defaultApprovedProfile);

  // Overall profile state: "approved" | "pending_approval" | "rejected" | "draft"
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

  // New custom pricing package state
  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [newPackageForm, setNewPackageForm] = useState({
    program: "",
    feeOnline: "250000",
    feeOffline: "350000",
    desc: "",
  });

  // System notification banner
  const [notification, setNotification] = useState(null);

  // Tutor availability status for receiving new classes toggle
  const [isAcceptingClasses, setIsAcceptingClasses] = useState(true);

  // ----------------------------------------------------
  // Basic Handlers
  // ----------------------------------------------------
  function toggleSpecialization(s) {
    setFormData((prev) => {
      const nextSpecs = prev.specializations.includes(s)
        ? prev.specializations.filter((x) => x !== s)
        : [...prev, s];
      return { ...prev, specializations: nextSpecs };
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
  // Pricing Table Handlers (UC-T01 Step 4)
  // ----------------------------------------------------
  function handlePricingChange(id, field, value) {
    setFormData((prev) => ({
      ...prev,
      pricingList: prev.pricingList.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  }

  function togglePricingActive(id) {
    setFormData((prev) => ({
      ...prev,
      pricingList: prev.pricingList.map((item) =>
        item.id === id ? { ...item, active: !item.active } : item
      ),
    }));
  }

  function handleAddPricingPackage() {
    if (!newPackageForm.program.trim()) return;
    const newId = `p-custom-${Date.now()}`;
    const newPackage = {
      id: newId,
      program: newPackageForm.program.trim(),
      feeOnline: newPackageForm.feeOnline || "250000",
      feeOffline: newPackageForm.feeOffline || "350000",
      active: true,
      desc: newPackageForm.desc.trim() || "Chương trình đào tạo thiết kế theo yêu cầu riêng",
    };

    setFormData((prev) => ({
      ...prev,
      pricingList: [...prev.pricingList, newPackage],
    }));

    setNewPackageForm({ program: "", feeOnline: "250000", feeOffline: "350000", desc: "" });
    setShowAddPackageModal(false);
  }

  function removePricingPackage(id) {
    setFormData((prev) => ({
      ...prev,
      pricingList: prev.pricingList.filter((item) => item.id !== id),
    }));
  }

  // ----------------------------------------------------
  // Academic & Proof File Handlers
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
      setFormData((prev) => ({
        ...prev,
        videoFileName: file.name,
      }));
    }
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
      score: certForm.score.trim() || "Đã xác minh",
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
      title: "Đã thêm chứng chỉ mới",
      message: "Chứng chỉ đã được xếp vào danh sách chờ Admin/Lễ tân phê duyệt.",
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

  // ----------------------------------------------------
  // UC-T01 Actions: Lưu nháp vs Gửi duyệt hồ sơ
  // ----------------------------------------------------
  function handleSaveDraft() {
    setProfileStatus("draft");
    setApprovedProfile({ ...formData, status: "draft" });
    setNotification({
      type: "info",
      title: "Đã lưu nháp hồ sơ thành công",
      message: "Các thông tin bạn đã nhập được lưu ở trạng thái Bản nháp (DRAFT). Bạn có thể tiếp tục chỉnh sửa bất kỳ lúc nào trước khi Gửi duyệt.",
    });
  }

  function handleSubmitForApproval() {
    if (!formData.fullName.trim() || !formData.phone.trim()) {
      setNotification({
        type: "rejected",
        title: "Thiếu thông tin bắt buộc",
        message: "Vui lòng điền đầy đủ Họ và tên và Số điện thoại chính trước khi gửi duyệt.",
      });
      return;
    }

    if (formData.pricingList.length === 0) {
      setNotification({
        type: "rejected",
        title: "Chưa có gói học phí nào",
        message: "Vui lòng thêm ít nhất 01 gói chương trình vào Bảng giá học phí đề xuất.",
      });
      return;
    }

    let hasBasicChanges = false;
    let hasImportantChanges = false;
    const newPendingObj = { ...pendingChanges };

    const basicKeys = ["specializations", "bio", "serviceAreas", "availability", "phone", "zalo", "facebookUrl", "videoUrl", "videoFileName", "pricingList", "feeUnit", "teachingFormat", "feeNote"];
    basicKeys.forEach((key) => {
      if (JSON.stringify(formData[key]) !== JSON.stringify(approvedProfile[key])) {
        hasBasicChanges = true;
      }
    });

    const importantKeys = [
      "avatarFileName",
      "qualificationLevel",
      "currentRole",
      "birthDate",
      "hometown",
      "livingAddress",
      "university",
      "graduationScore",
      "academicRank",
      "degreeScanName",
      "transcriptScanName",
      "idCardScanName",
    ];

    importantKeys.forEach((key) => {
      const oldVal = approvedProfile[key];
      const newVal = formData[key];
      if (String(oldVal || "").trim() !== String(newVal || "").trim()) {
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
    basicKeys.forEach((key) => {
      updatedApproved[key] = formData[key];
    });
    setApprovedProfile(updatedApproved);

    setPendingChanges(newPendingObj);
    setProfileStatus("pending_approval");

    setNotification({
      type: "important",
      title: "Gửi duyệt hồ sơ thành công",
      message: "Hồ sơ của bạn đã được gửi thành công và đang chờ Admin/Lễ tân phê duyệt trong vòng 24-48h.",
    });
  }

  function handleCancelAllPending() {
    setPendingChanges({});
    setPendingCertificates([]);
    setFormData(approvedProfile);
    setProfileStatus(approvedProfile.status || "approved");
    setRejectionReason("");
    setNotification({
      type: "info",
      title: "Đã hủy các thay đổi chờ duyệt",
      message: "Hồ sơ đã được khôi phục về dữ liệu ban đầu.",
    });
  }

  // ----------------------------------------------------
  // Admin Simulation Actions (UC-T01 Prototype Testing)
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

    newApproved.status = "approved";
    setApprovedProfile(newApproved);
    setFormData(newApproved);
    setPendingChanges({});
    setPendingCertificates([]);
    setProfileStatus("approved");
    setRejectionReason("");

    setNotification({
      type: "basic",
      title: "Admin/Lễ tân đã phê duyệt hồ sơ!",
      message: "Hồ sơ gia sư và Bảng giá học phí của bạn đã được xác thực chính thức. Bạn có thể bắt đầu ứng tuyển nhận lớp trên Bảng tin.",
    });
  }

  function simulateAdminReject() {
    setProfileStatus("rejected");
    setRejectionReason(
      "Admin phản hồi: Ảnh chụp minh chứng Bằng ĐH / Chứng chỉ IELTS bị mờ, chưa rõ dấu mộc đỏ. Vui lòng tải lại bản scan 4 góc rõ nét và kiểm tra lại mức giá học phí Online."
    );
    setNotification({
      type: "rejected",
      title: "Hồ sơ bị yêu cầu bổ sung (REJECTED)",
      message: "Admin đã gửi yêu cầu chỉnh sửa/bổ sung tệp minh chứng hoặc thông tin hồ sơ.",
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
          newVal: "Đại học Ngoại Thương TP.HCM - Ngôn ngữ Anh thương mại",
          rawNewVal: "Đại học Ngoại Thương TP.HCM - Ngôn ngữ Anh thương mại",
        },
        degreeScanName: {
          fieldKey: "degreeScanName",
          label: "Minh chứng Bằng ĐH mới",
          oldVal: "bang_dai_hoc_su_pham.pdf",
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
          score: "Distinction",
          fileName: "tesol_120h_lananh.pdf",
          status: "pending_approval",
          submittedAt: "10/10/2026",
        },
      ];

      setPendingChanges(mockPending);
      setPendingCertificates(mockPendingCert);
      setProfileStatus("pending_approval");
      setFormData((prev) => ({
        ...prev,
        university: "Đại học Ngoại Thương TP.HCM - Ngôn ngữ Anh thương mại",
        degreeScanName: "bang_ngoai_thuong_scan_moi.pdf",
      }));
    } else if (state === "rejected") {
      setProfileStatus("rejected");
      setRejectionReason(
        "Admin phản hồi: Ảnh bản scan Bằng tốt nghiệp ĐH bị mờ mất phần dấu mộc. Vui lòng chụp/tải lại ảnh rõ nét."
      );
    } else if (state === "draft") {
      setProfileStatus("draft");
      setPendingChanges({});
      setPendingCertificates([]);
    }
  }

  const pendingCount = Object.keys(pendingChanges).length + pendingCertificates.length;

  return (
    <div className="space-y-6 pb-24">
      {/* ---------------------------------------------------- */}
      {/* PROTOTYPE TESTING CONTROL BAR */}
      {/* ---------------------------------------------------- */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sliders size={18} className="text-slate-600 dark:text-slate-400" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Thử nghiệm Prototype UC-T01: Thiết lập Hồ sơ &amp; Bảng giá Gia sư
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chuyển nhanh trạng thái hồ sơ để kiểm thử luồng nghiệp vụ:
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => applyPresetState("approved")}
              className={clsx(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer",
                profileStatus === "approved" && pendingCount === 0
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              )}
            >
              1. Đã duyệt (APPROVED)
            </button>
            <button
              type="button"
              onClick={() => applyPresetState("pending")}
              className={clsx(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer",
                profileStatus === "pending_approval" || pendingCount > 0
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              )}
            >
              2. Chờ duyệt (PENDING)
            </button>
            <button
              type="button"
              onClick={() => applyPresetState("rejected")}
              className={clsx(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer",
                profileStatus === "rejected"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              )}
            >
              3. Từ chối (REJECTED)
            </button>
            <button
              type="button"
              onClick={() => applyPresetState("draft")}
              className={clsx(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer",
                profileStatus === "draft"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              )}
            >
              4. Bản nháp (DRAFT)
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3 dark:border-slate-800 text-xs">
          <span className="font-semibold text-slate-600 dark:text-slate-400">Giả lập Admin/Lễ tân:</span>
          <button
            type="button"
            onClick={simulateAdminApprove}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-white hover:bg-blue-700 transition font-semibold cursor-pointer shadow-xs"
          >
            <CheckCircle2 size={13} /> Duyệt hồ sơ ngay
          </button>
          <button
            type="button"
            onClick={simulateAdminReject}
            className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-white hover:bg-rose-700 transition font-semibold cursor-pointer shadow-xs"
          >
            <XCircle size={13} /> Gửi yêu cầu sửa
          </button>

          {pendingCount > 0 && (
            <button
              type="button"
              onClick={handleCancelAllPending}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-200 px-2.5 py-1 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition cursor-pointer sm:ml-auto font-medium"
            >
              <RefreshCw size={13} /> Khôi phục ban đầu
            </button>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* PAGE HEADER */}
      {/* ---------------------------------------------------- */}
      <PageHeader
        title="Thiết lập &amp; Quản lý Hồ sơ Gia sư (UC-T01)"
        description="Hoàn thiện hồ sơ năng lực cá nhân, thông tin liên hệ, bằng cấp minh chứng, video giới thiệu, Bảng giá học phí đề xuất và khung thời gian rảnh cố định."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {/* Nút Bật/Tắt Sẵn sàng nhận lớp (Gọn gàng & Màu xanh nước biển) */}
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span
                  className={clsx(
                    "h-2.5 w-2.5 rounded-full transition-colors",
                    isAcceptingClasses ? "bg-blue-600 animate-pulse" : "bg-slate-400"
                  )}
                />
                {isAcceptingClasses ? "Sẵn sàng nhận lớp" : "Tạm ngưng nhận lớp"}
              </span>

              <button
                type="button"
                onClick={() => {
                  const nextState = !isAcceptingClasses;
                  setIsAcceptingClasses(nextState);
                  setNotification({
                    type: nextState ? "basic" : "info",
                    title: nextState ? "Đã bật sẵn sàng nhận lớp" : "Đã tạm ngưng nhận lớp",
                    message: nextState
                      ? "Hồ sơ của bạn hiện đang ở trạng thái sẵn sàng nhận lớp mới."
                      : "Hồ sơ gia sư của bạn đã chuyển sang trạng thái tạm ngưng nhận lớp mới.",
                  });
                }}
                className={clsx(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500",
                  isAcceptingClasses ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                )}
                role="switch"
                aria-checked={isAcceptingClasses}
                title="Bật/Tắt sẵn sàng nhận lớp mới"
              >
                <span
                  className={clsx(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out",
                    isAcceptingClasses ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              <span className="text-rose-500 font-bold">*</span> Trường bắt buộc
            </span>
          </div>
        }
      />

      {/* SYSTEM NOTIFICATION */}
      {notification && (
        <div
          className={clsx(
            "flex items-start justify-between gap-3 rounded-2xl p-4 text-sm transition border shadow-xs animate-in fade-in duration-200",
            notification.type === "basic" && "bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-200",
            notification.type === "important" && "bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200",
            notification.type === "rejected" && "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200",
            notification.type === "info" && "bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
          )}
        >
          <div className="flex items-start gap-3">
            {notification.type === "basic" && <CheckCircle2 className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" size={18} />}
            {notification.type === "important" && <Info className="mt-0.5 shrink-0 text-slate-600 dark:text-slate-400" size={18} />}
            {notification.type === "rejected" && <AlertTriangle className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" size={18} />}
            {notification.type === "info" && <Info className="mt-0.5 shrink-0 text-slate-600 dark:text-slate-400" size={18} />}
            <div>
              <p className="font-bold text-sm">{notification.title}</p>
              <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{notification.message}</p>
            </div>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* PROFILE STATUS CARDS */}
      {/* ---------------------------------------------------- */}
      {profileStatus === "approved" && pendingCount === 0 && (
        <Card className="border-blue-200 bg-blue-50/40 dark:border-blue-900/60 dark:bg-blue-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                <ShieldCheck size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-slate-50">
                    Trạng thái hồ sơ: Đã được phê duyệt (APPROVED)
                  </h3>
                  <Badge tone="blue">Hoạt động / Sẵn sàng ứng tuyển</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Hồ sơ năng lực, bằng cấp chứng chỉ &amp; Bảng giá học phí của bạn đã được Admin/Lễ tân xác nhận. Bạn có thể truy cập <strong>Bảng tin Lớp cần gia sư (UC-T02)</strong> để nộp đơn nhận lớp.
                </p>
              </div>
            </div>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
              Mã Gia sư: GS-8842 (Nguyễn Lan Anh)
            </div>
          </div>
        </Card>
      )}

      {profileStatus === "draft" && (
        <Card className="border-slate-300 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/40">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-700 text-white shadow-xs">
              <FileEdit size={20} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-slate-50">
                  Trạng thái hồ sơ: Bản nháp (DRAFT)
                </h3>
                <Badge tone="slate">Bản nháp</Badge>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Hồ sơ đang ở trạng thái bản nháp. Vui lòng kiểm tra lại thông tin cá nhân, minh chứng bằng cấp và Bảng giá học phí đề xuất trước khi nhấp nút <strong>"Gửi duyệt hồ sơ"</strong>.
              </p>
            </div>
          </div>
        </Card>
      )}

      {(profileStatus === "pending_approval" || pendingCount > 0) && (
        <Card className="border-slate-300 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900/50">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-700 text-white shadow-xs">
                  <Clock size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-slate-50">
                      Trạng thái: Đang chờ phê duyệt (PENDING_APPROVAL)
                    </h3>
                    <Badge tone="slate">Chờ Admin duyệt</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Hồ sơ của bạn đã được gửi thành công và đang chờ Admin/Lễ tân phê duyệt trong vòng 24-48h. Trong thời gian này, bạn vẫn có thể cập nhật thông tin nếu cần.
                  </p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={handleCancelAllPending} className="shrink-0">
                <X size={14} /> Hủy các yêu cầu chờ duyệt
              </Button>
            </div>

            {/* PENDING SUMMARY TABLE */}
            {pendingCount > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileCheck size={14} className="text-slate-600" /> Danh mục thông tin đang chờ Admin xác thực:
                </h4>

                <div className="space-y-1.5 text-xs">
                  {Object.keys(pendingChanges).map((key) => {
                    const item = pendingChanges[key];
                    return (
                      <div
                        key={key}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60"
                      >
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {item.label}:
                        </span>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <span className="line-through text-slate-400">{item.oldVal}</span>
                          <ArrowRight size={12} className="text-slate-500" />
                          <span className="font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {item.newVal}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {pendingCertificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60"
                    >
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Chứng chỉ bổ sung:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {cert.name} ({cert.issuer} - {cert.year})
                        </span>
                        <button
                          type="button"
                          onClick={() => removePendingCert(cert.id)}
                          className="text-rose-600 hover:text-rose-800 ml-1 cursor-pointer"
                          title="Hủy chứng chỉ này"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {profileStatus === "rejected" && (
        <Card className="border-rose-200 bg-rose-50/40 dark:border-rose-900/60 dark:bg-rose-950/20">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs">
              <AlertTriangle size={20} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-slate-50">
                  Trạng thái: Hồ sơ bị từ chối / Yêu cầu cập nhật (REJECTED)
                </h3>
                <Badge tone="rose">Cần điều chỉnh</Badge>
              </div>
              <div className="rounded-xl border border-rose-200 bg-white p-3 text-xs text-slate-700 dark:border-rose-900/60 dark:bg-slate-900 dark:text-slate-300 shadow-xs">
                <p className="font-bold text-rose-700 dark:text-rose-400 mb-1 flex items-center gap-1.5">
                  <Info size={14} /> Lý do từ chối từ Admin / Lễ tân:
                </p>
                <p className="leading-relaxed">{rejectionReason || "Ảnh chụp chứng chỉ tiếng Anh hoặc Bằng tốt nghiệp ĐH bị mờ. Vui lòng tải lại ảnh bản scan rõ nét."}</p>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Vui lòng cập nhật các thông tin hoặc tải lại tệp minh chứng theo yêu cầu ở các mục dưới đây, sau đó bấm <strong>"Gửi lại hồ sơ"</strong>.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ============================================================ */}
      {/* BƯỚC 1: THÔNG TIN CÁ NHÂN & LIÊN HỆ */}
      {/* ============================================================ */}
      <Card>
        <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <User className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              Bước 1: Thông tin cá nhân &amp; Liên hệ
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Khai báo thông tin định danh cá nhân, ảnh đại diện chân dung và kênh liên lạc chính thức.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* AVATAR SUB-SECTION */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
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
                    Ảnh chân dung gia sư <span className="text-rose-500 font-bold">*</span>
                  </h3>
                  {pendingChanges.avatarFileName ? (
                    <Badge tone="amber">Ảnh mới chờ duyệt</Badge>
                  ) : (
                    <Badge tone="blue">Rõ mặt chính diện</Badge>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Ảnh chân dung hiển thị công khai cho Phụ huynh &amp; Học sinh. Bắt buộc chụp <strong>chính diện, rõ gương mặt, trang phục lịch sự</strong>.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <label className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-3.5 py-2 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition cursor-pointer shadow-xs">
                    <Upload size={13} /> Tải ảnh chân dung mới
                    <input
                      type="file"
                      onChange={handleAvatarFileUpload}
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                    />
                  </label>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {formData.avatarFileName || "anh_chan_dung_lananh.jpg"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* BASIC PERSONAL FIELDS */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Họ và tên đầy đủ <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="VD: Nguyễn Lan Anh"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Giới tính <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === "female"}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Nữ</span>
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === "male"}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Nam</span>
                </label>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ngày tháng năm sinh <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="date"
                value={formData.birthDate || "2001-08-15"}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Quê quán (Tỉnh / Thành) <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                value={formData.hometown}
                onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
                placeholder="VD: Nam Định"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Số điện thoại chính <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Số Zalo / SĐT dự phòng
              </label>
              <input
                type="tel"
                value={formData.zalo}
                onChange={(e) => setFormData({ ...formData, zalo: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Link Trang cá nhân Facebook <span className="text-rose-500 font-bold">*</span>
            </label>
            <input
              type="url"
              value={formData.facebookUrl || ""}
              onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
              placeholder="https://facebook.com/username"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Địa chỉ cư trú hiện tại <span className="text-rose-500 font-bold">*</span>
            </label>
            <input
              type="text"
              value={formData.livingAddress}
              onChange={(e) => setFormData({ ...formData, livingAddress: e.target.value })}
              placeholder="Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/TP"
              className={inputClass}
            />
          </div>
        </div>
      </Card>

      {/* ============================================================ */}
      {/* BƯỚC 2: TRÌNH ĐỘ HỌC VẤN & CHỨNG CHỈ */}
      {/* ============================================================ */}
      <Card>
        <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              Bước 2: Trình độ học vấn &amp; Chứng chỉ minh chứng
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Khai báo thông tin trường ĐH, chuyên ngành, bằng cấp ngoại ngữ kèm file scan đối soát.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Lock size={13} className="text-slate-500" /> Cần Admin duyệt
          </span>
        </div>

        <div className="space-y-5">
          {/* VAI TRÒ GIA SƯ */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Vai trò / Trạng thái hiện tại <span className="text-rose-500 font-bold">*</span>
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              {levelOptions.map((o) => {
                const isSelected = formData.qualificationLevel === o.value;
                return (
                  <button
                    type="button"
                    key={o.value}
                    onClick={() => setFormData({ ...formData, qualificationLevel: o.value })}
                    className={clsx(
                      "flex flex-col items-start rounded-2xl border p-3.5 text-left transition cursor-pointer select-none",
                      isSelected
                        ? "border-slate-900 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200"
                    )}
                  >
                    <span className="text-xs font-bold">
                      {o.label}
                    </span>
                    <span className={clsx("mt-1 text-[11px] leading-snug", isSelected ? "opacity-80" : "text-slate-500 dark:text-slate-400")}>
                      {o.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Trường Đại học / Cao đẳng <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                placeholder="VD: ĐH Ngoại Thương TP.HCM"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Khoa / Chuyên ngành đào tạo <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                value={formData.faculty}
                onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                placeholder="VD: Ngôn ngữ Anh thương mại"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Điểm thi THPT / Điểm thi ĐH
              </label>
              <input
                type="text"
                value={formData.graduationScore}
                onChange={(e) => setFormData({ ...formData, graduationScore: e.target.value })}
                placeholder="VD: 28.5 điểm khối D01"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Xếp loại Học lực / GPA
              </label>
              <input
                type="text"
                value={formData.academicRank}
                onChange={(e) => setFormData({ ...formData, academicRank: e.target.value })}
                placeholder="VD: Xuất sắc (GPA 3.85/4.0)"
                className={inputClass}
              />
            </div>
          </div>

          {/* HỒ SƠ MINH CHỨNG FILE UPLOAD */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/50 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              File minh chứng bằng cấp &amp; định danh
            </h3>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Bằng tốt nghiệp / Thẻ SV <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800">
                  <span className="truncate font-mono text-[11px]">{formData.degreeScanName}</span>
                  <label className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 transition cursor-pointer shrink-0 ml-1">
                    <Upload size={11} /> Tải
                    <input type="file" onChange={(e) => handleProofFileUpload("degreeScanName", e)} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Bảng điểm GPA / Học bạ
                </label>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800">
                  <span className="truncate font-mono text-[11px]">{formData.transcriptScanName}</span>
                  <label className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 transition cursor-pointer shrink-0 ml-1">
                    <Upload size={11} /> Tải
                    <input type="file" onChange={(e) => handleProofFileUpload("transcriptScanName", e)} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Ảnh CMND / CCCD <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800">
                  <span className="truncate font-mono text-[11px]">{formData.idCardScanName}</span>
                  <label className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 transition cursor-pointer shrink-0 ml-1">
                    <Upload size={11} /> Tải
                    <input type="file" onChange={(e) => handleProofFileUpload("idCardScanName", e)} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* CHỨNG CHỈ NGOẠI NGỮ */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Chứng chỉ ngoại ngữ &amp; Thành tích đặc biệt
            </h3>

            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900 overflow-hidden text-sm">
              {approvedProfile.certificates.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3.5 gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 mt-0.5">
                      <FileCheck size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-bold text-slate-900 dark:text-slate-50">{c.name}</p>
                        <Badge tone="blue">Đã duyệt</Badge>
                      </div>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {c.issuer} ({c.year}) · Điểm: <strong>{c.score}</strong> | File: <span className="font-mono text-slate-600 dark:text-slate-300">{c.fileName}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeApprovedCert(c.id)}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold p-1 cursor-pointer shrink-0"
                  >
                    Yêu cầu gỡ
                  </button>
                </div>
              ))}

              {pendingCertificates.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3.5 gap-3 bg-slate-50/80 dark:bg-slate-900/60">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 mt-0.5">
                      <Clock size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-bold text-slate-900 dark:text-slate-50">{c.name}</p>
                        <Badge tone="slate">Chờ duyệt</Badge>
                      </div>
                      <p className="truncate text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {c.issuer} ({c.year}) | File: <span className="font-mono">{c.fileName}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePendingCert(c.id)}
                    className="text-xs text-slate-500 hover:text-slate-800 p-1 cursor-pointer shrink-0"
                  >
                    Hủy thêm
                  </button>
                </div>
              ))}
            </div>

            {/* ADD CERTIFICATE INPUT ROW */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Plus size={14} className="text-slate-600 dark:text-slate-400" /> Thêm chứng chỉ ngoại ngữ mới (IELTS, TOEIC, VSTEP...):
              </h4>

              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  value={certForm.name}
                  onChange={(e) => setCertForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Tên chứng chỉ (VD: IELTS 8.0, TOEIC 950)"
                  className={inputClass}
                />
                <input
                  value={certForm.issuer}
                  onChange={(e) => setCertForm((f) => ({ ...f, issuer: e.target.value }))}
                  placeholder="Đơn vị cấp (VD: IDP, British Council)"
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
                <label className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition cursor-pointer">
                  <Upload size={13} />
                  <span>{simulatedCertFile ? `File: ${simulatedCertFile}` : "Chọn file scan chứng chỉ (.pdf, .jpg)"}</span>
                  <input type="file" onChange={handleCertFileSelect} className="hidden" accept="image/*,.pdf" />
                </label>

                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={addCertificateRequest}
                  disabled={!certForm.name.trim()}
                >
                  <Plus size={14} /> Thêm vào hàng chờ duyệt
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ============================================================ */}
      {/* BƯỚC 3: NĂNG LỰC, KINH NGHIỆM & VIDEO GIỚI THIỆU */}
      {/* ============================================================ */}
      <Card>
        <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              Bước 3: Năng lực, Kinh nghiệm &amp; Video giới thiệu
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Số năm kinh nghiệm, thế mạnh chuyên môn, tự giới thiệu bản thân và clip bài giảng mẫu.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* SPECIALIZATIONS / SKILLS */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Thế mạnh chuyên môn &amp; Kỹ năng giảng dạy chính <span className="text-rose-500 font-bold">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {subjectOptions.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggleSpecialization(s)}
                  className={chipClass(formData.specializations.includes(s))}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Số năm kinh nghiệm giảng dạy gia sư <span className="text-rose-500 font-bold">*</span>
            </label>
            <input
              type="text"
              value={formData.yearsExperience}
              onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
              placeholder="VD: 3 năm kinh nghiệm dạy IELTS & Luyện thi vào 10"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Bài giới thiệu bản thân (Bio) <span className="text-rose-500 font-bold">*</span>
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              placeholder="Giới thiệu phong cách giảng dạy, tâm huyết, thế mạnh và phương pháp đồng hành với học sinh..."
              className={inputClass}
            />
          </div>

          {/* VIDEO GIỚI THIỆU SUB-SECTION */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video size={18} className="text-slate-700 dark:text-slate-300" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Video bài giảng mẫu hoặc Clip tự giới thiệu bản thân
                </h3>
              </div>
              <Badge tone="slate">Khuyên dùng</Badge>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Nhập đường dẫn link Youtube/Vimeo hoặc tải file video ngắn (.mp4) để phụ huynh &amp; học sinh xem phong cách truyền đạt trực quan.
            </p>

            <div className="grid gap-3 sm:grid-cols-2 pt-1">
              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800 space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Play size={13} className="text-slate-500" /> Dán link Youtube / Vimeo / TikTok
                </span>
                <input
                  type="url"
                  value={formData.videoUrl || ""}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={inputClass}
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800 space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Upload size={13} className="text-slate-500" /> Tải tệp video trực tiếp (.mp4, .mov &lt; 50MB)
                </span>
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <label className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 transition cursor-pointer shrink-0">
                    <Film size={13} /> Chọn tệp video
                    <input
                      type="file"
                      onChange={handleVideoFileUpload}
                      className="hidden"
                      accept="video/mp4,video/quicktime,video/webm"
                    />
                  </label>
                  <span className="truncate text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {formData.videoFileName || "Chưa có file"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ============================================================ */}
      {/* BƯỚC 4: THIẾT LẬP BẢNG GIÁ HỌC PHÍ & HÌNH THỨC DẠY */}
      {/* ============================================================ */}
      <Card>
        <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              Bước 4: Thiết lập Bảng giá học phí &amp; Hình thức dạy (Cốt lõi UC-T01)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cấu hình hình thức dạy (Online / Tại nhà), đơn vị tính học phí và Bảng giá đề xuất theo từng chương trình luyện thi.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* HÌNH THỨC DẠY & ĐƠN VỊ TÍNH */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/50 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Globe size={15} className="text-slate-600 dark:text-slate-400" /> Hình thức dạy nhận lớp <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="teachingFormat"
                  value="both"
                  checked={formData.teachingFormat === "both"}
                  onChange={(e) => setFormData({ ...formData, teachingFormat: e.target.value })}
                  className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Cả hai hình thức (Online &amp; Tại nhà)</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="teachingFormat"
                  value="online"
                  checked={formData.teachingFormat === "online"}
                  onChange={(e) => setFormData({ ...formData, teachingFormat: e.target.value })}
                  className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Chỉ dạy Online (Zoom/Meet)</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="teachingFormat"
                  value="offline"
                  checked={formData.teachingFormat === "offline"}
                  onChange={(e) => setFormData({ ...formData, teachingFormat: e.target.value })}
                  className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Chỉ dạy Tại nhà (Offline)</span>
              </label>
            </div>
          </div>

          {/* BẢNG GIÁ HỌC PHÍ ĐỀ XUẤT CỦA GIA SƯ */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-slate-800">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <DollarSign size={15} className="text-slate-600 dark:text-slate-400" />
                  Bảng giá học phí đề xuất (Đơn vị: VNĐ/giờ)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Thiết lập học phí tính theo giờ dạy cho từng chương trình. Mức giá khuyến nghị: 120.000đ - 350.000đ / giờ.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddPackageModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-3 py-1.5 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition cursor-pointer shadow-xs shrink-0"
              >
                <Plus size={14} /> Thêm gói chương trình mới
              </button>
            </div>

            {/* PRICING ITEMS TABLE */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Nhóm chương trình học</th>
                    <th className="py-3 px-3 w-44 text-right">Học phí Online (VNĐ/giờ)</th>
                    <th className="py-3 px-3 w-44 text-right">Học phí Tại nhà (VNĐ/giờ)</th>
                    <th className="py-3 px-3 text-center w-14">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {formData.pricingList.map((item) => (
                    <tr
                      key={item.id}
                      className="bg-white dark:bg-slate-900 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                    >
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                          {item.program}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.desc}
                        </p>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
                          <input
                            type="number"
                            step="10000"
                            min="50000"
                            value={item.feeOnline}
                            onChange={(e) => handlePricingChange(item.id, "feeOnline", e.target.value)}
                            disabled={formData.teachingFormat === "offline"}
                            className="w-24 text-right font-bold text-slate-900 dark:text-slate-100 bg-transparent outline-none disabled:opacity-40"
                          />
                          <span className="text-[11px] text-slate-500 font-medium">VNĐ/h</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
                          <input
                            type="number"
                            step="10000"
                            min="50000"
                            value={item.feeOffline}
                            onChange={(e) => handlePricingChange(item.id, "feeOffline", e.target.value)}
                            disabled={formData.teachingFormat === "online"}
                            className="w-24 text-right font-bold text-slate-900 dark:text-slate-100 bg-transparent outline-none disabled:opacity-40"
                          />
                          <span className="text-[11px] text-slate-500 font-medium">VNĐ/h</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => removePricingPackage(item.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition cursor-pointer"
                          title="Xóa gói này"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* FEE NOTE */}
            <div className="pt-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ghi chú bổ sung về Học phí &amp; Chính sách thương lượng
              </label>
              <textarea
                rows={2}
                value={formData.feeNote || ""}
                onChange={(e) => setFormData({ ...formData, feeNote: e.target.value })}
                placeholder="VD: Đã bao gồm giáo trình, tài liệu ôn thi. Giảm 10% khi đăng ký gói theo tháng..."
                className={inputClass}
              />
            </div>
          </div>

          {/* KHU VỰC NHẬN LỚP TẠI NHÀ */}
          {formData.teachingFormat !== "online" && (
            <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <MapPin size={15} className="text-slate-600 dark:text-slate-400" />
                  Khu vực nhận dạy Tại nhà (Quận / Huyện) <span className="text-rose-500 font-bold">*</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Chọn các Quận/Huyện bạn có thể di chuyển giảng dạy trực tiếp.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.serviceAreas.map((area) => (
                  <span
                    key={area}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs"
                  >
                    <MapPin size={12} className="text-slate-500" /> {area}
                    <button
                      type="button"
                      onClick={() => removeServiceArea(area)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 ml-0.5 cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex max-w-md gap-2">
                <input
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addServiceArea();
                    }
                  }}
                  placeholder="VD: Quận 1, Quận 3, Quận Bình Thạnh..."
                  className={inputClass}
                />
                <Button variant="secondary" type="button" onClick={addServiceArea} disabled={!newArea.trim()}>
                  <Plus size={14} /> Thêm
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ============================================================ */}
      {/* BƯỚC 5: KHUNG THỜI GIAN RẢNH CỐ ĐỊNH */}
      {/* ============================================================ */}
      <Card padded={false} className="overflow-hidden">
        <div className="p-5 pb-3 flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              Bước 5: Thiết lập Khung thời gian rảnh cố định
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chọn các ca dạy rảnh cố định trong tuần để hệ thống/Admin gợi ý ghép lớp phù hợp.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto p-4 lg:p-5">
          <table className="w-full min-w-[580px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-20"></th>
                {weekDays.map((day) => (
                  <th
                    key={day}
                    className="pb-3 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dayBlocks.map((block) => (
                <tr key={block}>
                  <td className="py-1.5 pr-3 text-xs font-bold text-slate-600 dark:text-slate-400">{block}</td>
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
                            "flex h-9 w-full items-center justify-center rounded-xl border transition cursor-pointer select-none",
                            active
                              ? "border-blue-600 bg-blue-600 text-white shadow-xs font-bold"
                              : "border-slate-200 text-transparent hover:border-slate-300 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900"
                          )}
                        >
                          <Check size={16} />
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

      {/* ============================================================ */}
      {/* STICKY BOTTOM ACTION BAR */}
      {/* ============================================================ */}
      <div className="sticky bottom-4 z-30 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 shadow-xl">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md">
            <Save size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {profileStatus === "rejected"
                ? "Cập nhật &amp; Gửi lại hồ sơ cho Admin"
                : "Hoàn tất thiết lập Hồ sơ &amp; Bảng giá Gia sư"}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Lưu nháp (DRAFT) để điền sau hoặc Gửi duyệt (PENDING_APPROVAL) tới Admin/Lễ tân.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Button
            variant="secondary"
            size="md"
            type="button"
            onClick={handleSaveDraft}
            className="flex-1 sm:flex-none text-xs font-semibold"
          >
            <FileEdit size={14} /> Lưu nháp (DRAFT)
          </Button>

          <Button
            size="md"
            type="button"
            onClick={handleSubmitForApproval}
            className="flex-1 sm:flex-none text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
          >
            {profileStatus === "rejected" ? "Cập nhật & Gửi lại" : "Gửi duyệt hồ sơ"}
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL THÊM GÓI CHƯƠNG TRÌNH HỌC TÙY CHỈNH */}
      {/* ============================================================ */}
      {showAddPackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-5 dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <Plus className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                Thêm gói chương trình học mới
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPackageModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tên nhóm chương trình / Khóa học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPackageForm.program}
                  onChange={(e) => setNewPackageForm({ ...newPackageForm, program: e.target.value })}
                  placeholder="VD: Luyện thi IELTS Speaking cấp tốc, Tiếng Anh Thương mại..."
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Học phí Online (VNĐ/giờ)
                  </label>
                  <input
                    type="number"
                    step="10000"
                    value={newPackageForm.feeOnline}
                    onChange={(e) => setNewPackageForm({ ...newPackageForm, feeOnline: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Học phí Tại nhà (VNĐ/giờ)
                  </label>
                  <input
                    type="number"
                    step="10000"
                    value={newPackageForm.feeOffline}
                    onChange={(e) => setNewPackageForm({ ...newPackageForm, feeOffline: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mô tả ngắn gọn về chương trình học
                </label>
                <textarea
                  rows={3}
                  value={newPackageForm.desc}
                  onChange={(e) => setNewPackageForm({ ...newPackageForm, desc: e.target.value })}
                  placeholder="Tóm tắt mục tiêu, đối tượng học viên và đầu ra mong muốn..."
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setShowAddPackageModal(false)}>
                Hủy
              </Button>
              <Button onClick={handleAddPricingPackage} disabled={!newPackageForm.program.trim()}>
                Thêm gói chương trình
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
