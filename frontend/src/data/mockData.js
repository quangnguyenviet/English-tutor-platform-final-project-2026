// Mock Data Entry Point - Tổng hợp dữ liệu từ các file role-based trong ./mock/

export * from "./mock/tutorsData";
export * from "./mock/studentsData";
export * from "./mock/requestsData";
export * from "./mock/libraryData";
export * from "./mock/adminData";
export * from "./mock/receptionistData";
export * from "./mock/guestData";

import { students } from "./mock/studentsData";
import { classRequests } from "./mock/requestsData";
import { pathTemplates } from "./mock/libraryData";

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
