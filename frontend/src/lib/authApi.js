/**
 * Auth API service — wrapper gọi Identity Service backend.
 * Base URL được lấy từ biến môi trường VITE_API_BASE_URL (định nghĩa trong .env.local).
 * Ví dụ: VITE_API_BASE_URL=http://localhost:8080
 */
const BASE = import.meta.env.VITE_API_BASE_URL;

if (!BASE) {
  console.error("[authApi] Thiếu biến môi trường VITE_API_BASE_URL. Kiểm tra file .env.local.");
}


/**
 * Đăng nhập — POST /auth/token
 *
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ token: string, authenticated: boolean }>}
 * @throws {Error} khi credentials sai hoặc network error
 */
export async function apiLogin(username, password) {
  const res = await fetch(`${BASE}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();

  // Backend trả về: { code, message, result: { token, authenticated } }
  if (!res.ok || !data.result?.authenticated) {
    throw new Error(data.message || "Tên đăng nhập hoặc mật khẩu không đúng");
  }

  return data.result; // { token, authenticated }
}

/**
 * Đăng xuất — POST /auth/logout
 * Blacklist token hiện tại trên server.
 *
 * @param {string} token - JWT token đang dùng
 * @returns {Promise<void>}
 */
export async function apiLogout(token) {
  try {
    await fetch(`${BASE}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  } catch {
    // Ignore network errors khi logout — vẫn xóa local session
  }
}

/**
 * Introspect token — POST /auth/introspect
 * Kiểm tra token còn hợp lệ trên server không (chưa bị blacklist, chưa hết hạn).
 *
 * @param {string} token
 * @returns {Promise<boolean>}
 */
export async function apiIntrospect(token) {
  try {
    const res = await fetch(`${BASE}/auth/introspect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    return data.result?.valid === true;
  } catch {
    return false;
  }
}

/**
 * Tạo Authorization header chuẩn Bearer cho các API call sau này.
 *
 * @param {string} token
 * @returns {{ Authorization: string }}
 */
export function bearerHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Đăng ký tài khoản gia sư mới — POST /auth/register-tutor
 *
 * @param {string} fullName
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ token: string, authenticated: boolean, userId: number, username: string, fullName: string, role: string, profileStatus: string }>}
 * @throws {Error} khi email đã tồn tại hoặc validation error
 */
export async function apiRegisterTutor(fullName, email, password) {
  const res = await fetch(`${BASE}/auth/register-tutor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName, email, password }),
  });

  const data = await res.json();

  // Backend trả về: { code, message, result: { token, authenticated, userId, username, fullName, role, profileStatus } }
  if (!res.ok || !data.result?.authenticated) {
    throw new Error(data.message || "Đăng ký thất bại");
  }

  return data.result;
}
