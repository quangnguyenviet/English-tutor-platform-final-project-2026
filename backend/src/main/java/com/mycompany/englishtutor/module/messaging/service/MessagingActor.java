package com.mycompany.englishtutor.module.messaging.service;

import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

/** Xác định người đang đăng nhập và vai trò của họ trong tính năng nhắn tin. */
@Component
@RequiredArgsConstructor
public class MessagingActor {

    /** Hồ sơ phụ huynh của tài khoản PARENT đang đăng nhập. */
    public record ParentRef(
            Long parentId, Long userId, String fullName, String phone, String purpose, String province, String ward,
            String address) {
        public boolean profileComplete() {
            return phone != null && purpose != null && province != null && ward != null
                    && address != null && !address.isBlank();
        }
    }

    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    public Long currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return userRepository
                .findByUsername(authentication.getName())
                .map(User::getId)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
    }

    public boolean hasRole(String role) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            String name = authority.getAuthority();
            if (name.equals(role) || name.equals("ROLE_" + role)) {
                return true;
            }
        }
        return false;
    }

    public boolean isStaff() {
        return hasRole("RECEPTIONIST") || hasRole("ADMIN");
    }

    public ParentRef requireParent() {
        if (!hasRole("PARENT")) {
            throw new AppException(ErrorCode.CHAT_PARENT_ONLY);
        }
        return parentOfUser(currentUserId());
    }

    public ParentRef parentOfUser(Long userId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id, full_name, phone, purpose, province, ward, address FROM parents WHERE user_id = ?", userId);
        if (rows.isEmpty()) {
            throw new AppException(ErrorCode.CHAT_PARENT_ONLY);
        }
        Map<String, Object> r = rows.get(0);
        return new ParentRef(
                ((Number) r.get("id")).longValue(),
                userId,
                (String) r.get("full_name"),
                (String) r.get("phone"),
                (String) r.get("purpose"),
                (String) r.get("province"),
                (String) r.get("ward"),
                (String) r.get("address"));
    }

    /** Gia sư dùng chung id với users. */
    public Long requireTutorId() {
        if (!hasRole("TUTOR")) {
            throw new AppException(ErrorCode.CHAT_TUTOR_ONLY);
        }
        return currentUserId();
    }
}
