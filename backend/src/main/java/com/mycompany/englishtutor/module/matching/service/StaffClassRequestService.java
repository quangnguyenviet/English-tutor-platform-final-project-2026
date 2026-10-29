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
import com.mycompany.englishtutor.module.matching.api.request.CancelClassRequest;
import com.mycompany.englishtutor.module.matching.api.request.CreateClassRequest;
import com.mycompany.englishtutor.module.matching.api.request.SelectTutorRequest;
import com.mycompany.englishtutor.module.matching.api.request.UpdateClassRequest;
import com.mycompany.englishtutor.module.matching.api.response.ClassApplicationResponse;
import com.mycompany.englishtutor.module.matching.api.response.ClassRequestDetailResponse;
import com.mycompany.englishtutor.module.matching.api.response.ClassRequestSummaryResponse;
import com.mycompany.englishtutor.module.matching.repository.StaffClassRequestQueryRepository;
import com.mycompany.englishtutor.module.payment.service.PaymentService;
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

/**
 * Nghiệp vụ Lễ tân/Admin quản lý lớp cần gia sư (UC-REC-02/03/04, UC-ADM-01/02/03).
 *
 * <p>Chỉ thao tác trên các lớp {@code requested_tutor_id IS NULL}. SQL đọc nằm ở
 * {@link StaffClassRequestQueryRepository}; service xử lý quyền, máy trạng thái, audit và thông báo.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StaffClassRequestService {

    JdbcTemplate jdbcTemplate;
    StaffClassRequestQueryRepository queryRepository;
    TutorRepository tutorRepository;
    UserRepository userRepository;
    AuditLogService auditLogService;
    PasswordEncoder passwordEncoder;
    PaymentService paymentService;

    // ------------------------------------------------------------------ READ

    @Transactional(readOnly = true)
    public PageResponse<ClassRequestSummaryResponse> getClassRequests(
            String tab, String keyword, String sort, Integer page, Integer size) {
        return queryRepository.findClassRequests(tab, keyword, sort, page, size);
    }

    @Transactional(readOnly = true)
    public ClassRequestDetailResponse getClassRequest(Long id) {
        return queryRepository.findDetailById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_REQUEST_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public List<ClassApplicationResponse> getApplications(Long id) {
        requireExists(id);
        return queryRepository.findApplications(id);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getTabCounts() {
        return queryRepository.getTabCounts();
    }

    // ----------------------------------------------------------------- WRITE

    @Transactional
    public ClassRequestDetailResponse create(CreateClassRequest request, HttpServletRequest httpRequest) {
        String cleanPhone = request.getPhone().replaceAll("[\\s.\\-()]", "");
        Long parentId = findOrCreateParent(request.getParentName().trim(), cleanPhone);
        Long studentId = findOrCreateStudent(
                parentId, request.getStudentName().trim(), cleanPhone, request.getGrade(), request.getSchool());

        Long currentUserId = getCurrentUserId();
        Long classRequestId = jdbcTemplate.queryForObject(
                """
                INSERT INTO class_requests (
                    parent_id, requested_tutor_id, student_id, class_requirement,
                    teaching_mode, price_per_session, preferred_schedule, tutor_requirement,
                    fee_percentage,
                    status, created_by
                ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, COALESCE(?, 40), 'NEW', ?) RETURNING id
                """,
                Long.class,
                parentId,
                studentId,
                request.getClassRequirement().trim(),
                request.getTeachingMode(),
                request.getPricePerSession(),
                request.getPreferredSchedule(),
                request.getTutorRequirement(),
                request.getFeePercentage(),
                currentUserId);

        auditLogService.log(
                currentUserId,
                "CREATE_CLASS_REQUEST",
                "CLASS_REQUEST",
                classRequestId,
                Map.of(
                        "parentName", request.getParentName(),
                        "studentName", request.getStudentName(),
                        "classRequirement", request.getClassRequirement()),
                httpRequest);

        return getClassRequest(classRequestId);
    }

    @Transactional
    public ClassRequestDetailResponse update(Long id, UpdateClassRequest request, HttpServletRequest httpRequest) {
        Map<String, Object> row = lockRequest(id);
        if (!"NEW".equalsIgnoreCase((String) row.get("status"))) {
            throw new AppException(ErrorCode.CLASS_REQUEST_NOT_NEW);
        }

        Long studentId = row.get("student_id") == null ? null : ((Number) row.get("student_id")).longValue();
        if (studentId == null && request.getStudentName() != null && !request.getStudentName().isBlank()) {
            Long parentId = ((Number) row.get("parent_id")).longValue();
            Map<String, Object> parent = jdbcTemplate.queryForMap(
                    "SELECT phone FROM parents WHERE id = ?", parentId);
            studentId = findOrCreateStudent(
                    parentId, request.getStudentName().trim(), (String) parent.get("phone"),
                    request.getGrade(), request.getSchool());
            jdbcTemplate.update("UPDATE class_requests SET student_id = ? WHERE id = ?", studentId, id);
        } else if (studentId != null) {
            updateStudentInfo(studentId, request);
        }

        jdbcTemplate.update(
                """
                UPDATE class_requests SET
                    class_requirement  = COALESCE(?, class_requirement),
                    teaching_mode      = COALESCE(?, teaching_mode),
                    price_per_session  = COALESCE(?, price_per_session),
                    preferred_schedule = COALESCE(?, preferred_schedule),
                    tutor_requirement  = COALESCE(?, tutor_requirement),
                    fee_percentage     = COALESCE(?, fee_percentage),
                    updated_at         = NOW()
                WHERE id = ?
                """,
                trimToNull(request.getClassRequirement()),
                request.getTeachingMode(),
                request.getPricePerSession(),
                trimToNull(request.getPreferredSchedule()),
                trimToNull(request.getTutorRequirement()),
                request.getFeePercentage(),
                id);

        auditLogService.log(getCurrentUserId(), "UPDATE_CLASS_REQUEST", "CLASS_REQUEST", id, null, httpRequest);
        return getClassRequest(id);
    }

    @Transactional
    public ClassRequestDetailResponse publish(Long id, HttpServletRequest httpRequest) {
        Map<String, Object> row = lockRequest(id);
        if (!"NEW".equalsIgnoreCase((String) row.get("status"))) {
            throw new AppException(ErrorCode.CLASS_REQUEST_NOT_NEW);
        }
        boolean ready = row.get("student_id") != null
                && notBlank(row.get("class_requirement"))
                && notBlank(row.get("teaching_mode"))
                && row.get("price_per_session") != null;
        if (!ready) {
            throw new AppException(ErrorCode.CLASS_REQUEST_NOT_READY);
        }

        Long currentUserId = getCurrentUserId();
        jdbcTemplate.update(
                "UPDATE class_requests SET status = 'OPEN', handled_by = ?, updated_at = NOW() WHERE id = ?",
                currentUserId, id);

        auditLogService.log(currentUserId, "PUBLISH_CLASS_REQUEST", "CLASS_REQUEST", id,
                Map.of("status", "OPEN"), httpRequest);
        return getClassRequest(id);
    }

    @Transactional
    public ClassRequestDetailResponse selectTutor(Long id, SelectTutorRequest request, HttpServletRequest httpRequest) {
        Map<String, Object> row = lockRequest(id);
        if (!"OPEN".equalsIgnoreCase((String) row.get("status"))) {
            throw new AppException(ErrorCode.CLASS_REQUEST_NOT_OPEN);
        }

        List<Map<String, Object>> apps = jdbcTemplate.queryForList(
                "SELECT id, tutor_id, status, class_request_id FROM class_applications WHERE id = ? FOR UPDATE",
                request.getApplicationId());
        if (apps.isEmpty()) {
            throw new AppException(ErrorCode.APPLICATION_NOT_FOUND);
        }
        Map<String, Object> app = apps.get(0);
        if (!id.equals(((Number) app.get("class_request_id")).longValue())) {
            throw new AppException(ErrorCode.APPLICATION_NOT_IN_REQUEST);
        }
        if (!"APPLIED".equalsIgnoreCase((String) app.get("status"))) {
            throw new AppException(ErrorCode.APPLICATION_NOT_WITHDRAWABLE);
        }

        Long tutorId = ((Number) app.get("tutor_id")).longValue();
        tutorRepository.findPublicByIdAndProfileStatus(tutorId, ProfileStatus.ACTIVE.name())
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_ACTIVE));

        Long studentId = ((Number) row.get("student_id")).longValue();
        String className = (String) row.get("class_requirement");
        String teachingMode = (String) row.get("teaching_mode");
        BigDecimal price = (BigDecimal) row.get("price_per_session");
        BigDecimal feePercentage = row.get("fee_percentage") != null
                ? new BigDecimal(row.get("fee_percentage").toString())
                : null;

        // Chọn đơn này, loại các đơn còn lại.
        jdbcTemplate.update(
                "UPDATE class_applications SET status = 'SELECTED' WHERE id = ?", request.getApplicationId());
        jdbcTemplate.update(
                "UPDATE class_applications SET status = 'REJECTED' WHERE class_request_id = ? AND id <> ? AND status = 'APPLIED'",
                id, request.getApplicationId());

        Long currentUserId = getCurrentUserId();
        // Gán gia sư được chọn để lớp đồng thời trở thành một "Đơn ghép lớp" (hiện ở
        // trang Quản lý đơn ghép lớp, tab "Đang dạy thử"). Lớp vẫn ở lại trang Lớp cần
        // gia sư (tab "Đã xử lý") nhờ bộ lọc dựa trên lịch sử đơn ứng tuyển.
        jdbcTemplate.update(
                "UPDATE class_requests SET status = 'MATCHED', requested_tutor_id = ?, handled_by = ?, updated_at = NOW() WHERE id = ?",
                tutorId, currentUserId, id);

        Long classId = jdbcTemplate.queryForObject(
                """
                INSERT INTO classes (class_request_id, tutor_id, student_id, class_name, status, teaching_mode, price_per_session)
                VALUES (?, ?, ?, ?, 'TRIAL', ?, ?) RETURNING id
                """,
                Long.class,
                id, tutorId, studentId, className, teachingMode, price);

        auditLogService.log(currentUserId, "SELECT_TUTOR_CLASS_REQUEST", "CLASS_REQUEST", id,
                Map.of("applicationId", request.getApplicationId(), "tutorId", tutorId, "classId", classId),
                httpRequest);

        // Snapshot phí nhận lớp ngay khi ghép (kế hoạch mục 4.1.2): payment NEW, amount NULL.
        paymentService.createDraftForClass(classId, feePercentage, price);

        notifySelectedTutor(tutorId, classId, className);
        notifyRejectedTutors(id, request.getApplicationId());

        return getClassRequest(id);
    }

    @Transactional
    public void cancel(Long id, CancelClassRequest request, HttpServletRequest httpRequest) {
        Map<String, Object> row = lockRequest(id);
        if ("CANCELLED".equalsIgnoreCase((String) row.get("status"))) {
            throw new AppException(ErrorCode.CLASS_REQUEST_ALREADY_CANCELLED);
        }

        String reason = request.getReason().trim();
        Long currentUserId = getCurrentUserId();

        // Hủy bản nháp phí NEW của các lớp TRIAL (kế hoạch mục 4.1.2, 5.1).
        List<Long> classIds = jdbcTemplate.queryForList(
                "SELECT id FROM classes WHERE class_request_id = ? AND status = 'TRIAL'",
                Long.class, id);
        for (Long classId : classIds) {
            paymentService.cancelDraftPayment(classId);
        }

        jdbcTemplate.update(
                "UPDATE class_requests SET status = 'CANCELLED', cancel_reason = ?, handled_by = ?, updated_at = NOW() WHERE id = ?",
                reason, currentUserId, id);
        jdbcTemplate.update(
                "UPDATE classes SET status = 'CANCELLED', updated_at = NOW() WHERE class_request_id = ? AND status != 'CANCELLED'",
                id);

        notifyApplicantsCancelled(id, reason);

        auditLogService.log(currentUserId, "CANCEL_CLASS_REQUEST", "CLASS_REQUEST", id,
                Map.of("reason", reason), httpRequest);
    }

    // ---------------------------------------------------------------- HELPER

    private Map<String, Object> lockRequest(Long id) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                SELECT id, parent_id, student_id, class_requirement, teaching_mode,
                       price_per_session, fee_percentage, status
                FROM class_requests
                WHERE id = ? AND requested_tutor_id IS NULL
                FOR UPDATE
                """,
                id);
        if (rows.isEmpty()) {
            throw new AppException(ErrorCode.CLASS_REQUEST_NOT_FOUND);
        }
        return rows.get(0);
    }

    private void requireExists(Long id) {
        Integer exists = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM class_requests cr
                WHERE cr.id = ?
                  AND (cr.requested_tutor_id IS NULL
                       OR EXISTS (SELECT 1 FROM class_applications cax WHERE cax.class_request_id = cr.id))
                """,
                Integer.class, id);
        if (exists == null || exists == 0) {
            throw new AppException(ErrorCode.CLASS_REQUEST_NOT_FOUND);
        }
    }

    private void updateStudentInfo(Long studentId, UpdateClassRequest request) {
        if (request.getStudentName() != null && !request.getStudentName().isBlank()) {
            jdbcTemplate.update("UPDATE users SET full_name = ? WHERE id = ?", request.getStudentName().trim(), studentId);
        }
        jdbcTemplate.update(
                "UPDATE students SET grade = COALESCE(?, grade), school = COALESCE(?, school), updated_at = NOW() WHERE id = ?",
                trimToNull(request.getGrade()), trimToNull(request.getSchool()), studentId);
    }

    private Long findOrCreateParent(String fullName, String phone) {
        List<Long> existing = jdbcTemplate.queryForList(
                "SELECT id FROM parents WHERE phone = ? ORDER BY id LIMIT 1", Long.class, phone);
        if (!existing.isEmpty()) {
            return existing.get(0);
        }
        return jdbcTemplate.queryForObject(
                "INSERT INTO parents (full_name, phone) VALUES (?, ?) RETURNING id", Long.class, fullName, phone);
    }

    private Long findOrCreateStudent(Long parentId, String studentName, String phone, String grade, String school) {
        List<Long> existing = jdbcTemplate.queryForList(
                """
                SELECT s.id FROM students s
                JOIN users u ON u.id = s.id
                WHERE s.parent_id = ? AND LOWER(u.full_name) = LOWER(?)
                ORDER BY s.id LIMIT 1
                """,
                Long.class, parentId, studentName);
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
                "INSERT INTO students (id, parent_id, school, grade, elo) VALUES (?, ?, ?, ?, 1000)",
                user.getId(), parentId, school, grade);
        return user.getId();
    }

    private Long getCurrentUserId() {
        var context = SecurityContextHolder.getContext();
        if (context == null || context.getAuthentication() == null) {
            return null;
        }
        return userRepository.findByUsername(context.getAuthentication().getName())
                .map(User::getId)
                .orElse(null);
    }

    private void notifySelectedTutor(Long tutorId, Long classId, String className) {
        jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                VALUES (?, 'Bạn đã được chọn cho lớp cần gia sư', ?, 'CLASS', ?)
                """,
                tutorId,
                "Chúc mừng! Bạn đã được chọn dạy lớp: " + safe(className)
                        + ". Lớp dạy thử đã được tạo, vui lòng liên hệ phụ huynh để sắp xếp lịch học thử.",
                classId);
    }

    private void notifyRejectedTutors(Long classRequestId, Long selectedApplicationId) {
        jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                SELECT tutor_id, 'Kết quả ứng tuyển lớp', ?, 'CLASS_REQUEST', ?
                FROM class_applications
                WHERE class_request_id = ? AND id <> ? AND status = 'REJECTED'
                """,
                "Lớp bạn ứng tuyển đã chọn được gia sư khác. Cảm ơn bạn đã quan tâm, hẹn gặp lại ở các lớp tiếp theo.",
                classRequestId,
                classRequestId,
                selectedApplicationId);
    }

    private void notifyApplicantsCancelled(Long classRequestId, String reason) {
        jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                SELECT tutor_id, 'Lớp cần gia sư đã bị hủy', ?, 'CLASS_REQUEST', ?
                FROM class_applications
                WHERE class_request_id = ? AND status = 'APPLIED'
                """,
                "Lớp bạn ứng tuyển đã bị hủy. Lý do: " + safe(reason),
                classRequestId,
                classRequestId);
    }

    private static boolean notBlank(Object value) {
        return value != null && !value.toString().isBlank();
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }
}
