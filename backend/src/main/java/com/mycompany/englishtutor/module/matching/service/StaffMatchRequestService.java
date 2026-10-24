package com.mycompany.englishtutor.module.matching.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.matching.api.request.CancelMatchRequest;
import com.mycompany.englishtutor.module.matching.api.request.CreateMatchRequest;
import com.mycompany.englishtutor.module.matching.api.response.MatchRequestDetailResponse;
import com.mycompany.englishtutor.module.matching.api.response.MatchRequestSummaryResponse;
import com.mycompany.englishtutor.module.matching.repository.StaffMatchRequestQueryRepository;
import com.mycompany.englishtutor.module.tutor.domain.enums.ProfileStatus;
import com.mycompany.englishtutor.module.tutor.repository.TutorRepository;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.domain.UserRole;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.api.PageResponse;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import jakarta.servlet.http.HttpServletRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StaffMatchRequestService {

    JdbcTemplate jdbcTemplate;
    StaffMatchRequestQueryRepository queryRepository;
    TutorRepository tutorRepository;
    UserRepository userRepository;
    AuditLogService auditLogService;
    PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public PageResponse<MatchRequestSummaryResponse> getMatchRequests(
            String tab, String keyword, Integer page, Integer size) {
        return queryRepository.findMatchRequests(tab, keyword, page, size);
    }

    @Transactional(readOnly = true)
    public MatchRequestDetailResponse getMatchRequest(Long id) {
        return queryRepository.findDetailById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_REQUEST_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getTabCounts() {
        return queryRepository.getTabCounts();
    }

    @Transactional
    public MatchRequestDetailResponse createMatchRequest(CreateMatchRequest request, HttpServletRequest httpRequest) {
        Long tutorId = request.getTutorId();
        tutorRepository.findPublicByIdAndProfileStatus(tutorId, ProfileStatus.ACTIVE.name())
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_ACTIVE));

        String cleanPhone = request.getPhone().replaceAll("[\\s.\\-()]", "");
        Long parentId = findOrCreateParent(request.getParentName().trim(), cleanPhone);
        Long studentId = findOrCreateStudent(parentId, request.getStudentName().trim(), cleanPhone, request.getGrade(), request.getSchool());

        Long currentUserId = getCurrentUserId();

        Long classRequestId = jdbcTemplate.queryForObject(
                """
                INSERT INTO class_requests (
                    parent_id,
                    requested_tutor_id,
                    student_id,
                    class_requirement,
                    teaching_mode,
                    price_per_session,
                    preferred_schedule,
                    tutor_requirement,
                    status,
                    created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'NEW', ?) RETURNING id
                """,
                Long.class,
                parentId,
                tutorId,
                studentId,
                request.getClassName().trim(),
                request.getTeachingMode(),
                request.getPricePerSession(),
                request.getPreferredSchedule(),
                request.getNotes(),
                currentUserId
        );

        auditLogService.log(
                currentUserId,
                "CREATE_MATCH_REQUEST",
                "CLASS_REQUEST",
                classRequestId,
                Map.of(
                        "parentName", request.getParentName(),
                        "studentName", request.getStudentName(),
                        "tutorId", tutorId,
                        "className", request.getClassName()
                ),
                httpRequest
        );

        notifyReceptionists(classRequestId, request.getParentName().trim(), tutorId);

        return getMatchRequest(classRequestId);
    }

    @Transactional
    public MatchRequestDetailResponse confirmMatchRequest(Long id, HttpServletRequest httpRequest) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                SELECT id, parent_id, requested_tutor_id, student_id, class_requirement,
                       teaching_mode, price_per_session, status
                FROM class_requests
                WHERE id = ? FOR UPDATE
                """,
                id
        );

        if (rows.isEmpty()) {
            throw new AppException(ErrorCode.CLASS_REQUEST_NOT_FOUND);
        }

        Map<String, Object> cr = rows.get(0);
        String status = (String) cr.get("status");
        if (!"NEW".equalsIgnoreCase(status)) {
            throw new AppException(ErrorCode.MATCH_REQUEST_NOT_PENDING);
        }

        Long tutorId = ((Number) cr.get("requested_tutor_id")).longValue();
        tutorRepository.findPublicByIdAndProfileStatus(tutorId, ProfileStatus.ACTIVE.name())
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_ACTIVE));

        Long parentId = ((Number) cr.get("parent_id")).longValue();
        Long studentId = cr.get("student_id") != null ? ((Number) cr.get("student_id")).longValue() : null;

        if (studentId == null) {
            Map<String, Object> parentInfo = jdbcTemplate.queryForMap(
                    "SELECT full_name, phone FROM parents WHERE id = ?", parentId);
            String pName = (String) parentInfo.get("full_name");
            String pPhone = (String) parentInfo.get("phone");
            studentId = findOrCreateStudent(parentId, "Học viên (con " + pName + ")", pPhone, null, null);
            jdbcTemplate.update("UPDATE class_requests SET student_id = ? WHERE id = ?", studentId, id);
        }

        String className = (String) cr.get("class_requirement");
        if (className == null || className.isBlank()) {
            className = "Tiếng Anh học thử 1 kèm 1";
            jdbcTemplate.update("UPDATE class_requests SET class_requirement = ? WHERE id = ?", className, id);
        }

        String teachingMode = (String) cr.get("teaching_mode");
        if (teachingMode == null || teachingMode.isBlank()) {
            teachingMode = "ONLINE";
            jdbcTemplate.update("UPDATE class_requests SET teaching_mode = ? WHERE id = ?", teachingMode, id);
        }

        BigDecimal price = (BigDecimal) cr.get("price_per_session");

        Long currentUserId = getCurrentUserId();
        jdbcTemplate.update(
                "UPDATE class_requests SET status = 'MATCHED', handled_by = ?, updated_at = NOW() WHERE id = ?",
                currentUserId, id
        );

        Long classId = jdbcTemplate.queryForObject(
                """
                INSERT INTO classes (
                    class_request_id,
                    tutor_id,
                    student_id,
                    class_name,
                    status,
                    teaching_mode,
                    price_per_session
                ) VALUES (?, ?, ?, ?, 'TRIAL', ?, ?) RETURNING id
                """,
                Long.class,
                id,
                tutorId,
                studentId,
                className,
                teachingMode,
                price
        );

        auditLogService.log(
                currentUserId,
                "APPROVE_MATCH_REQUEST",
                "CLASS_REQUEST",
                id,
                Map.of("classId", classId, "tutorId", tutorId, "status", "TRIAL"),
                httpRequest
        );

        notifyTutorNewTrialClass(tutorId, classId, className);

        return getMatchRequest(id);
    }

    @Transactional
    public MatchRequestDetailResponse completeMatchRequest(Long id, HttpServletRequest httpRequest) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id, status FROM class_requests WHERE id = ? FOR UPDATE", id);
        if (rows.isEmpty()) {
            throw new AppException(ErrorCode.CLASS_REQUEST_NOT_FOUND);
        }

        String crStatus = (String) rows.get(0).get("status");
        if ("CANCELLED".equalsIgnoreCase(crStatus)) {
            throw new AppException(ErrorCode.CLASS_REQUEST_ALREADY_CANCELLED);
        }

        List<Map<String, Object>> classRows = jdbcTemplate.queryForList(
                """
                SELECT id, tutor_id, student_id, class_name, status
                FROM classes
                WHERE class_request_id = ?
                ORDER BY id DESC LIMIT 1
                FOR UPDATE
                """,
                id
        );

        if (classRows.isEmpty() || !"TRIAL".equalsIgnoreCase((String) classRows.get(0).get("status"))) {
            throw new AppException(ErrorCode.MATCH_REQUEST_NOT_TRIAL);
        }

        Map<String, Object> cl = classRows.get(0);
        Long classId = ((Number) cl.get("id")).longValue();
        Long tutorId = ((Number) cl.get("tutor_id")).longValue();
        String className = (String) cl.get("class_name");

        Long currentUserId = getCurrentUserId();

        jdbcTemplate.update(
                "UPDATE classes SET status = 'ACTIVE', active_from = COALESCE(active_from, CURRENT_DATE), updated_at = NOW() WHERE id = ?",
                classId
        );

        jdbcTemplate.update(
                "UPDATE class_requests SET updated_at = NOW(), handled_by = COALESCE(handled_by, ?) WHERE id = ?",
                currentUserId, id
        );

        auditLogService.log(
                currentUserId,
                "COMPLETE_MATCH_REQUEST",
                "CLASS_REQUEST",
                id,
                Map.of("classId", classId, "tutorId", tutorId, "status", "ACTIVE"),
                httpRequest
        );

        notifyTutorMatchSuccess(tutorId, classId, className);

        return getMatchRequest(id);
    }

    @Transactional
    public void cancelMatchRequest(Long id, CancelMatchRequest request, HttpServletRequest httpRequest) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id, status FROM class_requests WHERE id = ? FOR UPDATE", id);
        if (rows.isEmpty()) {
            throw new AppException(ErrorCode.CLASS_REQUEST_NOT_FOUND);
        }

        String status = (String) rows.get(0).get("status");
        if ("CANCELLED".equalsIgnoreCase(status)) {
            throw new AppException(ErrorCode.CLASS_REQUEST_ALREADY_CANCELLED);
        }

        Long currentUserId = getCurrentUserId();
        jdbcTemplate.update(
                "UPDATE class_requests SET status = 'CANCELLED', cancel_reason = ?, handled_by = ?, updated_at = NOW() WHERE id = ?",
                request.getReason().trim(), currentUserId, id
        );

        jdbcTemplate.update(
                "UPDATE classes SET status = 'CANCELLED', updated_at = NOW() WHERE class_request_id = ? AND status != 'CANCELLED'",
                id
        );

        auditLogService.log(
                currentUserId,
                "CANCEL_MATCH_REQUEST",
                "CLASS_REQUEST",
                id,
                Map.of("reason", request.getReason().trim()),
                httpRequest
        );
    }

    private Long findOrCreateParent(String fullName, String phone) {
        List<Long> existing = jdbcTemplate.queryForList(
                "SELECT id FROM parents WHERE phone = ? ORDER BY id LIMIT 1", Long.class, phone);
        if (!existing.isEmpty()) {
            return existing.get(0);
        }
        return jdbcTemplate.queryForObject(
                "INSERT INTO parents (full_name, phone) VALUES (?, ?) RETURNING id",
                Long.class, fullName, phone
        );
    }

    private Long findOrCreateStudent(Long parentId, String studentName, String phone, String grade, String school) {
        List<Long> existing = jdbcTemplate.queryForList(
                """
                SELECT s.id FROM students s
                JOIN users u ON u.id = s.id
                WHERE s.parent_id = ? AND LOWER(u.full_name) = LOWER(?)
                ORDER BY s.id LIMIT 1
                """,
                Long.class, parentId, studentName
        );
        if (!existing.isEmpty()) {
            return existing.get(0);
        }

        String baseUsername = "hs_" + phone.replaceAll("[^0-9]", "");
        String username = baseUsername;
        int suffix = 1;
        while (userRepository.existsByUsername(username)) {
            username = baseUsername + "_" + suffix++;
        }

        User user = User.builder()
                .username(username)
                .fullName(studentName)
                .phone(phone)
                .passwordHash(passwordEncoder.encode("EnglishPath@123"))
                .role(UserRole.STUDENT.name())
                .status("ACTIVE")
                .mustChangePassword(true)
                .build();
        user = userRepository.save(user);

        jdbcTemplate.update(
                """
                INSERT INTO students (id, parent_id, school, grade, elo)
                VALUES (?, ?, ?, ?, 1000)
                """,
                user.getId(), parentId, school, grade
        );

        return user.getId();
    }

    private Long getCurrentUserId() {
        var context = SecurityContextHolder.getContext();
        if (context == null || context.getAuthentication() == null) {
            return null;
        }
        String name = context.getAuthentication().getName();
        return userRepository.findByUsername(name).map(User::getId).orElse(null);
    }

    private void notifyReceptionists(long classRequestId, String parentName, Long tutorId) {
        String title = "Yêu cầu đăng ký học với gia sư chỉ định mới";
        jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                SELECT id, ?, ?, 'CLASS_REQUEST', ? FROM users WHERE role = 'RECEPTIONIST' AND status = 'ACTIVE'
                """,
                title,
                "Phụ huynh " + parentName + " vừa đăng ký học với gia sư, cần liên hệ xác nhận trong 12 giờ.",
                classRequestId
        );
    }

    private void notifyTutorNewTrialClass(Long tutorId, Long classId, String className) {
        jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                VALUES (?, 'Lớp dạy thử mới được ghép', ?, 'CLASS', ?)
                """,
                tutorId,
                "Bạn đã được ghép lớp dạy thử: " + className + ". Vui lòng liên hệ phụ huynh để sắp xếp lịch học thử.",
                classId
        );
    }

    private void notifyTutorMatchSuccess(Long tutorId, Long classId, String className) {
        jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                VALUES (?, 'Ghép lớp thành công', ?, 'CLASS', ?)
                """,
                tutorId,
                "Lớp học " + (className != null ? className : "") + " đã hoàn tất dạy thử và chính thức bắt đầu giảng dạy.",
                classId
        );
    }
}
