package com.mycompany.englishtutor.module.matching.service;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.domain.UserRole;
import com.mycompany.englishtutor.module.user.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Tạo hoặc dùng lại tài khoản học sinh của một phụ huynh. Một học sinh (users + students) được tạo một lần
 * và có thể học nhiều lớp; dùng chung cho luồng Lễ tân và luồng đề xuất trong chat.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StudentAccountService {

    /** Mật khẩu mặc định cấp cho học sinh mới, học sinh bị ép đổi ở lần đăng nhập đầu. */
    public static final String DEFAULT_STUDENT_PASSWORD = "EnglishPath@123";

    JdbcTemplate jdbcTemplate;
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;

    public record StudentAccount(Long id, boolean created) {}

    /** Tìm học sinh của phụ huynh theo họ tên (không phân biệt hoa thường); chưa có thì tạo mới. */
    public StudentAccount ensureStudent(
            Long parentId, String studentName, String phone, String grade, String school, String learningGoal) {
        List<Long> existing = jdbcTemplate.queryForList(
                """
                SELECT s.id FROM students s
                JOIN users u ON u.id = s.id
                WHERE s.parent_id = ? AND LOWER(u.full_name) = LOWER(?)
                ORDER BY s.id LIMIT 1
                """,
                Long.class, parentId, studentName);
        if (!existing.isEmpty()) {
            return new StudentAccount(existing.get(0), false);
        }

        String baseUsername = "hs_" + phone.replaceAll("[^0-9]", "");
        String username = baseUsername;
        int suffix = 1;
        while (userRepository.existsByUsername(username)) {
            username = baseUsername + "_" + suffix++;
        }

        // Không lưu SĐT vào users.phone: cột này UNIQUE, trong khi anh chị em dùng chung SĐT phụ huynh
        // và số đó có thể trùng tài khoản khác. SĐT liên hệ của học sinh nằm ở parents.phone.
        User user = User.builder()
                .username(username)
                .fullName(studentName)
                .passwordHash(passwordEncoder.encode(DEFAULT_STUDENT_PASSWORD))
                .role(UserRole.STUDENT.name())
                .status("ACTIVE")
                .mustChangePassword(true)
                .build();
        user = userRepository.save(user);

        jdbcTemplate.update(
                """
                INSERT INTO students (id, parent_id, school, grade, learning_goal, elo)
                VALUES (?, ?, ?, ?, ?, 1000)
                """,
                user.getId(), parentId, school, grade, learningGoal);

        return new StudentAccount(user.getId(), true);
    }
}
