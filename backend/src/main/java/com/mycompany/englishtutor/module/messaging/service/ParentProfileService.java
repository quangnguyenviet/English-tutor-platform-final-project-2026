package com.mycompany.englishtutor.module.messaging.service;

import java.util.List;
import java.util.regex.Pattern;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.messaging.api.ParentProfileRequest;
import com.mycompany.englishtutor.module.messaging.api.ParentProfileResponse;
import com.mycompany.englishtutor.module.messaging.service.MessagingActor.ParentRef;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;
import com.mycompany.englishtutor.shared.util.PhoneNumbers;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

/** Hồ sơ phụ huynh (wizard truy cập và trang cá nhân): SĐT, họ tên, mục đích, khu vực, địa chỉ. */
@Service
@RequiredArgsConstructor
public class ParentProfileService {

    private static final Pattern VN_PHONE = Pattern.compile("^0[35789]\\d{8}$");

    private final JdbcTemplate jdbcTemplate;
    private final MessagingActor actor;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public ParentProfileResponse getMyProfile() {
        return toResponse(actor.requireParent());
    }

    @Transactional
    public ParentProfileResponse saveProfile(ParentProfileRequest request, HttpServletRequest http) {
        ParentRef parent = actor.requireParent();
        String phone = PhoneNumbers.normalize(request.phone());
        if (phone == null || !VN_PHONE.matcher(phone).matches()) {
            throw new AppException(ErrorCode.CHAT_INVALID_PHONE);
        }
        // Số thuộc hồ sơ khác (kể cả hồ sơ cũ chưa có tài khoản) thì chặn, không lộ chủ số; hồ sơ cũ do trung tâm xử lý.
        Integer owners = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM parents WHERE phone = ? AND id <> ?", Integer.class, phone, parent.parentId());
        if (owners != null && owners > 0) {
            throw new AppException(ErrorCode.PARENT_PHONE_BELONGS_TO_OTHER);
        }
        jdbcTemplate.update(
                """
                UPDATE parents SET phone = ?, full_name = ?, purpose = ?, province = ?, ward = ?, address = ?, updated_at = NOW()
                WHERE id = ?
                """,
                phone, request.fullName().trim(), request.purpose(), request.province().trim(),
                request.ward().trim(), request.address().trim(), parent.parentId());
        // Tên hiển thị trong phòng chat và trên header lấy từ users nên phải đổi cùng lúc.
        jdbcTemplate.update("UPDATE users SET full_name = ?, updated_at = NOW() WHERE id = ?",
                request.fullName().trim(), parent.userId());
        auditLogService.log(parent.userId(), "UPDATE_PARENT_PROFILE", "PARENT", parent.parentId(), null, http);
        return toResponse(actor.parentOfUser(parent.userId()));
    }

    private ParentProfileResponse toResponse(ParentRef parent) {
        List<ParentProfileResponse.ChildItem> children = jdbcTemplate.query(
                """
                SELECT s.id, u.full_name, s.grade FROM students s JOIN users u ON u.id = s.id
                WHERE s.parent_id = ? ORDER BY u.full_name
                """,
                (rs, i) -> new ParentProfileResponse.ChildItem(rs.getLong("id"), rs.getString("full_name"), rs.getString("grade")),
                parent.parentId());
        return new ParentProfileResponse(
                parent.parentId(), parent.fullName(), parent.phone(), parent.purpose(), parent.province(),
                parent.ward(), parent.address(), parent.profileComplete(), children);
    }
}
