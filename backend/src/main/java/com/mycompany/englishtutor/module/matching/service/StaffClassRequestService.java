package com.mycompany.englishtutor.module.matching.service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.matching.api.request.CancelClassRequest;
import com.mycompany.englishtutor.module.matching.api.request.ChangeDesignatedTutorRequest;
import com.mycompany.englishtutor.module.matching.api.request.CompleteMatchRequest;
import com.mycompany.englishtutor.module.matching.api.request.CreateClassRequest;
import com.mycompany.englishtutor.module.matching.api.request.ParentCheckRequest;
import com.mycompany.englishtutor.module.matching.api.request.RematchMatchRequest;
import com.mycompany.englishtutor.module.matching.api.request.SelectTutorRequest;
import com.mycompany.englishtutor.module.matching.api.request.UpdateClassRequest;
import com.mycompany.englishtutor.module.matching.api.response.ClassApplicationResponse;
import com.mycompany.englishtutor.module.matching.api.response.ClassRequestDetailResponse;
import com.mycompany.englishtutor.module.matching.api.response.ClassRequestSummaryResponse;
import com.mycompany.englishtutor.module.matching.api.response.ParentCheckResponse;
import com.mycompany.englishtutor.module.matching.repository.StaffClassRequestQueryRepository;
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
import com.mycompany.englishtutor.shared.util.PhoneNumbers;

import jakarta.servlet.http.HttpServletRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

/**
 * Nghiệp vụ Lễ tân/Admin quản lý Lớp cần gia sư.
 *
 * <p>Một lớp đi theo hai đường: có gia sư chỉ định thì Lễ tân xác nhận và chuyển dạy thử, không có thì
 * đăng tuyển rồi chọn từ danh sách ứng tuyển. Tài khoản học sinh chỉ được tạo khi vào dạy thử
 * ({@link #startTrial}); trước đó thông tin học sinh nằm ở {@code class_requests.student_*}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StaffClassRequestService {

    /** Mật khẩu mặc định cấp cho học sinh mới, học sinh bị ép đổi ở lần đăng nhập đầu. */
    static final String DEFAULT_STUDENT_PASSWORD = "EnglishPath@123";

    JdbcTemplate jdbcTemplate;
    StaffClassRequestQueryRepository queryRepository;
    TutorRepository tutorRepository;
    UserRepository userRepository;
    AuditLogService auditLogService;
    PasswordEncoder passwordEncoder;
    PaymentService paymentService;
    MatchingLifecycleSupport lifecycle;
    ParentResolver parentResolver;

    // ------------------------------------------------------------------ READ

    @Transactional(readOnly = true)
    public PageResponse<ClassRequestSummaryResponse> getClassRequests(
            String tab, String keyword, String sort, Integer page, Integer size) {
        return queryRepository.findClassRequests(tab, keyword, sort, page, size);
    }

    @Transactional(readOnly = true)
    public ClassRequestDetailResponse getClassRequest(Long id) {
        ClassRequestDetailResponse detail = loadDetail(id);
        detail.setInitialPassword(findUnchangedDefaultPassword(id));
        return detail;
    }

    @Transactional(readOnly = true)
    public List<ClassApplicationResponse> getApplications(Long id) {
        loadDetail(id);
        return queryRepository.findApplications(id);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getTabCounts() {
        return queryRepository.getTabCounts();
    }

    /** Lễ tân kiểm tra SĐT trong lúc nhập form: SĐT đã có của phụ huynh nào, họ tên có khớp không. */
    @Transactional(readOnly = true)
    public ParentCheckResponse checkParent(ParentCheckRequest request) {
        return parentResolver.findByPhone(PhoneNumbers.normalize(request.getPhone()))
                .map(parent -> ParentCheckResponse.builder()
                        .exists(true)
                        .nameMatches(ParentResolver.sameName(parent.fullName(), request.getParentName()))
                        .parentName(parent.fullName())
                        .build())
                .orElseGet(() -> ParentCheckResponse.builder().exists(false).nameMatches(true).build());
    }

    // ----------------------------------------------------------------- WRITE

    @Transactional
    public ClassRequestDetailResponse create(CreateClassRequest request, HttpServletRequest httpRequest) {
        Long tutorId = request.getTutorId();
        if (tutorId != null) {
            requireActiveTutor(tutorId);
        }

        String parentName = request.getParentName().trim();
        ParentResolver.Parent parent =
                parentResolver.resolve(parentName, PhoneNumbers.normalize(request.getPhone()));
        if (!ParentResolver.sameName(parent.fullName(), parentName)) {
            throw new AppException(ErrorCode.PARENT_PHONE_BELONGS_TO_OTHER);
        }
        Long parentId = parent.id();
        Long currentUserId = getCurrentUserId();

        Long classRequestId = jdbcTemplate.queryForObject(
                """
                INSERT INTO class_requests (
                    parent_id, requested_tutor_id, class_requirement, teaching_mode, price_per_session,
                    sessions_per_week, preferred_schedule, tutor_requirement, fee_percentage,
                    student_name, student_grade, student_school, student_learning_goal,
                    status, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, 40), ?, ?, ?, ?, 'NEW', ?) RETURNING id
                """,
                Long.class,
                parentId,
                tutorId,
                request.getClassRequirement().trim(),
                request.getTeachingMode(),
                request.getPricePerSession(),
                request.getSessionsPerWeek(),
                trimToNull(request.getPreferredSchedule()),
                trimToNull(request.getTutorRequirement()),
                request.getFeePercentage(),
                request.getStudentName().trim(),
                trimToNull(request.getGrade()),
                trimToNull(request.getSchool()),
                trimToNull(request.getLearningGoal()),
                currentUserId);

        Map<String, Object> details = new HashMap<>();
        details.put("parentName", request.getParentName());
        details.put("studentName", request.getStudentName());
        details.put("classRequirement", request.getClassRequirement());
        details.put("tutorId", tutorId);
        auditLogService.log(currentUserId, "CREATE_CLASS_REQUEST", "CLASS_REQUEST", classRequestId, details, httpRequest);

        if (tutorId != null) {
            notifyReceptionists(classRequestId, request.getParentName().trim());
        }
        return getClassRequest(classRequestId);
    }

    /**
     * Sửa thông tin lớp. {@code NEW}: mọi trường, thông tin học sinh lưu tạm trên đơn nếu chưa có tài khoản.
     * {@code REMATCH}: chỉ học phí, mục tiêu, yêu cầu gia sư, và báo cho gia sư đang ứng tuyển.
     */
    @Transactional
    public ClassRequestDetailResponse update(Long id, UpdateClassRequest request, HttpServletRequest httpRequest) {
        Map<String, Object> row = lockRequest(id);
        String status = (String) row.get("status");
        boolean rematch = "REMATCH".equalsIgnoreCase(status);
        if (!rematch && !"NEW".equalsIgnoreCase(status)) {
            throw new AppException(ErrorCode.CLASS_REQUEST_NOT_EDITABLE);
        }
        if (rematch && touchesLockedField(request)) {
            throw new AppException(ErrorCode.CLASS_REQUEST_FIELD_LOCKED);
        }

        jdbcTemplate.update(
                """
                UPDATE class_requests SET
                    class_requirement  = COALESCE(?, class_requirement),
                    teaching_mode      = COALESCE(?, teaching_mode),
                    price_per_session  = COALESCE(?, price_per_session),
                    sessions_per_week  = COALESCE(?, sessions_per_week),
                    preferred_schedule = COALESCE(?, preferred_schedule),
                    tutor_requirement  = COALESCE(?, tutor_requirement),
                    fee_percentage     = COALESCE(?, fee_percentage),
                    updated_at         = NOW()
                WHERE id = ?
                """,
                trimToNull(request.getClassRequirement()),
                request.getTeachingMode(),
                request.getPricePerSession(),
                request.getSessionsPerWeek(),
                trimToNull(request.getPreferredSchedule()),
                trimToNull(request.getTutorRequirement()),
                request.getFeePercentage(),
                id);
        updateParentAndStudentInfo(row, request);

        auditLogService.log(getCurrentUserId(), "UPDATE_CLASS_REQUEST", "CLASS_REQUEST", id, null, httpRequest);
        if (rematch) {
            notifyApplicants(id, "Lớp bạn ứng tuyển đã cập nhật thông tin",
                    "Lớp bạn đang ứng tuyển vừa được cập nhật học phí hoặc yêu cầu. Vui lòng xem lại trước khi nhận lớp.");
        }
        return getClassRequest(id);
    }

    /**
     * Đổi gia sư chỉ định khi lớp đang chờ xử lý hoặc đang ghép lại: A → B, A → không chỉ định, không → A.
     * Lớp đang ghép lại có gia sư chỉ định sẽ tạm ẩn khỏi trang gia sư cho tới khi đổi về không chỉ định.
     */
    @Transactional
    public ClassRequestDetailResponse changeDesignatedTutor(
            Long id, ChangeDesignatedTutorRequest request, HttpServletRequest httpRequest) {
        Map<String, Object> row = lockRequest(id);
        String status = (String) row.get("status");
        if (!"NEW".equalsIgnoreCase(status) && !"REMATCH".equalsIgnoreCase(status)) {
            throw new AppException(ErrorCode.CLASS_REQUEST_TUTOR_NOT_CHANGEABLE);
        }

        Long tutorId = request.getTutorId();
        if (tutorId != null) {
            requireActiveTutor(tutorId);
            Integer terminated = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM class_applications WHERE class_request_id = ? AND tutor_id = ? AND status = 'TERMINATED'",
                    Integer.class, id, tutorId);
            if (terminated != null && terminated > 0) {
                throw new AppException(ErrorCode.CLASS_REQUEST_TUTOR_TERMINATED);
            }
        }

        Long currentUserId = getCurrentUserId();
        jdbcTemplate.update(
                "UPDATE class_requests SET requested_tutor_id = ?, handled_by = ?, updated_at = NOW() WHERE id = ?",
                tutorId, currentUserId, id);

        Map<String, Object> details = new HashMap<>();
        details.put("oldTutorId", row.get("requested_tutor_id"));
        details.put("tutorId", tutorId);
        auditLogService.log(currentUserId, "CHANGE_DESIGNATED_TUTOR", "CLASS_REQUEST", id, details, httpRequest);
        return getClassRequest(id);
    }

    @Transactional
    public ClassRequestDetailResponse publish(Long id, HttpServletRequest httpRequest) {
        Map<String, Object> row = lockRequest(id);
        if (!"NEW".equalsIgnoreCase((String) row.get("status"))) {
            throw new AppException(ErrorCode.CLASS_REQUEST_NOT_NEW);
        }
        if (row.get("requested_tutor_id") != null) {
            throw new AppException(ErrorCode.CLASS_REQUEST_HAS_TUTOR);
        }
        boolean ready = (row.get("student_id") != null || notBlank(row.get("student_name")))
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

    /** Lớp có gia sư chỉ định: Lễ tân đã trao đổi, hai bên đồng ý thì chuyển dạy thử. */
    @Transactional
    public ClassRequestDetailResponse confirm(Long id, HttpServletRequest httpRequest) {
        Map<String, Object> row = lockRequest(id);
        String status = (String) row.get("status");
        if (!"NEW".equalsIgnoreCase(status) && !"REMATCH".equalsIgnoreCase(status)) {
            throw new AppException(ErrorCode.MATCH_REQUEST_NOT_PENDING);
        }
        if (row.get("requested_tutor_id") == null) {
            throw new AppException(ErrorCode.CLASS_REQUEST_NO_TUTOR);
        }
        Long tutorId = ((Number) row.get("requested_tutor_id")).longValue();
        return startTrial(id, row, tutorId, "APPROVE_CLASS_REQUEST", httpRequest);
    }

    /** Lớp đăng tuyển hoặc đang ghép lại: chọn một gia sư trong danh sách ứng tuyển. */
    @Transactional
    public ClassRequestDetailResponse selectTutor(Long id, SelectTutorRequest request, HttpServletRequest httpRequest) {
        Map<String, Object> row = lockRequest(id);
        String requestStatus = (String) row.get("status");
        if (!"OPEN".equalsIgnoreCase(requestStatus) && !"REMATCH".equalsIgnoreCase(requestStatus)) {
            throw new AppException(ErrorCode.CLASS_REQUEST_NOT_SELECTABLE);
        }
        if (row.get("requested_tutor_id") != null) {
            throw new AppException(ErrorCode.CLASS_REQUEST_HAS_TUTOR);
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
        return startTrial(id, row, tutorId, "SELECT_TUTOR_CLASS_REQUEST", httpRequest);
    }

    /**
     * Nơi duy nhất đưa lớp vào dạy thử: tạo tài khoản học sinh nếu chưa có, tạo lớp {@code TRIAL} và phí nháp,
     * chốt lượt ứng tuyển, gán gia sư cho đơn và thông báo các bên.
     */
    private ClassRequestDetailResponse startTrial(
            Long id, Map<String, Object> row, Long tutorId, String auditAction, HttpServletRequest httpRequest) {
        requireActiveTutor(tutorId);
        if (row.get("price_per_session") == null) {
            throw new AppException(ErrorCode.CLASS_REQUEST_PRICE_REQUIRED);
        }

        Long parentId = ((Number) row.get("parent_id")).longValue();
        Long studentId = row.get("student_id") != null ? ((Number) row.get("student_id")).longValue() : null;

        String initialPassword = null;
        if (studentId == null) {
            String pendingName = trimToNull((String) row.get("student_name"));
            if (pendingName == null) {
                throw new AppException(ErrorCode.STUDENT_INFO_REQUIRED);
            }
            String parentPhone = jdbcTemplate.queryForObject(
                    "SELECT phone FROM parents WHERE id = ?", String.class, parentId);
            StudentAccount account = ensureStudent(
                    parentId,
                    pendingName,
                    parentPhone,
                    (String) row.get("student_grade"),
                    (String) row.get("student_school"),
                    (String) row.get("student_learning_goal"));
            studentId = account.id();
            if (account.created()) {
                initialPassword = DEFAULT_STUDENT_PASSWORD;
            }
        }

        String className = trimToNull((String) row.get("class_requirement"));
        if (className == null) {
            className = "Tiếng Anh học thử 1 kèm 1";
        }
        String teachingMode = trimToNull((String) row.get("teaching_mode"));
        if (teachingMode == null) {
            teachingMode = "ONLINE";
        }
        BigDecimal price = (BigDecimal) row.get("price_per_session");
        BigDecimal feePercentage = row.get("fee_percentage") != null
                ? new BigDecimal(row.get("fee_percentage").toString())
                : null;

        // Gia sư chỉ định có thể đã từng ứng tuyển lớp này, nên chốt theo gia sư thay vì theo mã lượt.
        jdbcTemplate.update(
                "UPDATE class_applications SET status = 'SELECTED' WHERE class_request_id = ? AND tutor_id = ?",
                id, tutorId);
        List<Long> rejectedTutors = jdbcTemplate.queryForList(
                """
                UPDATE class_applications SET status = 'REJECTED'
                WHERE class_request_id = ? AND tutor_id <> ? AND status = 'APPLIED'
                RETURNING tutor_id
                """,
                Long.class, id, tutorId);

        Long currentUserId = getCurrentUserId();
        jdbcTemplate.update(
                """
                UPDATE class_requests SET
                    status = 'MATCHED', requested_tutor_id = ?, student_id = ?,
                    class_requirement = ?, teaching_mode = ?, handled_by = ?, updated_at = NOW()
                WHERE id = ?
                """,
                tutorId, studentId, className, teachingMode, currentUserId, id);

        Long classId = jdbcTemplate.queryForObject(
                """
                INSERT INTO classes (class_request_id, tutor_id, student_id, class_name, status, teaching_mode, price_per_session)
                VALUES (?, ?, ?, ?, 'TRIAL', ?, ?) RETURNING id
                """,
                Long.class,
                id, tutorId, studentId, className, teachingMode, price);

        auditLogService.log(currentUserId, auditAction, "CLASS_REQUEST", id,
                Map.of("classId", classId, "tutorId", tutorId, "status", "TRIAL"), httpRequest);

        // Snapshot phí nhận lớp ngay khi ghép: payment NEW, amount NULL.
        paymentService.createDraftForClass(classId, feePercentage, price);

        lifecycle.notifyUser(tutorId, "Lớp dạy thử mới được ghép",
                "Bạn đã được ghép lớp dạy thử: " + className + ". Vui lòng liên hệ phụ huynh để sắp xếp lịch học thử.",
                "CLASS", classId);
        for (Long rejectedTutor : rejectedTutors) {
            lifecycle.notifyUser(rejectedTutor, "Kết quả ứng tuyển lớp",
                    "Lớp bạn ứng tuyển đã chọn được gia sư khác. Cảm ơn bạn đã quan tâm, hẹn gặp lại ở các lớp tiếp theo.",
                    "CLASS_REQUEST", id);
        }

        ClassRequestDetailResponse detail = loadDetail(id);
        // Chỉ trả mật khẩu đúng lần tạo tài khoản mới để Lễ tân bàn giao cho gia đình.
        detail.setInitialPassword(initialPassword);
        return detail;
    }

    @Transactional
    public ClassRequestDetailResponse complete(
            Long id, CompleteMatchRequest body, HttpServletRequest httpRequest) {
        Map<String, Object> row = lockRequest(id);
        if ("CANCELLED".equalsIgnoreCase((String) row.get("status"))) {
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
                id);
        if (classRows.isEmpty() || !"TRIAL".equalsIgnoreCase((String) classRows.get(0).get("status"))) {
            throw new AppException(ErrorCode.MATCH_REQUEST_NOT_TRIAL);
        }

        Map<String, Object> cl = classRows.get(0);
        Long classId = ((Number) cl.get("id")).longValue();
        Long tutorId = ((Number) cl.get("tutor_id")).longValue();
        Long studentId = ((Number) cl.get("student_id")).longValue();
        String className = (String) cl.get("class_name");

        // Ưu tiên dữ liệu trên lớp, thiếu thì lấy từ body.
        int sessionsPerWeek = cl.get("sessions_per_week") != null
                ? ((Number) cl.get("sessions_per_week")).intValue()
                : (body != null && body.getSessionsPerWeek() != null ? body.getSessionsPerWeek() : 0);
        BigDecimal pricePerSession = cl.get("price_per_session") != null
                ? new BigDecimal(cl.get("price_per_session").toString())
                : (body != null ? body.getPricePerSession() : null);
        // Tỷ lệ phí: body > snapshot payment NEW lúc ghép lớp > đơn class_requests.
        BigDecimal bodyFee = body != null ? body.getFeePercentage() : null;
        BigDecimal draftFee = paymentDraftFeePercentage(classId);
        BigDecimal feePercentage = bodyFee != null
                ? bodyFee
                : draftFee != null
                        ? draftFee
                        : row.get("fee_percentage") != null
                                ? new BigDecimal(row.get("fee_percentage").toString())
                                : null;

        if (sessionsPerWeek <= 0 || pricePerSession == null) {
            throw new AppException(ErrorCode.CLASS_FEE_INCOMPLETE);
        }

        // Lưu giá trị bổ sung vào lớp, là nguồn duy nhất tính phí.
        jdbcTemplate.update(
                "UPDATE classes SET sessions_per_week = ?, price_per_session = ?, updated_at = NOW() WHERE id = ?",
                sessionsPerWeek, pricePerSession, classId);

        Long currentUserId = getCurrentUserId();
        jdbcTemplate.update(
                "UPDATE classes SET status = 'ACTIVE', active_from = COALESCE(active_from, CURRENT_DATE), updated_at = NOW() WHERE id = ?",
                classId);
        jdbcTemplate.update(
                "UPDATE class_requests SET updated_at = NOW(), handled_by = COALESCE(handled_by, ?) WHERE id = ?",
                currentUserId, id);

        // Kích hoạt payment NEW -> NOT_SUBMITTED (tính amount, ghi đè fee nếu body có).
        paymentService.createForClassWithFeeInfo(classId, feePercentage, sessionsPerWeek, pricePerSession);

        auditLogService.log(currentUserId, "COMPLETE_CLASS_REQUEST", "CLASS_REQUEST", id,
                Map.of("classId", classId, "tutorId", tutorId, "status", "ACTIVE"), httpRequest);

        String safeName = safe(className);
        lifecycle.notifyUser(tutorId, "Ghép lớp thành công",
                "Lớp học " + safeName + " đã hoàn tất dạy thử và chính thức bắt đầu giảng dạy.", "CLASS", classId);
        lifecycle.notifyUser(studentId, "Lớp học chính thức",
                "Lớp học " + safeName + " đã chuyển sang trạng thái chính thức. Giáo viên sẽ sắp xếp lịch học cố định trong thời gian tới.",
                "CLASS", classId);

        return getClassRequest(id);
    }

    /**
     * Ghép lại khi dạy thử không thành công và phụ huynh muốn tìm gia sư khác.
     *
     * <p>Lớp {@code TRIAL} và phí nháp bị hủy, gia sư cũ {@code TERMINATED}, lớp về {@code REMATCH} không còn
     * gia sư chỉ định. Các gia sư trước đó không được chọn quay lại danh sách ứng tuyển.
     */
    @Transactional
    public ClassRequestDetailResponse rematch(
            Long id, RematchMatchRequest request, HttpServletRequest httpRequest) {
        Map<String, Object> row = lockRequest(id);
        String status = (String) row.get("status");
        if ("CANCELLED".equalsIgnoreCase(status)) {
            throw new AppException(ErrorCode.CLASS_REQUEST_ALREADY_CANCELLED);
        }

        ClassSnapshot trial = lifecycle.findLatestClass(id)
                .filter(cl -> "MATCHED".equalsIgnoreCase(status) && cl.isTrial())
                .orElseThrow(() -> new AppException(ErrorCode.MATCH_REQUEST_NOT_TRIAL));

        String reason = request.getReason().trim();
        Long currentUserId = getCurrentUserId();

        lifecycle.closeOpenClasses(id);
        lifecycle.terminateTutor(id, trial.tutorId());
        List<Long> reopenedTutors = lifecycle.reopenRejectedApplications(id);

        jdbcTemplate.update(
                """
                UPDATE class_requests
                SET status = 'REMATCH', requested_tutor_id = NULL, handled_by = ?, updated_at = NOW()
                WHERE id = ?
                """,
                currentUserId, id);

        auditLogService.log(currentUserId, "REMATCH_CLASS_REQUEST", "CLASS_REQUEST", id,
                Map.of("reason", reason, "oldTutorId", trial.tutorId(), "cancelledClassId", trial.id()),
                httpRequest);

        lifecycle.notifyUser(trial.tutorId(), "Kết quả dạy thử không thành công",
                "Lớp dạy thử " + safe(trial.className()) + " đã kết thúc do dạy thử không thành công. Lý do: "
                        + reason + ". Bạn sẽ không thể ứng tuyển lại lớp này.",
                "CLASS", trial.id());
        lifecycle.notifyUser(trial.studentId(), "Trung tâm đang tìm gia sư mới",
                "Lớp dạy thử " + safe(trial.className())
                        + " đã kết thúc. Trung tâm đang tìm gia sư khác phù hợp và sẽ liên hệ lại với gia đình.",
                "CLASS", trial.id());
        for (Long reopenedTutor : reopenedTutors) {
            lifecycle.notifyUser(reopenedTutor, "Lớp bạn từng ứng tuyển đang tìm gia sư",
                    "Lớp bạn từng ứng tuyển đang cần gia sư. Hồ sơ của bạn đã được đưa lại vào danh sách ứng tuyển.",
                    "CLASS_REQUEST", id);
        }

        return getClassRequest(id);
    }

    /**
     * Hủy lớp ở mọi trạng thái. Riêng lớp đã ghép thành công chỉ hủy được trong 7 ngày
     * kể từ ngày bắt đầu chính thức ({@link MatchingLifecycleSupport#CANCEL_WINDOW_DAYS}).
     */
    @Transactional
    public void cancel(Long id, CancelClassRequest request, HttpServletRequest httpRequest) {
        Map<String, Object> row = lockRequest(id);
        if ("CANCELLED".equalsIgnoreCase((String) row.get("status"))) {
            throw new AppException(ErrorCode.CLASS_REQUEST_ALREADY_CANCELLED);
        }

        Optional<ClassSnapshot> latestClass = lifecycle.findLatestClass(id);
        if (latestClass.filter(cl -> cl.isCancelExpired(MatchingLifecycleSupport.today())).isPresent()) {
            throw new AppException(ErrorCode.CLASS_REQUEST_CANCEL_EXPIRED);
        }

        String reason = request.getReason().trim();
        Long currentUserId = getCurrentUserId();

        // Thông báo trước khi đổi APPLIED → REJECTED để giữ được danh sách người nhận.
        notifyApplicants(id, "Lớp cần gia sư đã bị hủy", "Lớp bạn ứng tuyển đã bị hủy. Lý do: " + reason);

        Optional<ClassSnapshot> openClass = latestClass.filter(ClassSnapshot::isOpen);
        lifecycle.closeOpenClasses(id);
        openClass.ifPresent(cl -> lifecycle.terminateTutor(id, cl.tutorId()));
        lifecycle.rejectPendingApplications(id);

        jdbcTemplate.update(
                "UPDATE class_requests SET status = 'CANCELLED', cancel_reason = ?, handled_by = ?, updated_at = NOW() WHERE id = ?",
                reason, currentUserId, id);

        auditLogService.log(currentUserId, "CANCEL_CLASS_REQUEST", "CLASS_REQUEST", id,
                Map.of("reason", reason), httpRequest);

        openClass.ifPresent(cl -> {
            String content = "Lớp " + safe(cl.className()) + " đã bị hủy. Lý do: " + reason;
            lifecycle.notifyUser(cl.tutorId(), "Lớp học đã bị hủy", content, "CLASS", cl.id());
            lifecycle.notifyUser(cl.studentId(), "Lớp học đã bị hủy", content, "CLASS", cl.id());
        });
    }

    // ---------------------------------------------------------------- HELPER

    private ClassRequestDetailResponse loadDetail(Long id) {
        return queryRepository.findDetailById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_REQUEST_NOT_FOUND));
    }

    private Map<String, Object> lockRequest(Long id) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                SELECT id, parent_id, requested_tutor_id, student_id, class_requirement, teaching_mode,
                       price_per_session, fee_percentage, status,
                       student_name, student_grade, student_school, student_learning_goal
                FROM class_requests
                WHERE id = ?
                FOR UPDATE
                """,
                id);
        if (rows.isEmpty()) {
            throw new AppException(ErrorCode.CLASS_REQUEST_NOT_FOUND);
        }
        return rows.get(0);
    }

    private void requireActiveTutor(Long tutorId) {
        tutorRepository.findPublicByIdAndProfileStatus(tutorId, ProfileStatus.ACTIVE.name())
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_ACTIVE));
    }

    private static boolean touchesLockedField(UpdateClassRequest request) {
        return notBlank(request.getParentName())
                || notBlank(request.getParentEmail())
                || notBlank(request.getParentAddress())
                || notBlank(request.getStudentName())
                || notBlank(request.getGrade())
                || notBlank(request.getSchool())
                || notBlank(request.getTeachingMode())
                || notBlank(request.getPreferredSchedule())
                || request.getSessionsPerWeek() != null
                || request.getFeePercentage() != null;
    }

    /** Học sinh chưa có tài khoản thì lưu tạm trên đơn, đã có thì cập nhật hồ sơ học sinh. */
    private void updateParentAndStudentInfo(Map<String, Object> row, UpdateClassRequest request) {
        Long requestId = ((Number) row.get("id")).longValue();
        Long parentId = ((Number) row.get("parent_id")).longValue();
        Long studentId = row.get("student_id") != null ? ((Number) row.get("student_id")).longValue() : null;

        jdbcTemplate.update(
                """
                UPDATE parents SET
                    full_name  = COALESCE(?, full_name),
                    email      = COALESCE(?, email),
                    address    = COALESCE(?, address),
                    updated_at = NOW()
                WHERE id = ?
                """,
                trimToNull(request.getParentName()),
                trimToNull(request.getParentEmail()),
                trimToNull(request.getParentAddress()),
                parentId);

        String studentName = trimToNull(request.getStudentName());
        String grade = trimToNull(request.getGrade());
        String school = trimToNull(request.getSchool());
        String goal = trimToNull(request.getLearningGoal());

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
            return;
        }

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

    /** Kết quả tìm/tạo học sinh: {@code created} = true khi vừa tạo tài khoản mới. */
    private record StudentAccount(Long id, boolean created) {}

    private StudentAccount ensureStudent(
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

    /**
     * Mật khẩu mặc định của học sinh, chỉ khi học sinh chưa đổi mật khẩu.
     * Cho Lễ tân xem lại khi lỡ đóng popup lúc tạo tài khoản.
     */
    private String findUnchangedDefaultPassword(Long requestId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                SELECT u.must_change_password, u.password_hash
                FROM class_requests cr
                JOIN users u ON u.id = cr.student_id
                WHERE cr.id = ?
                """,
                requestId);
        if (rows == null || rows.isEmpty()) {
            return null;
        }
        Map<String, Object> row = rows.get(0);
        boolean mustChange = Boolean.TRUE.equals(row.get("must_change_password"));
        String hash = (String) row.get("password_hash");
        if (!mustChange || hash == null || !passwordEncoder.matches(DEFAULT_STUDENT_PASSWORD, hash)) {
            return null;
        }
        return DEFAULT_STUDENT_PASSWORD;
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

    /** Tỷ lệ phí đóng băng trên bản nháp payment {@code NEW}: sửa đơn sau đó không làm đổi phí. */
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

    private void notifyReceptionists(long classRequestId, String parentName) {
        jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                SELECT id, ?, ?, 'CLASS_REQUEST', ? FROM users WHERE role = 'RECEPTIONIST' AND status = 'ACTIVE'
                """,
                "Yêu cầu đăng ký học với gia sư chỉ định mới",
                "Phụ huynh " + parentName + " vừa đăng ký học với gia sư, cần liên hệ xác nhận trong 12 giờ.",
                classRequestId);
    }

    /** Thông báo cho các gia sư đang ứng tuyển lớp. */
    private void notifyApplicants(Long classRequestId, String title, String content) {
        jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                SELECT tutor_id, ?, ?, 'CLASS_REQUEST', ?
                FROM class_applications
                WHERE class_request_id = ? AND status = 'APPLIED'
                """,
                title, content, classRequestId, classRequestId);
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
