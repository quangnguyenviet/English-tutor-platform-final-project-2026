package com.mycompany.englishtutor.infrastructure.config;

import java.io.IOException;
import java.util.Set;

import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.englishtutor.module.user.domain.UserRole;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.module.user.repository.UserRepository.AccountState;
import com.mycompany.englishtutor.shared.api.ApiResponse;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Chặn request có token hợp lệ nhưng tài khoản không còn được dùng hệ thống (Luồng 25, 26):
 * tài khoản không ACTIVE (mọi vai trò) và nhân sự chưa đổi mật khẩu lần đầu.
 * Không áp dụng cờ đổi mật khẩu cho TUTOR vì {@code register-tutor} luôn bật cờ dù gia sư tự đặt mật khẩu.
 */
public class AccountStateFilter extends OncePerRequestFilter {

    private static final String CHANGE_PASSWORD_PATH = "/api/v1/auth/change-password";
    private static final String PUBLIC_API_PREFIX = "/api/v1/public";
    private static final Set<String> AUTH_PUBLIC_PATHS = Set.of(
            "/api/v1/auth/token",
            "/api/v1/auth/register-tutor",
            "/api/v1/auth/introspect",
            "/api/v1/auth/logout",
            "/api/v1/auth/refresh");
    private static final Set<String> FORCED_PASSWORD_ROLES =
            Set.of(UserRole.RECEPTIONIST.name(), UserRole.ACCOUNTANT.name());

    private final UserRepository userRepository;

    public AccountStateFilter(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return AUTH_PUBLIC_PATHS.contains(path) || path.startsWith(PUBLIC_API_PREFIX);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken) {
            AccountState state =
                    userRepository.findAccountState(authentication.getName()).orElse(null);
            ErrorCode blocked = state == null ? null : resolveBlock(state, request.getRequestURI());
            if (blocked != null) {
                writeError(response, blocked);
                return;
            }
        }
        filterChain.doFilter(request, response);
    }

    private ErrorCode resolveBlock(AccountState state, String path) {
        if (!"ACTIVE".equalsIgnoreCase(state.getStatus())) {
            return ErrorCode.ACCOUNT_INACTIVE;
        }
        if (state.getMustChangePassword()
                && FORCED_PASSWORD_ROLES.contains(state.getRole())
                && !CHANGE_PASSWORD_PATH.equals(path)) {
            return ErrorCode.PASSWORD_CHANGE_REQUIRED;
        }
        return null;
    }

    private void writeError(HttpServletResponse response, ErrorCode errorCode) throws IOException {
        response.setStatus(errorCode.getStatusCode().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        ApiResponse<?> apiResponse = ApiResponse.builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();

        response.getWriter().write(new ObjectMapper().writeValueAsString(apiResponse));
        response.flushBuffer();
    }
}
