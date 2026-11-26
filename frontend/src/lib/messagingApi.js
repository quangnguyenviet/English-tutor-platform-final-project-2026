/**
 * API nhắn tin phụ huynh - gia sư (MSG). Trình duyệt chỉ gọi backend Spring Boot,
 * không bao giờ nói chuyện trực tiếp với Rocket.Chat.
 */
import { bearerHeader } from "./authApi";

const BASE = import.meta.env.VITE_API_BASE_URL;

export class ApiError extends Error {
  constructor(message, { status, code, result } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.result = result;
  }
}

async function request(path, { method = "GET", body, token } = {}, fallbackMessage = "Thao tác thất bại") {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Accept: "application/json", ...bearerHeader(token) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
  }
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) {
    const details = Array.isArray(data?.details) ? data.details.join("; ") : "";
    throw new ApiError(data?.message || details || `${fallbackMessage} (${res.status})`, {
      status: res.status,
      code: data?.code,
      result: data?.result,
    });
  }
  return data.result ?? data;
}

// ---------------------------------------------------------------- phụ huynh

export const apiGetParentProfile = (token) => request("/api/v1/parents/me", { token }, "Không thể tải hồ sơ phụ huynh");
export const apiSaveParentProfile = (payload, token) =>
  request("/api/v1/parents/me/profile", { method: "PUT", body: payload, token }, "Không thể lưu thông tin");

export const apiGetMyPostings = (token) => request("/api/v1/parent/postings", { token }, "Không thể tải tin đăng");
export const apiCreatePosting = (payload, token) =>
  request("/api/v1/parent/postings", { method: "POST", body: payload, token }, "Không thể đăng tin");
export const apiGetPostingApplicants = (postingId, token) =>
  request(`/api/v1/parent/postings/${postingId}/applicants`, { token }, "Không thể tải danh sách ứng viên");
export const apiCancelPosting = (postingId, reason, token) =>
  request(`/api/v1/parent/postings/${postingId}/cancel`, { method: "POST", body: { reason }, token }, "Không thể đóng tin");

// ---------------------------------------------------------------- phòng chat

export const apiGetRooms = (token) => request("/api/v1/chat/rooms", { token }, "Không thể tải danh sách trò chuyện");
export const apiOpenDirectRoom = (tutorId, token) =>
  request("/api/v1/chat/rooms/direct", { method: "POST", body: { tutorId: Number(tutorId) }, token }, "Không thể mở phòng chat");
export const apiOpenApplicationRoom = (applicationId, token) =>
  request("/api/v1/chat/rooms/application", { method: "POST", body: { applicationId }, token }, "Không thể mở phòng chat");
export const apiGetRoom = (roomId, token) => request(`/api/v1/chat/rooms/${roomId}`, { token }, "Không thể tải phòng chat");
export const apiGetMessages = (roomId, { before, limit = 30, token }) => {
  const query = new URLSearchParams({ limit: String(limit) });
  if (before) query.set("before", before);
  return request(`/api/v1/chat/rooms/${roomId}/messages?${query}`, { token }, "Không thể tải tin nhắn");
};
export const apiSendMessage = (roomId, text, token) =>
  request(`/api/v1/chat/rooms/${roomId}/messages`, { method: "POST", body: { text }, token }, "Không thể gửi tin nhắn");
export const apiCheckMessage = (roomId, text, token) =>
  request(`/api/v1/chat/rooms/${roomId}/messages/check`, { method: "POST", body: { text }, token }, "Không thể kiểm tra tin nhắn");
export const apiMarkRoomRead = (roomId, token) =>
  request(`/api/v1/chat/rooms/${roomId}/read`, { method: "POST", token }, "Không thể đánh dấu đã đọc");

// ---------------------------------------------------------------- đề xuất

export const apiGetProposals = (roomId, token) =>
  request(`/api/v1/chat/rooms/${roomId}/proposals`, { token }, "Không thể tải đề xuất");
export const apiCreateProposal = (roomId, payload, token) =>
  request(`/api/v1/chat/rooms/${roomId}/proposals`, { method: "POST", body: payload, token }, "Không thể gửi đề xuất");
export const apiGetStudentAccount = (proposalId, token) =>
  request(`/api/v1/chat/proposals/${proposalId}/student-account`, { token }, "Không thể tải tài khoản học sinh");
export const apiAcceptProposal = (proposalId, token) =>
  request(`/api/v1/chat/proposals/${proposalId}/accept`, { method: "POST", token }, "Không thể đồng ý đề xuất");
export const apiRejectProposal = (proposalId, reason, token) =>
  request(`/api/v1/chat/proposals/${proposalId}/reject`, { method: "POST", body: { reason }, token }, "Không thể từ chối đề xuất");
export const apiWithdrawProposal = (proposalId, reason, token) =>
  request(`/api/v1/chat/proposals/${proposalId}/withdraw`, { method: "POST", body: { reason }, token }, "Không thể rút đề xuất");

// ---------------------------------------------------------------- Lễ tân / Admin

export const apiStaffGetPostings = (token, status) =>
  request(`/api/v1/staff/chat/postings${status ? `?status=${status}` : ""}`, { token }, "Không thể tải tin đăng");
export const apiStaffApprovePosting = (id, token) =>
  request(`/api/v1/staff/chat/postings/${id}/approve`, { method: "POST", token }, "Không thể duyệt tin");
export const apiStaffRejectPosting = (id, reason, token) =>
  request(`/api/v1/staff/chat/postings/${id}/reject`, { method: "POST", body: { reason }, token }, "Không thể hủy tin");
export const apiStaffGetRooms = (token, { roomType, hasPending } = {}) => {
  const query = new URLSearchParams();
  if (roomType) query.set("roomType", roomType);
  if (hasPending) query.set("hasPending", "true");
  return request(`/api/v1/staff/chat/rooms?${query}`, { token }, "Không thể tải phòng chat");
};
export const apiStaffGetTranscript = (roomId, token) =>
  request(`/api/v1/staff/chat/rooms/${roomId}/transcript?limit=50`, { token }, "Không thể tải hội thoại");
export const apiStaffGetPiiEvents = (token, { type } = {}) =>
  request(`/api/v1/staff/chat/pii-events${type ? `?type=${type}` : ""}`, { token }, "Không thể tải log kiểm duyệt");
export const apiStaffReviewPiiEvent = (id, note, token) =>
  request(`/api/v1/staff/chat/pii-events/${id}/review`, { method: "POST", body: { note }, token }, "Không thể ghi nhận xem xét");
export const apiStaffGetTrialClasses = (token) =>
  request("/api/v1/staff/chat/trial-classes", { token }, "Không thể tải lớp dạy thử");
export const apiStaffCompleteClass = (classId, token) =>
  request(`/api/v1/staff/chat/classes/${classId}/complete`, { method: "POST", body: {}, token }, "Không thể xác nhận lớp");
export const apiStaffCancelTrialClass = (classId, reason, token) =>
  request(`/api/v1/staff/chat/classes/${classId}/cancel-trial`, { method: "POST", body: { reason }, token }, "Không thể hủy lớp");
export const apiStaffGetFeePolicies = (token) =>
  request("/api/v1/staff/chat/fee-policies", { token }, "Không thể tải cấu hình phí");
export const apiAdminAddFeePolicy = (classType, feePercentage, token) =>
  request("/api/v1/staff/chat/fee-policies", { method: "POST", body: { classType, feePercentage }, token }, "Không thể cập nhật phí");

// ---------------------------------------------------------------- realtime (SSE)

/**
 * Nhận sự kiện realtime từ backend bằng fetch streaming (EventSource không gửi được header Authorization).
 * Tự kết nối lại sau khi mất kết nối; mỗi lần kết nối lại gọi onReconnect để caller bắt kịp bằng REST.
 * @returns {() => void} hàm hủy
 */
export function subscribeChatEvents(token, { onEvent, onReconnect }) {
  let stopped = false;
  let controller = null;
  let first = true;

  async function connect() {
    while (!stopped) {
      controller = new AbortController();
      try {
        const res = await fetch(`${BASE}/api/v1/chat/stream`, {
          headers: { Accept: "text/event-stream", ...bearerHeader(token) },
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error(`stream ${res.status}`);
        if (!first) onReconnect?.();
        first = false;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (!stopped) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let index;
          while ((index = buffer.indexOf("\n\n")) >= 0) {
            const raw = buffer.slice(0, index);
            buffer = buffer.slice(index + 2);
            const event = parseSseBlock(raw);
            if (event && event.name !== "ready") onEvent?.(event);
          }
        }
      } catch {
        // mất kết nối hoặc bị hủy: thử lại phía dưới
      }
      if (!stopped) await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  connect();
  return () => {
    stopped = true;
    controller?.abort();
  };
}

function parseSseBlock(block) {
  let name = "message";
  const dataLines = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) name = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  if (dataLines.length === 0) return null;
  const text = dataLines.join("\n");
  try {
    return { name, data: JSON.parse(text) };
  } catch {
    return { name, data: text };
  }
}

// ---------------------------------------------------------------- nhãn hiển thị

export const PURPOSE_OPTIONS = [
  { value: "PHU_THONG", label: "Củng cố học phổ thông" },
  { value: "THI_CHUAN", label: "Luyện thi chứng chỉ (IELTS, TOEIC, VSTEP...)" },
  { value: "GIAO_TIEP", label: "Giao tiếp" },
  { value: "THI_HOC_KY", label: "Luyện thi học kỳ" },
];

export const purposeLabel = (value) => PURPOSE_OPTIONS.find((p) => p.value === value)?.label || "Chưa chọn";

export const CLASS_TYPE_LABEL = { SHORT_TERM: "Lớp ngắn hạn (1 tháng)", REGULAR: "Lớp thông thường" };
export const CLASS_MODE_LABEL = { ONLINE: "Online", AT_HOME: "Tại nhà" };
export const DAY_LABEL = { 1: "T2", 2: "T3", 3: "T4", 4: "T5", 5: "T6", 6: "T7", 7: "CN" };

export const PROPOSAL_STATUS = {
  PENDING: { label: "Chờ phản hồi", tone: "amber" },
  ACCEPTED: { label: "Đã đồng ý", tone: "emerald" },
  REJECTED: { label: "Đã từ chối", tone: "rose" },
  CANCELLED: { label: "Đã rút", tone: "rose" },
  EXPIRED: { label: "Hết hiệu lực", tone: "rose" },
};

export const formatVnd = (value) =>
  new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + " đ";

export const formatTime = (value) => (value ? String(value).slice(0, 5) : "");

export const initialsOf = (name) =>
  (name || "?").trim().split(/\s+/).slice(-2).map((w) => w[0]).join("").toUpperCase();
