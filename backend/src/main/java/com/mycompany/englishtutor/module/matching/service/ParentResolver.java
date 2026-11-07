package com.mycompany.englishtutor.module.matching.service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import com.mycompany.englishtutor.shared.util.PublicSearchSupport;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Tìm hoặc tạo phụ huynh theo SĐT đã chuẩn hóa: mỗi SĐT là một phụ huynh ({@code uq_parents_phone}). */
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ParentResolver {

    JdbcTemplate jdbcTemplate;

    public record Parent(Long id, String fullName) {}

    public Optional<Parent> findByPhone(String phone) {
        return jdbcTemplate.query(
                        "SELECT id, full_name FROM parents WHERE phone = ?",
                        (rs, i) -> new Parent(rs.getLong("id"), rs.getString("full_name")),
                        phone)
                .stream()
                .findFirst();
    }

    /**
     * Trả phụ huynh của SĐT, chưa có thì tạo. Khi hai yêu cầu đồng thời cùng tạo, {@code ON CONFLICT}
     * để yêu cầu thua đọc lại bản ghi vừa có, nên nơi gọi vẫn phải so họ tên trên kết quả trả về.
     */
    public Parent resolve(String fullName, String phone) {
        return findByPhone(phone).orElseGet(() -> create(fullName, phone));
    }

    private Parent create(String fullName, String phone) {
        List<Long> created = jdbcTemplate.queryForList(
                "INSERT INTO parents (full_name, phone) VALUES (?, ?) ON CONFLICT (phone) DO NOTHING RETURNING id",
                Long.class, fullName, phone);
        if (!created.isEmpty()) {
            return new Parent(created.get(0), fullName);
        }
        return findByPhone(phone).orElseThrow();
    }

    /** Cùng một họ tên nếu chỉ khác chữ hoa/thường, khoảng trắng thừa hoặc dấu tiếng Việt. */
    public static boolean sameName(String first, String second) {
        return Objects.equals(comparableName(first), comparableName(second));
    }

    private static String comparableName(String name) {
        String normalized = PublicSearchSupport.normalize(name);
        return normalized == null ? null : normalized.replaceAll("\\s+", " ");
    }
}
