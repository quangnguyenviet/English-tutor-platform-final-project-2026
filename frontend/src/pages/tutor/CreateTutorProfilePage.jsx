import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  GraduationCap,
  Info,
  AlertCircle,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  FileCheck,
  Image as ImageIcon,
  Video,
  ShieldCheck,
  User,
  Sparkles,
  School,
  BookOpen,
} from "lucide-react";
import ThemeToggle from "../../components/theme-toggle";
import {
  provincesAndDistricts,
  universitiesList,
  subjectList,
  gradeList,
  vehicleList,
} from "../../data/vietnamLocations";
import { useAuth } from "../../context/AuthContext";

export default function CreateTutorProfilePage() {
  const navigate = useNavigate();
  const { session, loginAsTutor, addTutor } = useAuth();

  // Load pre-registered email/name if available
  const pendingRegisterRaw = localStorage.getItem("gsa_pending_tutor_register");
  const pendingRegister = pendingRegisterRaw ? JSON.parse(pendingRegisterRaw) : null;

  // Form State
  const [formData, setFormData] = useState({
    fullName: pendingRegister?.fullName || "Phạm Công Minh",
    idCardNumber: "",
    gender: "male", // "male" | "female"
    phone: "0912 345 678",
    phone2: "",
    facebookUrl: "https://www.facebook.com/phamcongminh.vn",
    birthDay: "15",
    birthMonth: "08",
    birthYear: "2002",
    hometownProvince: "Hà Nội",
    hometownDistrict: "Quận Cầu Giấy",
    title: "student", // "student" | "teacher" | "graduated"
    livingProvince: "Hà Nội",
    livingDistrict: "Quận Nam Từ Liêm",
    addressDetail: "Số 12, Ngõ 45, KĐT Mỹ Đình 1",
    street: "Đường Nguyễn Cơ Thạch",
    ward: "Phường Mỹ Đình 1",
    university: "Học viện Công nghệ Bưu chính Viễn thông (PTIT)",
    customUniversity: "",
    faculty: "Công nghệ thông tin",
    vehicle: "Xe máy",
    teachOnline: "yes", // "yes" | "no"
    bio: "Em là sinh viên năm cuối khoa CNTT - PTIT, từng đạt 8.0 IELTS và giải Ba học sinh giỏi cấp Tỉnh. Em có kinh nghiệm gia sư 2 năm, phương pháp giảng dạy kiên nhẫn, dễ hiểu, nắm bắt tâm lý học sinh tốt.",
    achievements: "Điểm thi Đại học: Khối A01 đạt 27.8 điểm (Toán 9.2, Lý 9.0, Anh 9.6). IELTS 8.0 (Listening 8.5, Reading 8.5). Đã kèm 4 học sinh thi đỗ trường chuyên và tăng 2-3 điểm thi học kỳ.",
    teachingArea: "Quận Cầu Giấy, Quận Nam Từ Liêm, Quận Thanh Xuân, Quận Ba Đình",
    videoUrl: "https://www.youtube.com/watch?v=demo-intro-tutor",
  });

  // Môn học & Học phí có thể dạy (Dynamic Rows)
  const [subjectRows, setSubjectRows] = useState([
    { id: 1, subject: "Tiếng Anh", grade: "Lớp 8", fee: "200" },
    { id: 2, subject: "Tiếng Anh", grade: "Lớp 9 (Luyện thi vào 10)", fee: "250" },
    { id: 3, subject: "Luyện thi IELTS", grade: "Lớp 12 (Luyện thi ĐH / Tốt nghiệp)", fee: "350" },
    { id: 4, subject: "Toán", grade: "Lớp 6", fee: "180" },
    { id: 5, subject: "Toán", grade: "Lớp 7", fee: "180" },
  ]);

  // Files State
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [certFiles, setCertFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Cascade Districts for Hometown
  const currentHometownDistricts =
    provincesAndDistricts.find((p) => p.province === formData.hometownProvince)?.districts || [];

  // Cascade Districts for Living Area
  const currentLivingDistricts =
    provincesAndDistricts.find((p) => p.province === formData.livingProvince)?.districts || [];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleHometownProvinceChange = (e) => {
    const prov = e.target.value;
    const firstDistrict =
      provincesAndDistricts.find((p) => p.province === prov)?.districts[0] || "";
    setFormData((prev) => ({
      ...prev,
      hometownProvince: prov,
      hometownDistrict: firstDistrict,
    }));
  };

  const handleLivingProvinceChange = (e) => {
    const prov = e.target.value;
    const firstDistrict =
      provincesAndDistricts.find((p) => p.province === prov)?.districts[0] || "";
    setFormData((prev) => ({
      ...prev,
      livingProvince: prov,
      livingDistrict: firstDistrict,
    }));
  };

  // Subject rows handler
  const handleSubjectRowChange = (id, field, value) => {
    setSubjectRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const addSubjectRow = () => {
    const newId = Date.now();
    setSubjectRows((prev) => [
      ...prev,
      { id: newId, subject: "Tiếng Anh", grade: "Lớp 8", fee: "200" },
    ]);
  };

  const removeSubjectRow = (id) => {
    if (subjectRows.length <= 1) return;
    setSubjectRows((prev) => prev.filter((row) => row.id !== id));
  };

  // Avatar handler
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Certificates handler
  const handleCertFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setCertFiles((prev) => [...prev, ...files]);
    }
  };

  const removeCertFile = (index) => {
    setCertFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      // Đăng nhập vai trò Tutor và cập nhật thông tin
      loginAsTutor();
      // Đánh dấu gia sư này đã tạo hồ sơ thành công
      localStorage.setItem("gsa_tutor_profile_created", "true");

      if (addTutor) {
        addTutor({
          name: formData.fullName,
          email: pendingRegister?.email || "minh.pham@englishpath.vn",
          phone: formData.phone,
          university: formData.university,
          faculty: formData.faculty,
          subjects: Array.from(new Set(subjectRows.map((r) => r.subject))),
          gender: formData.gender === "male" ? "Nam" : "Nữ",
          status: "pending_approval",
          teachingArea: formData.teachingArea,
          bio: formData.bio,
        });
      }

      setIsSubmitting(false);
      setShowSuccessModal(true);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-muted/30 text-foreground pb-20">
      {/* Top Header */}
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

      {/* Main Container */}
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
            Điền đầy đủ thông tin bên dưới để hoàn thiện hồ sơ giảng dạy và bắt đầu nhận lớp từ phụ huynh.
          </p>
        </div>

        {/* Notice Alert Banner (Giống khung xanh trong ảnh) */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-900 dark:text-sky-200 flex items-start gap-3 shadow-xs">
          <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm leading-relaxed">
            <strong className="font-bold text-sky-700 dark:text-sky-300">LƯU Ý:</strong> Sau khi tạo xong hồ sơ, bạn có thể sửa các thông tin trừ: <em>lý lịch mà bạn muốn</em>. Vì vậy bạn đừng quá lo lắng khi điền các thông tin dưới đây nhé!
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ============================================================ */}
          {/* KHỐI 1: THÔNG TIN CÁ NHÂN CƠ BẢN */}
          {/* ============================================================ */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-5">
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <User className="w-5 h-5 text-primary" />
              1. Thông tin cá nhân cơ bản
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Họ và tên */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="VD: Phạm Công Minh"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* CMND / CCCD */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  CMND / CCCD <span className="text-muted-foreground font-normal">(Không bắt buộc)</span>
                </label>
                <input
                  type="text"
                  name="idCardNumber"
                  value={formData.idCardNumber}
                  onChange={handleInputChange}
                  placeholder="Số CMND/CCCD (không bắt buộc)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Giới tính */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Giới tính <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={formData.gender === "male"}
                      onChange={handleInputChange}
                      className="text-primary focus:ring-primary w-4 h-4"
                    />
                    <span>Nam</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={formData.gender === "female"}
                      onChange={handleInputChange}
                      className="text-primary focus:ring-primary w-4 h-4"
                    />
                    <span>Nữ</span>
                  </label>
                </div>
              </div>

              {/* Ngày sinh (3 Selects Ngày - Tháng - Năm) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Ngày sinh <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    name="birthDay"
                    value={formData.birthDay}
                    onChange={handleInputChange}
                    className="px-2.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d < 10 ? `0${d}` : `${d}`}>
                        Ngày {d}
                      </option>
                    ))}
                  </select>
                  <select
                    name="birthMonth"
                    value={formData.birthMonth}
                    onChange={handleInputChange}
                    className="px-2.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m < 10 ? `0${m}` : `${m}`}>
                        Tháng {m}
                      </option>
                    ))}
                  </select>
                  <select
                    name="birthYear"
                    value={formData.birthYear}
                    onChange={handleInputChange}
                    className="px-2.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {Array.from({ length: 45 }, (_, i) => 2010 - i).map((y) => (
                      <option key={y} value={`${y}`}>
                        Năm {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Số điện thoại */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Số điện thoại <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Số điện thoại chính"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Số điện thoại 2 */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Số điện thoại 2 <span className="text-muted-foreground font-normal">(Dự phòng)</span>
                </label>
                <input
                  type="tel"
                  name="phone2"
                  value={formData.phone2}
                  onChange={handleInputChange}
                  placeholder="Số điện thoại 2 (nếu có)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Link Facebook cá nhân */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-foreground">
                Địa chỉ Facebook cá nhân <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-rose-500 font-medium">
                Hướng dẫn lấy link profile FB cá nhân: https://facebook.com/slug/username. Trang cá nhân -&gt; Quét link qua F5 này
              </p>
              <input
                type="url"
                name="facebookUrl"
                required
                value={formData.facebookUrl}
                onChange={handleInputChange}
                placeholder="VD: https://www.facebook.com/phamcongminh.vn"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Quê quán (Tỉnh / Thành -> Quận / Huyện) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Quê quán (Tỉnh / TP) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.hometownProvince}
                  onChange={handleHometownProvinceChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {provincesAndDistricts.map((p) => (
                    <option key={p.province} value={p.province}>
                      {p.province}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Quận / Huyện quê quán <span className="text-rose-500">*</span>
                </label>
                <select
                  name="hometownDistrict"
                  value={formData.hometownDistrict}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {currentHometownDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Chức danh (Hiện là) */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-foreground">
                Chức danh / Hiện là <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-6 pt-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="title"
                    value="student"
                    checked={formData.title === "student"}
                    onChange={handleInputChange}
                    className="text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>Sinh viên</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="title"
                    value="teacher"
                    checked={formData.title === "teacher"}
                    onChange={handleInputChange}
                    className="text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>Giáo viên</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="title"
                    value="graduated"
                    checked={formData.title === "graduated"}
                    onChange={handleInputChange}
                    className="text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>Sinh viên tốt nghiệp</span>
                </label>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* KHỐI 2: NƠI HỌC TẬP & NƠI Ở HIỆN TẠI */}
          {/* ============================================================ */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-5">
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <School className="w-5 h-5 text-primary" />
              2. Nơi học tập / Công tác &amp; Nơi ở hiện tại
            </h2>

            <p className="text-xs text-rose-500 font-medium leading-relaxed">
              Nếu bạn đã ra trường và nay là đã chuyên nghiệp chọn "Giáo viên" và ghi rõ ở phần tự giới thiệu "Hiện là giáo viên tự do"
            </p>

            {/* Sống tại */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Sống tại (Tỉnh / Thành phố) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.livingProvince}
                  onChange={handleLivingProvinceChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {provincesAndDistricts.map((p) => (
                    <option key={p.province} value={p.province}>
                      {p.province}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Quận / Huyện nơi sống <span className="text-rose-500">*</span>
                </label>
                <select
                  name="livingDistrict"
                  value={formData.livingDistrict}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {currentLivingDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Địa chỉ chi tiết */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Địa chỉ ngõ, ngách, tòa nhà, KĐT
                </label>
                <input
                  type="text"
                  name="addressDetail"
                  value={formData.addressDetail}
                  onChange={handleInputChange}
                  placeholder="Ngõ, ngách hoặc tên tòa nhà bạn đang ở"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Đường / Phố</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  placeholder="Đường / Phố"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Phường / Xã</label>
                <input
                  type="text"
                  name="ward"
                  value={formData.ward}
                  onChange={handleInputChange}
                  placeholder="Phường / Xã"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Trường học tập / Công tác */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Trường học tập / Công tác <span className="text-rose-500">*</span>
              </label>
              <select
                name="university"
                value={formData.university}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {universitiesList.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Đơn vị học tập/công tác khác & Khoa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Đơn vị học tập/công tác <span className="text-muted-foreground font-normal">(Nếu không có ở trên)</span>
                </label>
                <input
                  type="text"
                  name="customUniversity"
                  value={formData.customUniversity}
                  onChange={handleInputChange}
                  placeholder="Tên đơn vị học tập/công tác"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Khoa / Chuyên ngành <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="faculty"
                  required
                  value={formData.faculty}
                  onChange={handleInputChange}
                  placeholder="Tên khoa (Không có chữ khoa)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Phương tiện & Dạy online */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Phương tiện đi lại <span className="text-rose-500">*</span>
                </label>
                <select
                  name="vehicle"
                  value={formData.vehicle}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {vehicleList.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Dạy online <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="teachOnline"
                      value="yes"
                      checked={formData.teachOnline === "yes"}
                      onChange={handleInputChange}
                      className="text-primary focus:ring-primary w-4 h-4"
                    />
                    <span>Có</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="teachOnline"
                      value="no"
                      checked={formData.teachOnline === "no"}
                      onChange={handleInputChange}
                      className="text-primary focus:ring-primary w-4 h-4"
                    />
                    <span>Không</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* KHỐI 3: MÔN HỌC CÓ THỂ DẠY & HỌC PHÍ */}
          {/* ============================================================ */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                3. Đăng ký môn học có thể dạy &amp; Học phí yêu cầu
              </h2>
              <button
                type="button"
                onClick={addSubjectRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-colors cursor-pointer w-fit"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm môn dạy</span>
              </button>
            </div>

            <p className="text-xs text-rose-500 font-medium leading-relaxed">
              Lưu ý: Lớp 'Trẻ' là dành cho học sinh mầm non, người đi làm, chứ không phải là tất cả các lớp. Xem ví dụ ngắn dòng.
            </p>

            {/* Dynamic Rows Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-xs uppercase font-bold text-muted-foreground">
                    <th className="py-2.5 px-3 rounded-l-xl">Môn học</th>
                    <th className="py-2.5 px-3">Lớp</th>
                    <th className="py-2.5 px-3">Học phí / buổi</th>
                    <th className="py-2.5 px-3 text-center rounded-r-xl">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {subjectRows.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-2 sm:px-3 w-1/3 min-w-[140px]">
                        <select
                          value={row.subject}
                          onChange={(e) => handleSubjectRowChange(row.id, "subject", e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {subjectList.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-2 sm:px-3 w-1/3 min-w-[150px]">
                        <select
                          value={row.grade}
                          onChange={(e) => handleSubjectRowChange(row.id, "grade", e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {gradeList.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-2 sm:px-3 min-w-[140px]">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="50"
                            step="10"
                            value={row.fee}
                            onChange={(e) => handleSubjectRowChange(row.id, "fee", e.target.value)}
                            className="w-20 sm:w-24 px-2.5 py-2 rounded-lg border border-border bg-background text-xs sm:text-sm text-foreground font-semibold text-right focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">nghìn đồng</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 sm:px-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeSubjectRow(row.id)}
                          disabled={subjectRows.length <= 1}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ============================================================ */}
          {/* KHỐI 4: TỰ GIỚI THIỆU & THÀNH TÍCH */}
          {/* ============================================================ */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-5">
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              4. Giới thiệu bản thân &amp; Thành tích nổi bật
            </h2>

            {/* Tự giới thiệu */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Tự giới thiệu bản thân <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-rose-500 font-medium leading-relaxed">
                Lưu ý: Bạn tự giới thiệu ngắn gọn về bản thân: lý lịch, thành tích, phương pháp dạy, những điểm nổi bật... sau khi bạn nộp hồ sơ sẽ cập nhật lại phần này... Đây là phần quan trọng nhất giúp bạn dễ được nhận lớp.
              </p>
              <textarea
                rows={4}
                name="bio"
                required
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Giới thiệu bản thân, chuyên môn, kinh nghiệm, phương pháp dạy..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
              />
            </div>

            {/* Thành tích */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-foreground">
                Thành tích &amp; Điểm số học tập / Luyện thi <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-rose-500 font-medium leading-relaxed">
                Bạn hãy liệt kê những điểm số cao bạn đã đạt được: Điểm thi đại học, giải thi học sinh giỏi, điểm thi TOEIC/IELTS, điểm các môn tự nhiên / xã hội đạt điểm cao... Trung tâm sẽ ưu tiên giao lớp cho bạn nếu bạn có điểm số tốt.
              </p>
              <textarea
                rows={4}
                name="achievements"
                required
                value={formData.achievements}
                onChange={handleInputChange}
                placeholder="Liệt kê chi tiết điểm thi THPT, giải thưởng, GPA, chứng chỉ IELTS/TOEIC..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
              />
            </div>

            {/* Điểm có thể dạy */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-foreground">
                Điểm có thể dạy / Khu vực nhận lớp <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="teachingArea"
                required
                value={formData.teachingArea}
                onChange={handleInputChange}
                placeholder="VD: Quận Cầu Giấy, Quận Nam Từ Liêm, Quận Ba Đình..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* ============================================================ */}
          {/* KHỐI 5: VIDEO & ẢNH THẺ / MINH CHỨNG VĂN BẰNG */}
          {/* ============================================================ */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <FileCheck className="w-5 h-5 text-primary" />
              5. Video bài giảng &amp; Ảnh minh chứng (Bằng cấp, Thẻ SV, CCCD)
            </h2>

            {/* Video Url */}
            <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/25 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-800 dark:text-sky-300">
                <Video className="w-4 h-4" />
                <span>Video bài giảng mẫu hoặc Video tự giới thiệu bản thân</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Đăng tải video bài giảng ngắn hoặc clip tự giới thiệu lên YouTube / TikTok / Facebook... Sau đó bạn copy link dán vào mục này.
              </p>
              <input
                type="url"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleInputChange}
                placeholder="VD: https://www.youtube.com/watch?v=..."
                className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Ảnh đại diện / Ảnh thẻ */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-foreground flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" />
                Ảnh đại diện / Ảnh chân dung (3x4 hoặc 4x6 rõ nét) <span className="text-rose-500">*</span>
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-24 h-28 rounded-xl border-2 border-dashed border-border bg-muted/40 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>

                <div className="space-y-1.5 text-center sm:text-left">
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer shadow-sm transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Chọn ảnh thẻ</span>
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {avatarFile ? avatarFile.name : "Kích thước khuyên dùng: 300x400px, dưới 5MB"}
                  </p>
                </div>
              </div>
            </div>

            {/* Khung minh chứng bằng cấp / CCCD */}
            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs leading-relaxed space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Hướng dẫn tải minh chứng năng lực &amp; giấy tờ:</span>
                </div>
                <p>
                  Bạn cần tải lên các ảnh như: <strong>Bằng khen, chứng chỉ, ảnh chụp điểm thi, Thẻ sinh viên hoặc CCCD</strong>... để được đánh giá cao. Ngoài ra bạn có thể tải bất kỳ hình ảnh nào thể hiện khả năng của mình như chữ đẹp, thơ văn tự sáng tác, hướng dẫn giải 1 bài tập... Trung tâm sẽ ưu tiên giao lớp cho những bạn có đầy đủ ảnh minh chứng.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs leading-relaxed font-medium">
                Lưu ý: Tất cả hình ảnh tải lên sẽ được kiểm duyệt. Định dạng: .jpg, .jpeg, .png, .gif, .pdf. Bắt buộc có ảnh: Thẻ SV hoặc CCCD. Dung lượng tối đa: 20MB.
              </div>

              {/* Upload Drop Area */}
              <div className="border-2 border-dashed border-border hover:border-primary rounded-2xl p-6 text-center bg-muted/20 transition-colors">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs sm:text-sm font-semibold text-foreground mb-1">
                  Kéo thả hoặc chọn các tệp minh chứng
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  CCCD/CMND, Bằng tốt nghiệp ĐH, Bảng điểm GPA, Chứng chỉ ngoại ngữ IELTS/TOEIC...
                </p>
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted border border-border hover:bg-muted/80 text-foreground text-xs font-semibold cursor-pointer shadow-xs transition-all">
                  <span>Chọn tệp đính kèm</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleCertFilesChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* File list preview */}
              {certFiles.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold text-foreground">
                    Danh sách tệp đã chọn ({certFiles.length}):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {certFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-border bg-background text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="truncate font-medium">{file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCertFile(idx)}
                          className="text-muted-foreground hover:text-rose-500 p-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* NÚT SUBMIT TẠO HỒ SƠ */}
          {/* ============================================================ */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Bằng việc nhấn "Tạo hồ sơ", bạn cam kết các thông tin khai báo là hoàn toàn chính xác.
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-10 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/25 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isSubmitting ? "Đang lưu hồ sơ..." : "Tạo hồ sơ"}</span>
            </button>
          </div>
        </form>
      </main>

      {/* ============================================================ */}
      {/* SUCCESS MODAL */}
      {/* ============================================================ */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-foreground">
                Tạo hồ sơ gia sư thành công!
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Hồ sơ giảng dạy của bạn <strong>({formData.fullName})</strong> đã được gửi tới hệ thống. Bạn có thể truy cập ngay trang Dashboard để xem các lớp học phù hợp.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => navigate("/tutor")}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all cursor-pointer shadow-md"
              >
                Vào trang quản lý Gia sư (Dashboard)
              </button>
              <button
                type="button"
                onClick={() => navigate("/tutor/profile")}
                className="w-full py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold transition-colors cursor-pointer"
              >
                Xem chi tiết hồ sơ vừa tạo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
