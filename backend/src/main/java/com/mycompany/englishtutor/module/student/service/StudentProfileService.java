package com.mycompany.englishtutor.module.student.service;

import java.time.LocalDate;
import java.util.List;
import java.util.regex.Pattern;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.student.api.StudentProfileDtos.StudentProfileRequest;
import com.mycompany.englishtutor.module.student.api.StudentProfileDtos.StudentProfileResponse;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;
import com.mycompany.englishtutor.shared.util.PhoneNumbers;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

/** Trang cá nhân: học sinh xem và sửa thông tin của chính mình. */
@Service
@RequiredArgsConstructor
public class StudentProfileService {

    private static final Pattern VN_PHONE = Pattern.compile("^0[35789]\\d{8}$");

    private final JdbcTemplate jdbcTemplate;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public StudentProfileResponse getMyProfile() {
        return find(currentStudentId());
    }

    @Transactional
    public StudentProfileResponse updateMyProfile(StudentProfileRequest request, HttpServletRequest http) {
        Long studentId = currentStudentId();
        String email = blankToNull(request.email());
        if (email != null && exists("SELECT COUNT(*) FROM users WHERE LOWER(email) = LOWER(?) AND id <> ?", email, studentId)) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }
        String phone = blankToNull(PhoneNumbers.normalize(request.phone()));
        if (phone != null && !VN_PHONE.matcher(phone).matches()) {
            throw new AppException(ErrorCode.CHAT_INVALID_PHONE);
        }
        if (phone != null && exists("SELECT COUNT(*) FROM users WHERE phone = ? AND id <> ?", phone, studentId)) {
            throw new AppException(ErrorCode.PHONE_EXISTED);
        }
        try {
            jdbcTemplate.update(
                    """
                    UPDATE users SET full_name = ?, date_of_birth = ?, gender = ?, email = ?, phone = ?, updated_at = NOW()
                    WHERE id = ?
                    """,
                    request.fullName().strip(), request.dateOfBirth(), request.gender(), email, phone, studentId);
        } catch (DuplicateKeyException e) {
            // Hai yêu cầu đồng thời cùng lấy một email/SĐT: ràng buộc UNIQUE chặn lại.
            throw new AppException(ErrorCode.USER_EXISTED);
        }
        jdbcTemplate.update(
                "UPDATE students SET school = ?, grade = ?, learning_goal = ?, updated_at = NOW() WHERE id = ?",
                blankToNull(request.school()), blankToNull(request.grade()), blankToNull(request.learningGoal()), studentId);
        auditLogService.log(studentId, "UPDATE_STUDENT_PROFILE", "STUDENT", studentId, null, http);
        return find(studentId);
    }

    private StudentProfileResponse find(Long studentId) {
        List<StudentProfileResponse> rows = jdbcTemplate.query(
                """
                SELECT u.username, u.full_name, u.date_of_birth, u.gender, u.email, u.phone,
                       s.school, s.grade, s.learning_goal, p.full_name AS parent_name, p.phone AS parent_phone
                FROM students s
                JOIN users u ON u.id = s.id
                JOIN parents p ON p.id = s.parent_id
                WHERE s.id = ?
                """,
                (rs, i) -> new StudentProfileResponse(
                        rs.getString("username"), rs.getString("full_name"),
                        rs.getObject("date_of_birth", LocalDate.class), rs.getString("gender"), rs.getString("email"),
                        rs.getString("phone"), rs.getString("school"), rs.getString("grade"),
                        rs.getString("learning_goal"), rs.getString("parent_name"), rs.getString("parent_phone")),
                studentId);
        if (rows.isEmpty()) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }
        return rows.get(0);
    }

    private boolean exists(String sql, Object... args) {
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, args);
        return count != null && count > 0;
    }

    private Long currentStudentId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .map(User::getId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
