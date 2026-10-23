/**
 * Danh sách số trang hiển thị quanh trang hiện tại (tối đa `windowSize` nút),
 * tránh render hàng trăm nút khi dữ liệu lớn. Trang bắt đầu từ 1.
 */
export function getPageWindow(currentPage, totalPages, windowSize = 5) {
  const size = Math.min(windowSize, totalPages);
  let start = Math.max(1, currentPage - Math.floor(size / 2));
  start = Math.min(start, totalPages - size + 1);
  return Array.from({ length: size }, (_, i) => start + i);
}
