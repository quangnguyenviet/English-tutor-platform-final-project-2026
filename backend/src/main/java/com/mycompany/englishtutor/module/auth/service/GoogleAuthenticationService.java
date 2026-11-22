package com.mycompany.englishtutor.module.auth.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.auth.api.request.GoogleOAuthCallbackRequest;
import com.mycompany.englishtutor.module.auth.api.response.GoogleAuthenticationResponse;
import com.mycompany.englishtutor.module.auth.domain.OAuthAccount;
import com.mycompany.englishtutor.module.auth.repository.OAuthAccountRepository;
import com.mycompany.englishtutor.module.tutor.domain.Tutor;
import com.mycompany.englishtutor.module.tutor.repository.TutorRepository;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.domain.UserRole;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GoogleAuthenticationService {
    private static final String PROVIDER = "GOOGLE";

    private final GoogleOAuthClient googleOAuthClient;
    private final OAuthAccountRepository oAuthAccountRepository;
    private final UserRepository userRepository;
    private final AuthenticationService authenticationService;
    private final JdbcTemplate jdbcTemplate;
    private final TutorRepository tutorRepository;

    public String authorizationUrl(String redirectUri, String state, String codeChallenge, String nonce) {
        return googleOAuthClient.buildAuthorizationUrl(redirectUri, state, codeChallenge, nonce);
    }

    @Transactional
    public GoogleAuthenticationResponse authenticate(GoogleOAuthCallbackRequest request) {
        GoogleIdentity identity = googleOAuthClient.exchangeCode(
                request.getCode(), request.getCodeVerifier(), request.getRedirectUri(), request.getNonce());

        UserRole requestedRole = "TUTOR".equals(request.getRole()) ? UserRole.TUTOR : UserRole.PARENT;
        var existingAccount = oAuthAccountRepository.findByProviderAndProviderUserId(PROVIDER, identity.subject());
        boolean newUser = existingAccount.isEmpty();
        User user = existingAccount
                .map(account -> userRepository
                        .findById(account.getUserId())
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED)))
                .orElseGet(() -> requestedRole == UserRole.TUTOR ? createOrLinkTutor(identity) : createParent(identity));

        if (!requestedRole.name().equals(user.getRole())) {
            throw new AppException(ErrorCode.GOOGLE_OAUTH_ACCOUNT_CONFLICT);
        }
        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new AppException(ErrorCode.ACCOUNT_INACTIVE);
        }

        if (!newUser && requestedRole == UserRole.PARENT) {
            user.setFullName(identity.fullName());
            user.setAvatarUrl(identity.avatarUrl());
            user = userRepository.save(user);

            OAuthAccount account = existingAccount.orElseThrow();
            account.setEmail(identity.email());
            account.setAvatarUrl(identity.avatarUrl());
            oAuthAccountRepository.save(account);
            jdbcTemplate.update(
                    "UPDATE parents SET full_name = ?, email = ?, updated_at = NOW() WHERE user_id = ?",
                    identity.fullName(),
                    identity.email(),
                    user.getId());
        }

        String profileStatus = requestedRole == UserRole.TUTOR
                ? tutorRepository.findById(user.getId()).map(Tutor::getProfileStatus).orElse(null)
                : null;

        return GoogleAuthenticationResponse.builder()
                .token(authenticationService.issueToken(user))
                .authenticated(true)
                .newUser(newUser)
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .profileStatus(profileStatus)
                .build();
    }

    /**
     * Gia sư đăng nhập Google lần đầu: nếu email đã có tài khoản gia sư thì liên kết (email đã được Google xác minh),
     * nếu chưa có tài khoản nào thì tạo gia sư mới với hồ sơ INCOMPLETE. Email thuộc vai trò khác thì từ chối.
     */
    private User createOrLinkTutor(GoogleIdentity identity) {
        try {
            var existing = userRepository.findByEmailIgnoreCase(identity.email());
            User user;
            if (existing.isPresent()) {
                user = existing.get();
                if (!UserRole.TUTOR.name().equals(user.getRole())) {
                    throw new AppException(ErrorCode.GOOGLE_OAUTH_ACCOUNT_CONFLICT);
                }
            } else {
                user = userRepository.save(User.builder()
                        .username(uniqueUsername(identity.subject(), "tutor_g_"))
                        .passwordHash(null)
                        .fullName(identity.fullName())
                        .email(identity.email())
                        .avatarUrl(identity.avatarUrl())
                        .role(UserRole.TUTOR.name())
                        .status("ACTIVE")
                        .mustChangePassword(false)
                        .build());
                tutorRepository.save(Tutor.builder().user(user).profileStatus("INCOMPLETE").build());
            }
            oAuthAccountRepository.save(OAuthAccount.builder()
                    .userId(user.getId())
                    .provider(PROVIDER)
                    .providerUserId(identity.subject())
                    .email(identity.email())
                    .avatarUrl(identity.avatarUrl())
                    .build());
            return user;
        } catch (DataIntegrityViolationException exception) {
            throw new AppException(ErrorCode.GOOGLE_OAUTH_ACCOUNT_CONFLICT);
        }
    }

    private User createParent(GoogleIdentity identity) {
        if (userRepository.findByEmailIgnoreCase(identity.email()).isPresent()) {
            throw new AppException(ErrorCode.GOOGLE_OAUTH_ACCOUNT_CONFLICT);
        }

        try {
            User user = userRepository.save(User.builder()
                    .username(uniqueUsername(identity.subject(), "parent_g_"))
                    .passwordHash(null)
                    .fullName(identity.fullName())
                    .email(identity.email())
                    .avatarUrl(identity.avatarUrl())
                    .role(UserRole.PARENT.name())
                    .status("ACTIVE")
                    .mustChangePassword(false)
                    .build());

            oAuthAccountRepository.save(OAuthAccount.builder()
                    .userId(user.getId())
                    .provider(PROVIDER)
                    .providerUserId(identity.subject())
                    .email(identity.email())
                    .avatarUrl(identity.avatarUrl())
                    .build());

            jdbcTemplate.update(
                    "INSERT INTO parents (user_id, full_name, phone, email) VALUES (?, ?, NULL, ?)",
                    user.getId(),
                    identity.fullName(),
                    identity.email());
            return user;
        } catch (DataIntegrityViolationException exception) {
            throw new AppException(ErrorCode.GOOGLE_OAUTH_ACCOUNT_CONFLICT);
        }
    }

    private String uniqueUsername(String providerSubject, String prefix) {
        String normalized = providerSubject.replaceAll("[^a-zA-Z0-9]", "");
        if (normalized.isBlank()) {
            throw new AppException(ErrorCode.GOOGLE_OAUTH_INVALID);
        }
        String base = prefix + normalized.substring(0, Math.min(normalized.length(), 32));
        String candidate = base;
        int suffix = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + "_" + suffix++;
            if (suffix > 999) {
                throw new AppException(ErrorCode.GOOGLE_OAUTH_ACCOUNT_CONFLICT);
            }
        }
        return candidate;
    }
}
