import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  GraduationCap,
  Info,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  FileCheck,
  Image as ImageIcon,
  Video,
  User,
  Sparkles,
  BookOpen,
  CalendarDays,
} from "lucide-react";
import ThemeToggle from "../../components/theme-toggle";
import {
  provincesAndDistricts,
  universitiesList,
  subjectList,
  gradeList,
} from "../../data/vietnamLocations";
import { useAuth } from "../../context/AuthContext";
import {
  apiSubmitTutorProfile,
  apiSubmitProfileForReview,
  uploadTutorAvatar,
  uploadTutorCredentials,
} from "../../lib/tutorApi";

// ── Constants ──────────────────────────────────────────────────────────────
const WEEK_DAYS = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "Chủ nhật",
];
const TIME_SLOTS = ["MORNING", "AFTERNOON", "EVENING"];
const SLOT_LABELS = { MORNING: "Sáng", AFTERNOON: "Chiều", EVENING: "Tối" };
const GENDER_OPTIONS = [
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
];
const EDUCATION_OPTIONS = [
  { value: "STUDENT", label: "Sinh viên" },
  { value: "GRADUATED", label: "Đã tốt nghiệp" },
  { value: "LECTURER", label: "Giảng viên" },
];
const TEACHING_MODE_OPTIONS = [
  { value: "ONLINE", label: "Online" },
  { value: "AT_HOME", label: "Tại nhà" },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function hasSlot(availabilities, day, slot) {
  return availabilities.some((a) => a.dayOfWeek === day && a.timeSlot === slot);
}

function toggleSlot(availabilities, setAvailabilities, day, slot) {
  setAvailabilities((prev) => {
    const exists = prev.some((a) => a.dayOfWeek === day && a.timeSlot === slot);
    return exists
      ? prev.filter((a) => !(a.dayOfWeek === day && a.timeSlot === slot))
      : [...prev, { dayOfWeek: day, timeSlot: slot }];
  });
}

export default function CreateTutorProfilePage() {
  const navigate = useNavigate();
  const { session, token } = useAuth();

  // ── Form State ───────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    // Khối 1 – Thông tin cá nhân
    fullName: session?.name || "",
    gender: "MALE",
    dateOfBirth: "",
    phone: "",
    hometown: "", // VARCHAR(100), text tự do – mới

    // Khối 2 – Trình độ & Khu vực
    educationStatus: "STUDENT",
    experienceYears: 0,
    university: "",
    serviceArea: { province: "", district: "" },

    // Khối 3 – Môn học (mỗi row = 1 specialty + 1 price)
    subjectRows: [
      {
        id: 1,
        specialty: "Tiếng Anh",
        gradeLevel: "Lớp 8",
        teachingMode: "ONLINE",
        program: "",
        feeThousands: "",
      },
    ],

    // Khối 4 – Giới thiệu
    bio: "",
    videoUrl: "",
  });

  // Khối 5 – Lịch rảnh
  const [availabilities, setAvailabilities] = useState([]);

  // Khối 5 – Chứng chỉ
  const [credentials, setCredentials] = useState([
    { id: 1, title: "", type: "CERTIFICATE", score: "", file: null },
  ]);

  // File states
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Refs cho file inputs
  const avatarInputRef = useRef(null);
  const credentialFileRefs = useRef({});

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleServiceAreaChange = (field, value) => {
    setFormData((prev) => {
      const newArea = { ...prev.serviceArea, [field]: value };
      if (field === "province") {
        const firstDistrict =
          provincesAndDistricts.find((p) => p.province === value)
            ?.districts[0] || "";
        newArea.district = firstDistrict;
      }
      return { ...prev, serviceArea: newArea };
    });
  };

  // Subject rows
  const handleSubjectRowChange = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      subjectRows: prev.subjectRows.map((row) =>
        row.id === id ? { ...row, [field]: value } : row,
      ),
    }));
  };

  const addSubjectRow = () => {
    setFormData((prev) => ({
      ...prev,
      subjectRows: [
        ...prev.subjectRows,
        {
          id: Date.now(),
          specialty: "Tiếng Anh",
          gradeLevel: "Lớp 8",
          teachingMode: "ONLINE",
          program: "",
          feeThousands: "",
        },
      ],
    }));
  };

  const removeSubjectRow = (id) => {
    if (formData.subjectRows.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      subjectRows: prev.subjectRows.filter((row) => row.id !== id),
    }));
  };

  // Avatar
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Credentials
  const addCredential = () => {
    setCredentials((prev) => [
      ...prev,
      { id: Date.now(), title: "", type: "CERTIFICATE", score: "", file: null },
    ]);
  };

  const removeCredential = (id) => {
    if (credentials.length <= 1) return;
    setCredentials((prev) => prev.filter((c) => c.id !== id));
  };

  const handleCredentialChange = (id, field, value) => {
    setCredentials((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const handleCredentialFileChange = (id, file) => {
    setCredentials((prev) =>
      prev.map((c) => (c.id === id ? { ...c, file } : c)),
    );
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!token) {
      navigate("/login?role=tutor");
      return;
    }

    setIsSubmitting(true);

    try {
      // ── Validation ──
      if (!formData.fullName.trim()) throw new Error("Vui lòng nhập họ và tên");
      if (!formData.dateOfBirth) throw new Error("Vui lòng chọn ngày sinh");
      if (!formData.phone.trim())
        throw new Error("Vui lòng nhập số điện thoại");
      if (!formData.university.trim()) throw new Error("Vui lòng nhập trường");
      if (!formData.bio.trim())
        throw new Error("Vui lòng nhập giới thiệu bản thân");
      if (formData.serviceArea.province === "")
        throw new Error("Vui lòng chọn tỉnh/thành dạy học");
      if (formData.experienceYears === null || formData.experienceYears < 0) {
        throw new Error("Số năm kinh nghiệm không hợp lệ");
      }
      if (formData.subjectRows.length === 0) {
        throw new Error("Vui lòng thêm ít nhất 1 môn học");
      }
      if (formData.subjectRows.every((r) => !r.specialty || !r.gradeLevel)) {
        throw new Error("Vui lòng điền đầy đủ môn học và lớp");
      }
      if (
        formData.subjectRows.every(
          (r) => !r.feeThousands || Number(r.feeThousands) <= 0,
        )
      ) {
        throw new Error("Vui lòng nhập học phí > 0 cho ít nhất 1 môn");
      }
      if (availabilities.length === 0) {
        throw new Error("Vui lòng chọn ít nhất 1 khung giờ rảnh");
      }
      const validCreds = credentials.filter((c) => c.title.trim() && c.file);
      if (validCreds.length === 0) {
        throw new Error("Vui lòng thêm ít nhất 1 chứng chỉ có file đính kèm");
      }

      // ── Chuẩn bị dữ liệu ──
      // 1. Upload avatar trước (nếu có) — backend lưu ngay URL vào tài khoản
      let avatarUrl = null;
      if (avatarFile) {
        avatarUrl = await uploadTutorAvatar(token, avatarFile);
      }

      // 2. Upload toàn bộ file minh chứng, nhận lại URL theo đúng thứ tự
      const credentialFileUrls = await uploadTutorCredentials(
        token,
        validCreds.map((c) => c.file),
      );

      // 3. Ghép URL file vào từng chứng chỉ
      const credentialPayload = validCreds.map((cred, idx) => ({
        title: cred.title.trim(),
        type: cred.type,
        score: cred.score.trim() || null,
        fileUrl: credentialFileUrls[idx] || null,
      }));

      if (credentialPayload.some((c) => !c.fileUrl)) {
        throw new Error(
          "Không nhận được URL file minh chứng sau khi tải lên. Vui lòng thử lại.",
        );
      }

      // 4. Build JSON hồ sơ (không còn file đính kèm)
      const profileData = {
        fullName: formData.fullName.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        phone: formData.phone.trim(),
        address:
          `${formData.serviceArea.district || ""}, ${formData.serviceArea.province}`.trim(),
        university: formData.university.trim(),
        educationStatus: formData.educationStatus,
        experienceYears: Number(formData.experienceYears),
        bio: formData.bio.trim(),
        serviceAreas: [
          {
            province: formData.serviceArea.province,
            district: formData.serviceArea.district || null,
          },
        ],
        specialties: formData.subjectRows
          .filter((row) => row.specialty && row.gradeLevel)
          .map((row) => ({
            specialty: row.specialty,
            gradeLevel: row.gradeLevel,
          })),
        prices: formData.subjectRows
          .filter((row) => row.feeThousands && Number(row.feeThousands) > 0)
          .map((row) => ({
            teachingMode: row.teachingMode,
            pricePerSession: Number(row.feeThousands) * 1000,
            program: row.program.trim() || null,
          })),
        availabilities: availabilities.map((a) => ({
          dayOfWeek: a.dayOfWeek,
          timeSlot: a.timeSlot,
        })),
        credentials: credentialPayload,
      };

      if (formData.hometown.trim())
        profileData.hometown = formData.hometown.trim();
      if (formData.videoUrl.trim())
        profileData.videoUrl = formData.videoUrl.trim();
      if (avatarUrl) profileData.avatarUrl = avatarUrl;

      // 5. Lưu hồ sơ rồi gửi duyệt
      await apiSubmitTutorProfile(token, profileData);
      await apiSubmitProfileForReview(token);

      setIsSubmitting(false);
      setShowSuccessModal(true);
    } catch (err) {
      setIsSubmitting(false);
      setSubmitError(err.message || "Lưu hồ sơ thất bại. Vui lòng thử lại.");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const currentServiceDistricts =
    provincesAndDistricts.find(
      (p) => p.province === formData.serviceArea.province,
    )?.districts || [];

  return (
    <div className="min-h-screen bg-muted/30 text-foreground pb-20">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to="/tutor"
            className="flex items-center gap-2 font-semibold text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <div className="p-1.5 rounded-lg bg-muted group-hover:bg-muted/80 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span>Về trang quản lý</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
              Hồ sơ gia sư mới
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-4xl mx-auto px-4 pt-8">
        {/* Page Title */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto shadow-md shadow-primary/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Tạo hồ sơ gia sư
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Điền đầy đủ thông tin bên dưới để hoàn thiện hồ sơ giảng dạy và bắt
            đầu nhận lớp từ phụ huynh.
          </p>
        </div>

        {/* Notice Banner */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/50 dark:text-blue-300 text-blue-900 flex items-start gap-3 shadow-xs">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm leading-relaxed">
            <strong className="font-bold text-blue-700 dark:text-blue-300">
              LƯU Ý:
            </strong>{" "}
            Sau khi tạo xong hồ sơ, bạn có thể sửa các thông tin trừ một số
            trường. Vì vậy bạn đừng quá lo lắng khi điền các thông tin dưới đây
            nhé!
          </div>
        </div>

        {/* Error Banner */}
        {submitError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/50 dark:text-rose-300 text-rose-800 text-sm">
            {submitError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* KHỐI 1: THÔNG TIN CÁ NHÂN */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <User className="w-5 h-5 text-blue-600" />
              1. Thông tin cá nhân
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Họ và tên */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="VD: Phạm Công Minh"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Giới tính */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Giới tính <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-6 pt-2">
                  {GENDER_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={opt.value}
                        checked={formData.gender === opt.value}
                        onChange={handleInputChange}
                        className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span className="text-slate-700 dark:text-slate-300">
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Ngày sinh */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ngày sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  required
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Số điện thoại */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Số điện thoại <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Số điện thoại chính"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Quê quán (mới – text tự do) */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Quê quán{" "}
                  <span className="text-slate-400 font-normal">
                    (Không bắt buộc)
                  </span>
                </label>
                <input
                  type="text"
                  name="hometown"
                  value={formData.hometown}
                  onChange={handleInputChange}
                  maxLength={100}
                  placeholder="VD: Hà Nội, TP. Hồ Chí Minh, Nam Định..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-400">Tối đa 100 ký tự</p>
              </div>
            </div>

            {/* Ảnh đại diện */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                Ảnh đại diện <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-24 h-28 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="space-y-1.5 text-center sm:text-left">
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer shadow-sm transition-all active:scale-[0.98]">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Chọn ảnh thẻ</span>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {avatarFile
                      ? avatarFile.name
                      : "Kích thước khuyên dùng: 300×400px, dưới 5MB"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* KHỐI 2: TRÌNH ĐỘ & KHU VỰC DẠY HỌC */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <BookOpen className="w-5 h-5 text-blue-600" />
              2. Trình độ học vấn &amp; Khu vực dạy học
            </h2>

            {/* Trình độ (radio) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Trình độ hiện tại <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-6 pt-1">
                {EDUCATION_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="educationStatus"
                      value={opt.value}
                      checked={formData.educationStatus === opt.value}
                      onChange={handleInputChange}
                      className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-slate-700 dark:text-slate-300">
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Số năm kinh nghiệm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Số năm kinh nghiệm <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="experienceYears"
                  min="0"
                  max="50"
                  value={formData.experienceYears}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Trường học */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Trường đang học / Đã tốt nghiệp{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  name="university"
                  required
                  value={formData.university}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Chọn trường —</option>
                  {universitiesList.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Khu vực dạy học (serviceArea) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tỉnh / Thành phố dạy học{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.serviceArea.province}
                  onChange={(e) =>
                    handleServiceAreaChange("province", e.target.value)
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Chọn tỉnh/thành —</option>
                  {provincesAndDistricts.map((p) => (
                    <option key={p.province} value={p.province}>
                      {p.province}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Quận / Huyện{" "}
                  <span className="text-slate-400 font-normal">
                    (Không bắt buộc)
                  </span>
                </label>
                <select
                  value={formData.serviceArea.district}
                  onChange={(e) =>
                    handleServiceAreaChange("district", e.target.value)
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Chọn quận/huyện —</option>
                  {currentServiceDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* KHỐI 3: MÔN HỌC & HỌC PHÍ */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                3. Môn học &amp; Học phí
              </h2>
              <button
                type="button"
                onClick={addSubjectRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-xs font-semibold transition-colors cursor-pointer w-fit border border-blue-200 dark:border-blue-800/50 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm môn dạy</span>
              </button>
            </div>

            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium leading-relaxed bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg p-3">
              Mỗi dòng = 1 môn học. Hình thức "Online" gửi riêng, "Tại nhà" gửi
              riêng. Học phí nhập theo nghìn VNĐ (VD: 200 = 200.000đ/buổi).
            </p>

            {/* Table Header */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-1 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              <span className="col-span-3">Môn học</span>
              <span className="col-span-2">Lớp</span>
              <span className="col-span-2">Hình thức</span>
              <span className="col-span-2">Chương trình</span>
              <span className="col-span-2">Học phí/buổi</span>
              <span className="col-span-1 text-center">Xóa</span>
            </div>

            {/* Rows */}
            <div className="space-y-3">
              {formData.subjectRows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start sm:items-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
                >
                  {/* Môn */}
                  <div className="col-span-1 sm:col-span-3">
                    <select
                      value={row.specialty}
                      onChange={(e) =>
                        handleSubjectRowChange(
                          row.id,
                          "specialty",
                          e.target.value,
                        )
                      }
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {subjectList.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Lớp */}
                  <div className="col-span-1 sm:col-span-2">
                    <select
                      value={row.gradeLevel}
                      onChange={(e) =>
                        handleSubjectRowChange(
                          row.id,
                          "gradeLevel",
                          e.target.value,
                        )
                      }
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {gradeList.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Hình thức */}
                  <div className="col-span-1 sm:col-span-2">
                    <div className="flex flex-col gap-1">
                      {TEACHING_MODE_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className="flex items-center gap-1.5 text-xs cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`mode-${row.id}`}
                            value={opt.value}
                            checked={row.teachingMode === opt.value}
                            onChange={() =>
                              handleSubjectRowChange(
                                row.id,
                                "teachingMode",
                                opt.value,
                              )
                            }
                            className="text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                          />
                          <span className="text-slate-700 dark:text-slate-300">
                            {opt.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Chương trình */}
                  <div className="col-span-1 sm:col-span-2">
                    <input
                      type="text"
                      value={row.program}
                      onChange={(e) =>
                        handleSubjectRowChange(
                          row.id,
                          "program",
                          e.target.value,
                        )
                      }
                      placeholder="VD: Luyện thi IELTS"
                      maxLength={100}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Học phí */}
                  <div className="col-span-1 sm:col-span-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={row.feeThousands}
                        onChange={(e) =>
                          handleSubjectRowChange(
                            row.id,
                            "feeThousands",
                            e.target.value,
                          )
                        }
                        placeholder="200"
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-semibold"
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                        nghìn
                      </span>
                    </div>
                  </div>

                  {/* Xóa */}
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeSubjectRow(row.id)}
                      disabled={formData.subjectRows.length <= 1}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* KHỐI 4: GIỚI THIỆU & VIDEO */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Sparkles className="w-5 h-5 text-blue-600" />
              4. Giới thiệu bản thân &amp; Video
            </h2>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Giới thiệu bản thân <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mô tả ngắn gọn về bản thân: kinh nghiệm, phương pháp dạy, điểm
                mạnh...
              </p>
              <textarea
                rows={4}
                name="bio"
                required
                value={formData.bio}
                onChange={handleInputChange}
                maxLength={500}
                placeholder="VD: Mình là sinh viên năm 3 Sư phạm Anh, có 2 năm kinh nghiệm dạy tiếng Anh..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed resize-none"
              />
              <p className="text-xs text-slate-400 text-right">
                {formData.bio.length}/500
              </p>
            </div>

            {/* Video URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-600" />
                Link video giới thiệu{" "}
                <span className="text-slate-400 font-normal">
                  (Không bắt buộc)
                </span>
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dán link video YouTube / TikTok / Facebook... giới thiệu bản
                thân hoặc bài giảng mẫu.
              </p>
              <input
                type="url"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleInputChange}
                placeholder="VD: https://www.youtube.com/watch?v=..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* KHỐI 5: LỊCH RẢNH & CHỨNG CHỈ */}
          {/* ════════════════════════════════════════════════════════════════════ */}

          {/* 5a – Lịch rảnh */}
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <CalendarDays className="w-5 h-5 text-blue-600" />
              5. Lịch rảnh có thể dạy
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chọn các khung giờ bạn có thể sắp xếp dạy. Admin sẽ dùng thông tin
              này để ghép lớp phù hợp.
            </p>

            {/* 7×3 Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-center">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide w-20">
                      Khung
                    </th>
                    {TIME_SLOTS.map((slot) => (
                      <th
                        key={slot}
                        className="py-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-2"
                      >
                        {SLOT_LABELS[slot]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {WEEK_DAYS.map((dayLabel, idx) => {
                    const dayOfWeek = idx + 1; // 1=Thứ 2 … 7=Chủ nhật
                    return (
                      <tr
                        key={dayOfWeek}
                        className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 pr-2">
                          {dayLabel}
                        </td>
                        {TIME_SLOTS.map((slot) => (
                          <td key={slot} className="py-2.5 px-2">
                            <label className="inline-flex items-center justify-center cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={hasSlot(
                                  availabilities,
                                  dayOfWeek,
                                  slot,
                                )}
                                onChange={() =>
                                  toggleSlot(
                                    availabilities,
                                    setAvailabilities,
                                    dayOfWeek,
                                    slot,
                                  )
                                }
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </label>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {availabilities.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg p-3">
                Vui lòng chọn ít nhất 1 khung giờ rảnh để tiếp tục.
              </p>
            )}
          </div>

          {/* 5b – Chứng chỉ */}
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <FileCheck className="w-5 h-5 text-blue-600" />
              6. Chứng chỉ &amp; Thành tích
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mỗi dòng là một minh chứng riêng. Bắt buộc có file đính kèm.
            </p>

            <div className="space-y-4">
              {credentials.map((cred, idx) => (
                <div
                  key={cred.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Chứng chỉ {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCredential(cred.id)}
                      disabled={credentials.length <= 1}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Tên chứng chỉ */}
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Tên chứng chỉ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={cred.title}
                        onChange={(e) =>
                          handleCredentialChange(
                            cred.id,
                            "title",
                            e.target.value,
                          )
                        }
                        placeholder="VD: IELTS Academic 7.5"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Loại */}
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Loại <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={cred.type}
                        onChange={(e) =>
                          handleCredentialChange(
                            cred.id,
                            "type",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="CERTIFICATE">Chứng chỉ</option>
                        <option value="ACHIEVEMENT">Thành tích</option>
                      </select>
                    </div>

                    {/* Điểm số */}
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Điểm số{" "}
                        <span className="text-slate-400 font-normal">
                          (Không bắt buộc)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={cred.score}
                        onChange={(e) =>
                          handleCredentialChange(
                            cred.id,
                            "score",
                            e.target.value,
                          )
                        }
                        placeholder="VD: 7.5, 8.0, 900..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* File upload */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      File minh chứng <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer transition-colors shadow-sm">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{cred.file ? "Đổi file" : "Chọn file"}</span>
                        <input
                          ref={(el) => {
                            credentialFileRefs.current[cred.id] = el;
                          }}
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) =>
                            handleCredentialFileChange(
                              cred.id,
                              e.target.files?.[0] || null,
                            )
                          }
                          className="hidden"
                        />
                      </label>
                      {cred.file && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-[160px]">
                          {cred.file.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      Chấp nhận: JPG, PNG, PDF. Tối đa 10MB.
                    </p>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addCredential}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold transition-colors cursor-pointer w-fit active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm chứng chỉ</span>
              </button>
            </div>
          </div>

          {/* ── Submit ── */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
              Bằng việc nhấn "Tạo hồ sơ", bạn cam kết các thông tin khai báo là
              hoàn toàn chính xác.
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-10 py-3.5 rounded-xl bg-blue-600 text-white font-bold text-base hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span>Đang lưu hồ sơ...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Tạo hồ sơ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      {/* ── Success Modal ── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Tạo hồ sơ thành công!
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Hồ sơ của bạn đã được gửi duyệt cho Admin. Bạn có thể truy cập
                Dashboard để xem các lớp học phù hợp.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => navigate("/tutor")}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer shadow-md"
              >
                Vào Dashboard Gia sư
              </button>
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Tiếp tục chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
