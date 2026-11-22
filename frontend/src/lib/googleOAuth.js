import { apiGetGoogleAuthorizationUrl, apiGoogleCallback } from "./authApi";

const TRANSACTION_KEY = "englishpath_google_oauth_transaction";
const MAX_TRANSACTION_AGE_MS = 10 * 60 * 1000;

function base64Url(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function randomValue(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

async function sha256Base64Url(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return base64Url(new Uint8Array(digest));
}

function safeReturnTo(value) {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/";
  // Không quay lại chính trang đăng nhập / callback.
  return /^\/(login|auth\/)/.test(value) ? "/" : value;
}

/** @param {"PARENT"|"TUTOR"} [role] loại tài khoản đang đăng nhập, gửi kèm khi đổi mã ở backend. */
export async function beginGoogleOAuth(returnTo = "/", role = "PARENT") {
  const codeVerifier = randomValue(64);
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const state = randomValue(32);
  const nonce = randomValue(32);
  const redirectUri = `${window.location.origin}/auth/google/callback`;

  const authorizationUrl = await apiGetGoogleAuthorizationUrl({
    redirectUri,
    state,
    codeChallenge,
    nonce,
  });

  sessionStorage.setItem(TRANSACTION_KEY, JSON.stringify({
    codeVerifier,
    state,
    nonce,
    redirectUri,
    returnTo: safeReturnTo(returnTo),
    role: role === "TUTOR" ? "TUTOR" : "PARENT",
    createdAt: Date.now(),
  }));
  window.location.assign(authorizationUrl);
}

export async function completeGoogleOAuth(code, returnedState) {
  const raw = sessionStorage.getItem(TRANSACTION_KEY);
  sessionStorage.removeItem(TRANSACTION_KEY);
  if (!raw) throw new Error("Không tìm thấy phiên đăng nhập Google. Vui lòng thử lại.");

  let transaction;
  try {
    transaction = JSON.parse(raw);
  } catch {
    throw new Error("Phiên đăng nhập Google không hợp lệ. Vui lòng thử lại.");
  }

  if (transaction.state !== returnedState
      || Date.now() - transaction.createdAt > MAX_TRANSACTION_AGE_MS) {
    throw new Error("Phiên đăng nhập Google đã hết hạn hoặc không hợp lệ.");
  }

  const result = await apiGoogleCallback({
    code,
    codeVerifier: transaction.codeVerifier,
    redirectUri: transaction.redirectUri,
    nonce: transaction.nonce,
    role: transaction.role === "TUTOR" ? "TUTOR" : "PARENT",
  });
  return { result, returnTo: safeReturnTo(transaction.returnTo) };
}
