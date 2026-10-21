import assert from "node:assert/strict";
import test from "node:test";
import {
  PROFILE_STATUS,
  getEditMode,
  isFieldLocked,
  mapApiToForm,
  emptyForm,
  buildUpsertPayload,
  validate,
} from "./tutorProfileModel.js";

// ── getEditMode ─────────────────────────────────────────────────────────────

test("getEditMode: INCOMPLETE → full", () => {
  assert.equal(getEditMode(PROFILE_STATUS.INCOMPLETE), "full");
});

test("getEditMode: REJECTED → full", () => {
  assert.equal(getEditMode(PROFILE_STATUS.REJECTED), "full");
});

test("getEditMode: ACTIVE → restricted", () => {
  assert.equal(getEditMode(PROFILE_STATUS.ACTIVE), "restricted");
});

test("getEditMode: PENDING → locked", () => {
  assert.equal(getEditMode(PROFILE_STATUS.PENDING), "locked");
});

test("getEditMode: INACTIVE → locked", () => {
  assert.equal(getEditMode(PROFILE_STATUS.INACTIVE), "locked");
});

test("getEditMode: undefined → locked", () => {

// ── isFieldLocked ───────────────────────────────────────────────────────────

test("isFieldLocked: fullName bị khóa khi ACTIVE", () => {
  assert.equal(isFieldLocked("fullName", PROFILE_STATUS.ACTIVE), true);
});

test("isFieldLocked: dateOfBirth bị khóa khi ACTIVE", () => {
  assert.equal(isFieldLocked("dateOfBirth", PROFILE_STATUS.ACTIVE), true);
});

test("isFieldLocked: gender bị khóa khi ACTIVE", () => {
  assert.equal(isFieldLocked("gender", PROFILE_STATUS.ACTIVE), true);
});

test("isFieldLocked: hometown bị khóa khi ACTIVE", () => {
  assert.equal(isFieldLocked("hometown", PROFILE_STATUS.ACTIVE), true);
});

test("isFieldLocked: university bị khóa khi ACTIVE", () => {
  assert.equal(isFieldLocked("university", PROFILE_STATUS.ACTIVE), true);
});

test("isFieldLocked: phone KHÔNG bị khóa khi ACTIVE", () => {
  assert.equal(isFieldLocked("phone", PROFILE_STATUS.ACTIVE), false);
});

test("isFieldLocked: address KHÔNG bị khóa khi ACTIVE", () => {
  assert.equal(isFieldLocked("address", PROFILE_STATUS.ACTIVE), false);
});

test("isFieldLocked: không khóa khi INCOMPLETE", () => {
  assert.equal(isFieldLocked("fullName", PROFILE_STATUS.INCOMPLETE), false);
});

test("isFieldLocked: không khóa khi PENDING", () => {
  assert.equal(isFieldLocked("fullName", PROFILE_STATUS.PENDING), false);
});

test("isFieldLocked: không khóa khi REJECTED", () => {
  assert.equal(isFieldLocked("fullName", PROFILE_STATUS.REJECTED), false);
});

// ── mapApiToForm ────────────────────────────────────────────────────────────

test("mapApiToForm: null → empty form", () => {
  const form = mapApiToForm(null);
  assert.equal(form.fullName, "");
  assert.deepEqual(form.serviceAreas, []);
  assert.deepEqual(form.credentials, []);
});

test("mapApiToForm: undefined → empty form", () => {
  const form = mapApiToForm(undefined);
  assert.equal(form.bio, "");
  assert.equal(form.experienceYears, 0);
});

test("mapApiToForm: map đầy đủ các trường đơn", () => {
  const api = {
    userId: 10,
    tutorId: 100,
    fullName: "Nguyễn Văn A",
    email: "a@example.com",
    phone: "0912345678",
    avatarUrl: "https://example.com/avatar.jpg",
    dateOfBirth: "2000-01-15",
    gender: "MALE",
    hometown: "Hà Nội",
    address: "123 Lê Lợi, Q1, TP.HCM",
    university: "ĐH Quốc gia",
    educationStatus: "GRADUATED",
    experienceYears: 5,
    bio: "Là gia sư tiếng Anh",
    videoUrl: "https://youtube.com/demo",
    profileStatus: "ACTIVE",
    rejectionReason: null,
    reviewedAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
  };

  const form = mapApiToForm(api);
  assert.equal(form.fullName, "Nguyễn Văn A");
  assert.equal(form.email, "a@example.com");
  assert.equal(form.phone, "0912345678");
  assert.equal(form.dateOfBirth, "2000-01-15");
  assert.equal(form.gender, "MALE");
  assert.equal(form.hometown, "Hà Nội");
  assert.equal(form.address, "123 Lê Lợi, Q1, TP.HCM");
  assert.equal(form.university, "ĐH Quốc gia");
  assert.equal(form.experienceYears, 5);
  assert.equal(form.profileStatus, "ACTIVE");
  assert.equal(form.userId, 10);
  assert.equal(form.tutorId, 100);
});

test("mapApiToForm: map mảng con (bỏ id backend)", () => {
  const api = {
    serviceAreas: [
      { id: 1, province: "TP.HCM", district: "Quận 1" },
      { id: 2, province: "Hà Nội", district: "Ba Đình" },
    ],
    specialties: [
      { id: 1, specialty: "Tiếng Anh", gradeLevel: "Lớp 8" },
    ],
    prices: [
      { id: 1, teachingMode: "ONLINE", pricePerSession: 200000, program: "IELTS" },
    ],
    availabilities: [
      { id: 1, dayOfWeek: 2, timeSlot: "EVENING" },
      { id: 2, dayOfWeek: 4, timeSlot: "EVENING" },
    ],
    credentials: [
      { id: 1, title: "IELTS 8.5", type: "CERTIFICATE", score: "8.5", fileUrl: "https://file.com/c1.pdf" },
    ],
  };

  const form = mapApiToForm(api);
  assert.deepEqual(form.serviceAreas, [
    { province: "TP.HCM", district: "Quận 1" },
    { province: "Hà Nội", district: "Ba Đình" },
  ]);
  assert.deepEqual(form.specialties, [
    { specialty: "Tiếng Anh", gradeLevel: "Lớp 8" },
  ]);
  assert.deepEqual(form.prices, [
    { teachingMode: "ONLINE", pricePerSession: 200000, program: "IELTS" },
  ]);
  assert.deepEqual(form.availabilities, [
    { dayOfWeek: 2, timeSlot: "EVENING" },
    { dayOfWeek: 4, timeSlot: "EVENING" },
  ]);
  assert.deepEqual(form.credentials, [
    { title: "IELTS 8.5", type: "CERTIFICATE", score: "8.5", fileUrl: "https://file.com/c1.pdf" },
  ]);
  // Không được chứa id backend
  assert.equal(form.serviceAreas[0].id, undefined);
  assert.equal(form.specialties[0].id, undefined);
});

test("mapApiToForm: mảng con null → mảng rỗng", () => {
  const api = {
    serviceAreas: null,
    specialties: null,
    prices: null,
    availabilities: null,
    credentials: null,
  };
  const form = mapApiToForm(api);
  assert.deepEqual(form.serviceAreas, []);
  assert.deepEqual(form.specialties, []);
  assert.deepEqual(form.prices, []);
  assert.deepEqual(form.availabilities, []);
  assert.deepEqual(form.credentials, []);
});

// ── buildUpsertPayload ──────────────────────────────────────────────────────

test("buildUpsertPayload: INCOMPLETE gửi đủ mọi trường", () => {
  const form = emptyForm();
  form.fullName = "Nguyễn Văn A";
  form.dateOfBirth = "2000-01-15";
  form.gender = "MALE";
  form.phone = "0912345678";
  form.address = "123 Lê Lợi";
  form.hometown = "Hà Nội";
  form.university = "ĐH Quốc gia";
  form.educationStatus = "GRADUATED";
  form.experienceYears = 3;
  form.bio = "Giới thiệu";
  form.videoUrl = "https://youtube.com/x";
  form.avatarUrl = "https://file.com/a.jpg";
  form.serviceAreas = [{ province: "TP.HCM", district: "Quận 1" }];
  form.specialties = [{ specialty: "Anh", gradeLevel: "Lớp 8" }];
  form.prices = [{ teachingMode: "ONLINE", pricePerSession: 200000, program: "IELTS" }];
  form.availabilities = [{ dayOfWeek: 2, timeSlot: "EVENING" }];
  form.credentials = [{ title: "Cert", type: "CERTIFICATE", score: "", fileUrl: "https://file.com/c.pdf" }];

  const payload = buildUpsertPayload(form, PROFILE_STATUS.INCOMPLETE);
  assert.equal(payload.fullName, "Nguyễn Văn A");
  assert.equal(payload.dateOfBirth, "2000-01-15");
  assert.equal(payload.gender, "MALE");
  assert.equal(payload.hometown, "Hà Nội");
  assert.equal(payload.university, "ĐH Quốc gia");
  assert.equal(payload.phone, "0912345678");
  assert.deepEqual(payload.serviceAreas, [{ province: "TP.HCM", district: "Quận 1" }]);
  assert.deepEqual(payload.specialties, [{ specialty: "Anh", gradeLevel: "Lớp 8" }]);
  assert.deepEqual(payload.prices, [{ teachingMode: "ONLINE", pricePerSession: 200000, program: "IELTS" }]);
  assert.deepEqual(payload.availabilities, [{ dayOfWeek: 2, timeSlot: "EVENING" }]);
  assert.deepEqual(payload.credentials, [{ title: "Cert", type: "CERTIFICATE", score: "", fileUrl: "https://file.com/c.pdf" }]);
});

test("buildUpsertPayload: ACTIVE KHÔNG gửi trường bị khóa", () => {
  const form = emptyForm();
  form.fullName = "Nguyễn Văn A";
  form.dateOfBirth = "2000-01-15";
  form.gender = "MALE";
  form.hometown = "Hà Nội";
  form.university = "ĐH Quốc gia";
  form.phone = "0912345678";
  form.address = "123 Lê Lợi";
  form.educationStatus = "GRADUATED";
  form.experienceYears = 3;
  form.bio = "Giới thiệu";

  const payload = buildUpsertPayload(form, PROFILE_STATUS.ACTIVE);
  // Trường bị khóa không được gửi
  assert.equal(payload.fullName, undefined);
  assert.equal(payload.dateOfBirth, undefined);
  assert.equal(payload.gender, undefined);
  assert.equal(payload.hometown, undefined);
  assert.equal(payload.university, undefined);
  // Trường cho phép vẫn gửi
  assert.equal(payload.phone, "0912345678");
  assert.equal(payload.address, "123 Lê Lợi");
  assert.equal(payload.bio, "Giới thiệu");
});

test("buildUpsertPayload: luôn gửi đủ 5 mảng, kể cả rỗng", () => {
  const form = emptyForm();
  form.phone = "0912345678";

  const payload = buildUpsertPayload(form, PROFILE_STATUS.REJECTED);
  assert.deepEqual(payload.serviceAreas, []);
  assert.deepEqual(payload.specialties, []);
  assert.deepEqual(payload.prices, []);
  assert.deepEqual(payload.availabilities, []);
  assert.deepEqual(payload.credentials, []);
});

// ── validate ────────────────────────────────────────────────────────────────

test("validate: form hợp lệ INCOMPLETE → không lỗi", () => {
  const form = {
    fullName: "Nguyễn Văn A",
    dateOfBirth: "2000-01-15",
    gender: "MALE",
    phone: "0912345678",
    address: "123 Lê Lợi",
    university: "ĐH Quốc gia",
    educationStatus: "GRADUATED",
    experienceYears: 3,
    bio: "Giới thiệu về bản thân",
  };
  const errors = validate(form, PROFILE_STATUS.INCOMPLETE);
  assert.deepEqual(errors, {});
});

test("validate: INCOMPLETE thiếu fullName → lỗi", () => {
  const form = { ...emptyForm(), phone: "0912345678" };
  const errors = validate(form, PROFILE_STATUS.INCOMPLETE);
  assert.equal(errors.fullName, "Họ và tên là bắt buộc");
});

test("validate: INCOMPLETE thiếu dateOfBirth → lỗi", () => {
  const form = { ...emptyForm(), fullName: "A", phone: "0912345678" };
  const errors = validate(form, PROFILE_STATUS.INCOMPLETE);
  assert.equal(errors.dateOfBirth, "Ngày sinh là bắt buộc");
});

test("validate: INCOMPLETE thiếu phone → lỗi", () => {
  const form = { ...emptyForm(), fullName: "A", dateOfBirth: "2000-01-15" };
  const errors = validate(form, PROFILE_STATUS.INCOMPLETE);
  assert.equal(errors.phone, "Số điện thoại là bắt buộc");
});

test("validate: phone sai định dạng → lỗi", () => {
  const form = {
    ...emptyForm(),
    fullName: "A",
    dateOfBirth: "2000-01-15",
    gender: "MALE",
    phone: "123",
    address: "x",
    university: "y",
    educationStatus: "GRADUATED",
    experienceYears: 1,
    bio: "z",
  };
  const errors = validate(form, PROFILE_STATUS.INCOMPLETE);
  assert.equal(errors.phone, "Số điện thoại không hợp lệ");
});

test("validate: experienceYears âm → lỗi", () => {
  const form = {
    ...emptyForm(),
    fullName: "A",
    dateOfBirth: "2000-01-15",
    gender: "MALE",
    phone: "0912345678",
    address: "x",
    university: "y",
    educationStatus: "GRADUATED",
    experienceYears: -1,
    bio: "z",
  };
  const errors = validate(form, PROFILE_STATUS.INCOMPLETE);
  assert.equal(errors.experienceYears, "Số năm kinh nghiệm phải >= 0");
});

test("validate: ACTIVE chỉ kiểm tra trường có thể sửa", () => {
  const form = {
    ...emptyForm(),
    fullName: "", // bị khóa, không bị validate lỗi bắt buộc ở chế độ này
    dateOfBirth: "", // bị khóa
    phone: "0912345678",
    address: "123 Lê Lợi",
    educationStatus: "GRADUATED",
    experienceYears: 3,
    bio: "Giới thiệu",
  };
  const errors = validate(form, PROFILE_STATUS.ACTIVE);
  assert.equal(errors.fullName, undefined);
  assert.equal(errors.dateOfBirth, undefined);
  assert.deepEqual(errors, {});
});

test("validate: ACTIVE thiếu phone → lỗi", () => {
  const form = { ...emptyForm(), address: "x", bio: "y" };
  const errors = validate(form, PROFILE_STATUS.ACTIVE);
  assert.equal(errors.phone, "Số điện thoại là bắt buộc");
});
  assert.equal(getEditMode(undefined), "locked");
});