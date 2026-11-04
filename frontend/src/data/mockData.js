// Mock Data Entry Point - Tổng hợp dữ liệu từ các file role-based trong ./mock/
// (Kèm extension .js: Vite hỗ trợ cả hai dạng, node:test (Node ESM) bắt buộc extension)

export * from "./mock/tutorsData.js";
export * from "./mock/studentsData.js";
export * from "./mock/requestsData.js";
export * from "./mock/libraryData.js";
export * from "./mock/adminData.js";
export * from "./mock/receptionistData.js";
export * from "./mock/guestData.js";

import { students } from "./mock/studentsData.js";
import { classRequests } from "./mock/requestsData.js";
import { pathTemplates } from "./mock/libraryData.js";

// Helper functions cho toàn bộ ứng dụng
export function getStudentById(id) {
  return students.find((s) => s.id === id);
}

export function getClassRequestById(id) {
  return classRequests.find((r) => r.id === id);
}

export function getPathTemplateById(id) {
  return pathTemplates.find((t) => t.id === id);
}

/** Đếm usageCount thực tế dựa trên students có templateSource === templateId */
export function computeActualUsage(templateId) {
  return students.filter((s) => s.templateSource === templateId).length;
}
