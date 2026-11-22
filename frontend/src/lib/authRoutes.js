/** Trang chủ của từng vai trò sau khi đăng nhập. */
export const ROLE_ROUTES = {
  admin: "/admin",
  tutor: "/tutor",
  student: "/student",
  parent: "/parent",
  receptionist: "/receptionist",
  accountant: "/accountant",
};

/** Tên hiển thị của từng vai trò. */
export const ROLE_LABELS = {
  admin: "Quản trị viên",
  tutor: "Gia sư",
  student: "Học sinh",
  parent: "Phụ huynh",
  receptionist: "Lễ tân",
  accountant: "Kế toán",
};

/**
 * Màn bắt buộc đổi mật khẩu lần đầu theo vai trò (API_DESIGN 3.1).
 * Gia sư tự đặt mật khẩu khi đăng ký nên không nằm trong danh sách này.
 */
export const FORCE_PASSWORD_PATHS = {
  student: "/student/change-password",
  receptionist: "/change-password",
  accountant: "/change-password",
};
