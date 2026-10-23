package com.mycompany.englishtutor.module.matching.service;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.matching.api.request.ClassRequestSubmitRequest;
import com.mycompany.englishtutor.module.matching.api.response.ClassRequestSubmitResponse;
import com.mycompany.englishtutor.module.tutor.domain.enums.ProfileStatus;
import com.mycompany.englishtutor.module.tutor.repository.TutorRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Tiếp nhận yêu cầu của phụ huynh từ trang công khai theo thiết kế ERD: tạo (hoặc dùng lại) {@code parents}
 * theo SĐT, rồi tạo {@code class_requests} trạng thái {@code NEW} để Lễ tân gọi lại.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ClassRequestSubmitService {
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter CODE_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final String SUCCESS_MESSAGE = "Trung tâm sẽ liên hệ với quý phụ huynh trong vòng 12 giờ.";

    JdbcTemplate jdbcTemplate;
    TutorRepository tutorRepository;
    PhoneRateLimiter phoneRateLimiter;

    @Transactional
    public ClassRequestSubmitResponse submit(ClassRequestSubmitRequest request) {
        Long tutorId = request.getTutorId();
        if (tutorId != null) {
            tutorRepository
                    .findPublicByIdAndProfileStatus(tutorId, ProfileStatus.ACTIVE.name())
                    .orElseThrow(() -> new AppException(ErrorCode.TUTOR_PROFILE_UNAVAILABLE));
        }

        String phone = request.getPhone().replaceAll("[\\s.\\-()]", "");
        if (!phoneRateLimiter.tryAcquire(phone)) {
            throw new AppException(ErrorCode.TOO_MANY_REQUESTS);
        }

        long parentId = findOrCreateParent(request.getParentName().trim(), phone);

        // Gửi lặp (bấm nhiều lần) cùng một yêu cầu đang chờ gọi lại thì trả lại mã cũ, không tạo thêm đơn.
        List<Map<String, Object>> pending = jdbcTemplate.queryForList(
                """
                SELECT id, created_at FROM class_requests
                WHERE parent_id = ? AND status = 'NEW' AND requested_tutor_id IS NOT DISTINCT FROM ?
                ORDER BY id LIMIT 1
                """,
                parentId,
                tutorId);
        if (!pending.isEmpty()) {
            return toResponse(pending.get(0));
        }

        Map<String, Object> created = jdbcTemplate.queryForMap(
                """
                INSERT INTO class_requests (parent_id, requested_tutor_id, status)
                VALUES (?, ?, 'NEW') RETURNING id, created_at
                """,
                parentId,
                tutorId);
        notifyReceptionists(((Number) created.get("id")).longValue(), request.getParentName().trim(), tutorId);
        return toResponse(created);
    }

    private long findOrCreateParent(String fullName, String phone) {
        List<Long> existing = jdbcTemplate.queryForList(
                "SELECT id FROM parents WHERE phone = ? ORDER BY id LIMIT 1", Long.class, phone);
        if (!existing.isEmpty()) {
            return existing.get(0);
        }
        Long id = jdbcTemplate.queryForObject(
                "INSERT INTO parents (full_name, phone) VALUES (?, ?) RETURNING id", Long.class, fullName, phone);
        return id == null ? 0 : id;
    }

    /** Bản tạm: ghi thẳng bảng notifications cho từng Lễ tân đang hoạt động, sẽ thay bằng NotificationService (T8-A1). */
    private void notifyReceptionists(long classRequestId, String parentName, Long tutorId) {
        String title = tutorId == null ? "Yêu cầu tư vấn tìm gia sư mới" : "Yêu cầu liên hệ gia sư mới";
        jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                SELECT id, ?, ?, 'CLASS_REQUEST', ? FROM users WHERE role = 'RECEPTIONIST' AND status = 'ACTIVE'
                """,
                title,
                "Phụ huynh " + parentName + " vừa để lại thông tin, cần gọi lại trong vòng 12 giờ.",
                classRequestId);
    }

    private static ClassRequestSubmitResponse toResponse(Map<String, Object> row) {
        long id = ((Number) row.get("id")).longValue();
        OffsetDateTime createdAt = row.get("created_at") instanceof OffsetDateTime odt
                ? odt
                : ((java.sql.Timestamp) row.get("created_at")).toInstant().atZone(VN_ZONE).toOffsetDateTime();
        return ClassRequestSubmitResponse.builder()
                .requestCode("REQ-" + createdAt.atZoneSameInstant(VN_ZONE).format(CODE_DATE) + "-" + id)
                .message(SUCCESS_MESSAGE)
                .build();
    }
}
