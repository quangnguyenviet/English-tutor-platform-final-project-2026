/**
 * Decode JWT payload từ base64url — không verify signature.
 * Chỉ dùng để đọc thông tin sau khi backend đã xác thực.
 *
 * @param {string} token - JWT token string
 * @returns {{ iss, sub, exp, iat, jti, scope } | null}
 */
export function decodeJwt(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    // Pad base64 nếu thiếu ký tự =
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Chuyển JWT scope (ROLE_TUTOR) → frontend role slug ("tutor").
 *
 * @param {string} scope - giá trị field scope trong JWT payload
 * @returns {"admin"|"tutor"|"student"|"receptionist"|"accountant"|null}
 */
export function scopeToRole(scope) {
  const map = {
    ROLE_ADMIN: "admin",
    ROLE_TUTOR: "tutor",
    ROLE_STUDENT: "student",
    ROLE_RECEPTIONIST: "receptionist",
    ROLE_ACCOUNTANT: "accountant",
  };
  return map[scope] ?? null;
}

/**
 * Kiểm tra JWT token có còn hạn không dựa trên trường exp.
 *
 * @param {string} token
 * @returns {boolean}
 */
export function isTokenExpired(token) {
  const payload = decodeJwt(token);
  if (!payload?.exp) return true;
  // exp là Unix timestamp tính bằng giây
  return Date.now() / 1000 >= payload.exp;
}
