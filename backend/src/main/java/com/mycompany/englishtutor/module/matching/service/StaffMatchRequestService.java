package com.mycompany.englishtutor.module.matching.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.matching.api.request.CancelMatchRequest;
import com.mycompany.englishtutor.module.matching.api.request.CompleteMatchRequest;
import com.mycompany.englishtutor.module.matching.api.request.CreateMatchRequest;
import com.mycompany.englishtutor.module.matching.api.request.RematchMatchRequest;
import com.mycompany.englishtutor.module.matching.api.request.UpdateMatchRequest;
import com.mycompany.englishtutor.module.matching.api.response.MatchRequestDetailResponse;
import com.mycompany.englishtutor.module.matching.api.response.MatchRequestSummaryResponse;
import com.mycompany.englishtutor.module.matching.repository.StaffMatchRequestQueryRepository;
import com.mycompany.englishtutor.module.matching.service.MatchingLifecycleSupport.ClassSnapshot;
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

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StaffMatchRequestService {

    /** Mật khẩu mặc định cấp cho học sinh mới — học sinh bị ép đổi ở lần đăng nhập đầu. */
    static final String DEFAULT_STUDENT_PASSWORD = "EnglishPath@123";

    JdbcTemplate jdbcTemplate;
    StaffMatchRequestQueryRepository queryRepository;
    TutorRepository tutorRepository;
    UserRepository userRepository;
    AuditLogService auditLogService;
    PasswordEncoder passwordEncoder;
    PaymentService paymentService;
    MatchingLifecycleSupport lifecycle;

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
                    fee_percentage,
                    status,
                    created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, 40), 'NEW', ?) RETURNING id
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
                request.getFeePercentage(),
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
                       teaching_mode, price_per_session, fee_percentage, status,
                       student_name, student_grade, student_school, student_learning_goal
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

        // Phụ huynh chưa có tài khoản: học sinh chưa tồn tại, lễ tân đã nhập thông tin vào đơn (PUT) —
        // chuyển dạy thử thì hệ thống tự tạo tài khoản học sinh từ thông tin đó.
        String initialPassword = null;
        if (studentId == null) {
            String pendingName = trimToNull((String) cr.get("student_name"));
            if (pendingName == null) {
                throw new AppException(ErrorCode.STUDENT_INFO_REQUIRED);
            }
            String parentPhone = jdbcTemplate.queryForObject(
                    "SELECT phone FROM parents WHERE id = ?", String.class, parentId);
            StudentAccount account = ensureStudent(
                    parentId,
                    pendingName,
                    parentPhone,
                    (String) cr.get("student_grade"),
                    (String) cr.get("student_school"),
                    (String) cr.get("student_learning_goal"));
            studentId = account.id();
            if (account.created()) {
                initialPassword = DEFAULT_STUDENT_PASSWORD;
            }
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
        BigDecimal feePercentage = cr.get("fee_percentage") != null
                ? new BigDecimal(cr.get("fee_percentage").toString())
                : null;

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

        // Snapshot phí nhận lớp ngay khi ghép (mục 4.1.2): payment NEW, amount NULL.
        paymentService.createDraftForClass(classId, feePercentage, price);

        notifyTutorNewTrialClass(tutorId, classId, className);

        MatchRequestDetailResponse detail = getMatchRequest(id);
        // Chỉ trả mật khẩu mặc định đúng lần tạo tài khoản mới để lễ tân bàn giao cho gia đình
        detail.setInitialPassword(initialPassword);
        return detail;
    }

    @Transactional
    public MatchRequestDetailResponse completeMatchRequest(
            Long id, CompleteMatchRequest body, HttpServletRequest httpRequest) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id, status, fee_percentage FROM class_requests WHERE id = ? FOR UPDATE", id);
        if (rows.isEmpty()) {
            throw new AppException(ErrorCode.CLASS_REQUEST_NOT_FOUND);
        }

        String crStatus = (String) rows.get(0).get("status");
        if ("CANCELLED".equalsIgnoreCase(crStatus)) {
            throw new AppException(ErrorCode.CLASS_REQUEST_ALREADY_CANCELLED);
        }

        List<Map<String, Object>> classRows = jdbcTemplate.queryForList(
                """
                SELECT id, tutor_id, student_id, class_name, status,
                       sessions_per_week, price_per_session
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
        Long studentId = ((Number) cl.get("student_id")).longValue();
        String className = (String) cl.get("class_name");

        // Ưu tiên dữ liệu trên lớp; fallback từ body khi thiếu (mục 4.1, bước 3).
        int sessionsPerWeek = cl.get("sessions_per_week") != null
                ? ((Number) cl.get("sessions_per_week")).intValue()
                : (body != null && body.getSessionsPerWeek() != null ? body.getSessionsPerWeek() : 0);
        BigDecimal pricePerSession = cl.get("price_per_session") != null
                ? new BigDecimal(cl.get("price_per_session").toString())
                : (body != null ? body.getPricePerSession() : null);
        // Tỷ lệ phí: body > snapshot payment NEW (lúc ghép lớp) > đơn class_requests (mục 4.1 bước 3).
        BigDecimal bodyFee = body != null ? body.getFeePercentage() : null;
        BigDecimal draftFee = paymentDraftFeePercentage(classId);
        BigDecimal feePercentage = bodyFee != null
                ? bodyFee
                : draftFee != null
                        ? draftFee
                        : rows.get(0).get("fee_percentage") != null
                                ? new BigDecimal(rows.get(0).get("fee_percentage").toString())
                                : null;

        // Thiếu dữ liệu thì không kích hoạt (lễ tân bổ sung trong modal).
        if (sessionsPerWeek <= 0 || pricePerSession == null) {
            throw new AppException(ErrorCode.CLASS_FEE_INCOMPLETE);
        }

        // Lưu giá trị bổ sung vào lớp (nguồn duy nhất tính phí — ràng buộc 6.1).
        jdbcTemplate.update(
                "UPDATE classes SET sessions_per_week = ?, price_per_session = ?, updated_at = NOW() WHERE id = ?",
                sessionsPerWeek, pricePerSession, classId);

        Long currentUserId = getCurrentUserId();

        jdbcTemplate.update(
                "UPDATE classes SET status = 'ACTIVE', active_from = COALESCE(active_from, CURRENT_DATE), updated_at = NOW() WHERE id = ?",
                classId
        );

        jdbcTemplate.update(
                "UPDATE class_requests SET updated_at = NOW(), handled_by = COALESCE(handled_by, ?) WHERE id = ?",
                currentUserId, id
        );

        // Kích hoạt payment NEW -> NOT_SUBMITTED (tính amount, ghi đè fee nếu body có).
        paymentService.createForClassWithFeeInfo(classId, feePercentage, sessionsPerWeek, pricePerSession);

        auditLogService.log(
                currentUserId,
                "COMPLETE_MATCH_REQUEST",
                "CLASS_REQUEST",
                id,
                Map.of("classId", classId, "tutorId", tutorId, "status", "ACTIVE"),
                httpRequest
        );

        notifyTutorMatchSuccess(tutorId, classId, className);
        notifyStudentMatchSuccess(studentId, classId, className);

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
        String reason = request.getReason().trim();

        // Lớp đang mở (TRIAL/ACTIVE) bị đóng: gia sư đã chọn chuyển TERMINATED (UC-REC-07 kịch bản 5a).
        Optional<ClassSnapshot> openClass = lifecycle.findLatestClass(id).filter(ClassSnapshot::isOpen);
        lifecycle.closeOpenClasses(id);
        openClass.ifPresent(cl -> lifecycle.terminateTutor(id, cl.tutorId()));
        lifecycle.rejectPendingApplications(id);

        jdbcTemplate.update(
                "UPDATE class_requests SET status = 'CANCELLED', cancel_reason = ?, handled_by = ?, updated_at = NOW() WHERE id = ?",
                reason, currentUserId, id
        );

        auditLogService.log(
                currentUserId,
                "CANCEL_MATCH_REQUEST",
                "CLASS_REQUEST",
                id,
                Map.of("reason", reason),
                httpRequest
        );

        openClass.ifPresent(cl -> {
            String content = "Lớp " + safe(cl.className()) + " đã bị hủy. Lý do: " + reason;
            lifecycle.notifyUser(cl.tutorId(), "Lớp học đã bị hủy", content, "CLASS", cl.id());
            lifecycle.notifyUser(cl.studentId(), "Lớp học đã bị hủy", content, "CLASS", cl.id());
        });
    }

    /**
     * Ghép lại khi dạy thử không thành công và phụ huynh muốn tìm gia sư khác
     * (UC-REC-06.1 nhánh 5.2, UC-PA-05, ERD C-14 {@code MATCHED → REMATCH}).
     *
     * <p>Một transaction: lớp {@code TRIAL} + buổi chưa học + payment nháp bị hủy, gia sư cũ
     * {@code TERMINATED}, đơn {@code REMATCH} và bỏ {@code requested_tutor_id} để đơn mở lại
     * vòng ứng tuyển ở trang Lớp cần gia sư.
     */
    @Transactional
    public MatchRequestDetailResponse rematchMatchRequest(
            Long id, RematchMatchRequest request, HttpServletRequest httpRequest) {
        List<String> statuses = jdbcTemplate.queryForList(
                "SELECT status FROM class_requests WHERE id = ? FOR UPDATE", String.class, id);
        if (statuses.isEmpty()) {
            throw new AppException(ErrorCode.CLASS_REQUEST_NOT_FOUND);
        }
        if ("CANCELLED".equalsIgnoreCase(statuses.get(0))) {
            throw new AppException(ErrorCode.CLASS_REQUEST_ALREADY_CANCELLED);
        }

        ClassSnapshot trial = lifecycle.findLatestClass(id)
                .filter(cl -> "MATCHED".equalsIgnoreCase(statuses.get(0)) && cl.isTrial())
                .orElseThrow(() -> new AppException(ErrorCode.MATCH_REQUEST_NOT_TRIAL));

        String reason = request.getReason().trim();
        Long currentUserId = getCurrentUserId();

        lifecycle.closeOpenClasses(id);
        lifecycle.terminateTutor(id, trial.tutorId());

        jdbcTemplate.update(
                """
                UPDATE class_requests
                SET status = 'REMATCH', requested_tutor_id = NULL, handled_by = ?, updated_at = NOW()
                WHERE id = ?
                """,
                currentUserId, id
        );

        auditLogService.log(
                currentUserId,
                "REMATCH_MATCH_REQUEST",
                "CLASS_REQUEST",
                id,
                Map.of("reason", reason, "oldTutorId", trial.tutorId(), "cancelledClassId", trial.id()),
                httpRequest
        );

        lifecycle.notifyUser(trial.tutorId(), "Kết quả dạy thử không thành công",
                "Lớp dạy thử " + safe(trial.className()) + " đã kết thúc do dạy thử không thành công. Lý do: "
                        + reason + ". Bạn sẽ không thể ứng tuyển lại lớp này.",
                "CLASS", trial.id());
        lifecycle.notifyUser(trial.studentId(), "Trung tâm đang tìm gia sư mới",
                "Lớp dạy thử " + safe(trial.className())
                        + " đã kết thúc. Trung tâm đang tìm gia sư khác phù hợp và sẽ liên hệ lại với gia đình.",
                "CLASS", trial.id());

        return getMatchRequest(id);
    }

    private static String safe(String value) {
        return value == null ? "" : value;
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

    /** Kết quả tìm/tạo học sinh: {@code created} = true khi vừa tạo tài khoản mới. */
    private record StudentAccount(Long id, boolean created) {}

    private Long findOrCreateStudent(Long parentId, String studentName, String phone, String grade, String school) {
        return ensureStudent(parentId, studentName, phone, grade, school, null).id();
    }

    private StudentAccount ensureStudent(
            Long parentId, String studentName, String phone, String grade, String school, String learningGoal) {
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
            return new StudentAccount(existing.get(0), false);
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
                user.getId(), parentId, school, grade, learningGoal
        );

        return new StudentAccount(user.getId(), true);
    }

    private Long getCurrentUserId() {
        var context = SecurityContextHolder.getContext();
        if (context == null || context.getAuthentication() == null) {
            return null;
        }
        String name = context.getAuthentication().getName();
        return userRepository.findByUsername(name).map(User::getId).orElse(null);
    }

    /**
     * Snapshot tỷ lệ phí trên bản nháp payment {@code NEW} (mục 4.1 bước 3, 9):
     * giá trị này được đóng băng khi ghép lớp, nên dùng làm nguồn ưu tiên thay vì
     * {@code class_requests.fee_percentage} — sửa đơn sau đó không làm thay đổi phí.
     */
    private BigDecimal paymentDraftFeePercentage(Long classId) {
        List<BigDecimal> fees = jdbcTemplate.queryForList(
                """
                SELECT fee_percentage FROM payments
                WHERE class_id = ? AND payer_type = 'TUTOR' AND status = 'NEW'
                ORDER BY id DESC LIMIT 1
                """,
                BigDecimal.class, classId);
        return fees.isEmpty() ? null : fees.get(0);
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

    private void notifyStudentMatchSuccess(Long studentId, Long classId, String className) {
        jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                VALUES (?, 'Lớp học chính thức', ?, 'CLASS', ?)
                """,
                studentId,
                "Lớp học " + (className != null ? className : "")
                        + " đã chuyển sang trạng thái chính thức. Giáo viên sẽ sắp xếp lịch học cố định trong thời gian tới.",
                classId
        );
    }

    /**
     * Hoàn thiện đơn ghép lớp khi còn {@code NEW} (kế hoạch mục 4.1.1, mirror của
     * {@code PUT /class-requests/{id}}): sửa {@code class_requirement},
     * {@code teaching_mode}, {@code price_per_session}, {@code fee_percentage} —
     * cho lễ tân bổ sung dữ liệu (đặc biệt tỷ lệ phí) trước khi {@code confirm}.
     * Partial update: trường nào gửi lên thì cập nhật trường đó.
     */
    @Transactional
    public MatchRequestDetailResponse updateMatchRequest(
            Long id, UpdateMatchRequest body, HttpServletRequest httpRequest) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                SELECT id, parent_id, student_id, status, class_requirement, teaching_mode, price_per_session, fee_percentage
                FROM class_requests
                WHERE id = ? AND requested_tutor_id IS NOT NULL
                FOR UPDATE
                """,
                id
        );
        if (rows.isEmpty()) {
            throw new AppException(ErrorCode.CLASS_REQUEST_NOT_FOUND);
        }
        Map<String, Object> cr = rows.get(0);
        if (!"NEW".equalsIgnoreCase((String) cr.get("status"))) {
            throw new AppException(ErrorCode.CLASS_REQUEST_NOT_NEW);
        }

        if (body != null) {
            jdbcTemplate.update(
                    """
                    UPDATE class_requests SET
                        class_requirement   = COALESCE(?, class_requirement),
                        teaching_mode       = COALESCE(?, teaching_mode),
                        price_per_session   = COALESCE(?, price_per_session),
                        fee_percentage       = COALESCE(?, fee_percentage),
                        updated_at            = NOW()
                    WHERE id = ?
                    """,
                    trimToNull(body.getClassRequirement()),
                    body.getTeachingMode(),
                    body.getPricePerSession(),
                    body.getFeePercentage(),
                    id
            );
            updateParentAndStudentInfo(cr, body);
        }

        Long currentUserId = getCurrentUserId();
        auditLogService.log(
                currentUserId,
                "UPDATE_MATCH_REQUEST",
                "CLASS_REQUEST",
                id,
                body == null
                        ? null
                        : Map.of(
                                "classRequirement", String.valueOf(body.getClassRequirement()),
                                "teachingMode", String.valueOf(body.getTeachingMode()),
                                "pricePerSession", String.valueOf(body.getPricePerSession()),
                                "feePercentage", String.valueOf(body.getFeePercentage())),
                httpRequest
        );
        return getMatchRequest(id);
    }

    /**
     * Lễ tân bổ sung thông tin phụ huynh/học sinh trước khi chuyển dạy thử (đơn còn NEW).
     * Học sinh chưa có tài khoản → lưu tạm vào {@code class_requests.student_*}; đã có → cập nhật hồ sơ học sinh.
     */
    private void updateParentAndStudentInfo(Map<String, Object> cr, UpdateMatchRequest body) {
        Long requestId = ((Number) cr.get("id")).longValue();
        Long parentId = ((Number) cr.get("parent_id")).longValue();
        Long studentId = cr.get("student_id") != null ? ((Number) cr.get("student_id")).longValue() : null;

        jdbcTemplate.update(
                """
                UPDATE parents SET
                    full_name  = COALESCE(?, full_name),
                    email      = COALESCE(?, email),
                    address    = COALESCE(?, address),
                    updated_at = NOW()
                WHERE id = ?
                """,
                trimToNull(body.getParentName()),
                trimToNull(body.getParentEmail()),
                trimToNull(body.getParentAddress()),
                parentId);

        String studentName = trimToNull(body.getStudentName());
        String grade = trimToNull(body.getGrade());
        String school = trimToNull(body.getSchool());
        String goal = trimToNull(body.getLearningGoal());

        if (studentId == null) {
            jdbcTemplate.update(
                    """
                    UPDATE class_requests SET
                        student_name          = COALESCE(?, student_name),
                        student_grade         = COALESCE(?, student_grade),
                        student_school        = COALESCE(?, student_school),
                        student_learning_goal = COALESCE(?, student_learning_goal)
                    WHERE id = ?
                    """,
                    studentName, grade, school, goal, requestId);
        } else {
            jdbcTemplate.update(
                    """
                    UPDATE students SET
                        grade         = COALESCE(?, grade),
                        school        = COALESCE(?, school),
                        learning_goal = COALESCE(?, learning_goal),
                        updated_at    = NOW()
                    WHERE id = ?
                    """,
                    grade, school, goal, studentId);
            if (studentName != null) {
                jdbcTemplate.update(
                        "UPDATE users SET full_name = ?, updated_at = NOW() WHERE id = ?", studentName, studentId);
            }
        }
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
