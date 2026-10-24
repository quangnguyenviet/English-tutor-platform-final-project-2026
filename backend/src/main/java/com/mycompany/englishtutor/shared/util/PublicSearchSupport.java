package com.mycompany.englishtutor.shared.util;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Tiện ích dùng chung cho các API tìm kiếm công khai (chuẩn hoá chuỗi, nhóm cấp lớp, giới hạn phân trang). */
public final class PublicSearchSupport {
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;

    /** Nhóm cấp lớp -> các cụm từ (đã bỏ dấu, chữ thường) xuất hiện trong dữ liệu cấp lớp. */
    private static final Map<String, List<String>> GRADE_GROUPS = Map.of(
            "tieuhoc", List.of("lop 1", "lop 2", "lop 3", "lop 4", "lop 5", "cap 1", "tieu hoc", "mam non"),
            "thcs", List.of("lop 6", "lop 7", "lop 8", "lop 9", "cap 2", "thcs"),
            "thpt", List.of("lop 10", "lop 11", "lop 12", "cap 3", "thpt", "dai hoc"),
            "nguoidilam", List.of("nguoi di lam", "tu do", "sinh vien"));

    private PublicSearchSupport() {}

    public static int clampPage(Integer page) {
        return page == null || page < 0 ? 0 : page;
    }

    public static int clampSize(Integer size) {
        if (size == null || size < 1) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(size, MAX_PAGE_SIZE);
    }

    /** Bỏ dấu, đổi đ -> d, chữ thường; trả về null nếu rỗng. */
    public static String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String result = Normalizer.normalize(value.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd')
                .replace('Đ', 'd')
                .toLowerCase(Locale.ROOT);
        return result.isBlank() ? null : result;
    }

    /** Escape ký tự đặc biệt của LIKE (dùng với ESCAPE '\'). */
    public static String likeContains(String normalized) {
        return "%" + normalized.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
    }

    /** Danh sách cụm từ của nhóm cấp lớp; rỗng nếu nhóm không hợp lệ hoặc không truyền. */
    public static List<String> gradePatterns(String gradeGroup) {
        if (gradeGroup == null) {
            return List.of();
        }
        return GRADE_GROUPS.getOrDefault(gradeGroup.trim().toLowerCase(Locale.ROOT), List.of());
    }

    /**
     * Rút gọn địa chỉ phụ huynh thành khu vực chung (2 phần cuối, ví dụ "Quận Cầu Giấy, Hà Nội")
     * để không lộ địa chỉ nhà cụ thể khi hiển thị công khai / cho gia sư.
     */
    public static String toGeneralLocation(String address) {
        if (address == null || address.isBlank()) {
            return null;
        }

        String[] parts = Arrays.stream(address.split(","))
                .map(String::trim)
                .filter(part -> !part.isBlank())
                .toArray(String[]::new);
        if (parts.length <= 2) {
            return String.join(", ", parts);
        }
        return String.join(", ", Arrays.copyOfRange(parts, parts.length - 2, parts.length));
    }
}
