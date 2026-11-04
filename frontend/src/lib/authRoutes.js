/** Trang chủ của từng vai trò sau khi đăng nhập. */
export const ROLE_ROUTES = {
  admin: "/admin",
  tutor: "/tutor",
  student: "/student",
  receptionist: "/receptionist",
  accountant: "/accountant",
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
