package com.mycompany.englishtutor.module.auth.service;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.StringJoiner;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.mycompany.englishtutor.module.auth.api.request.AuthenticationRequest;
import com.mycompany.englishtutor.module.auth.api.request.IntrospectRequest;
import com.mycompany.englishtutor.module.auth.api.request.LogoutRequest;
import com.mycompany.englishtutor.module.auth.api.request.RefreshRequest;
import com.mycompany.englishtutor.module.auth.api.request.TutorRegistrationRequest;
import com.mycompany.englishtutor.module.auth.api.response.AuthenticationResponse;
import com.mycompany.englishtutor.module.auth.api.response.IntrospectResponse;
import com.mycompany.englishtutor.module.auth.api.response.TutorRegistrationResponse;
import com.mycompany.englishtutor.module.auth.domain.InvalidatedToken;
import com.mycompany.englishtutor.module.auth.repository.InvalidatedTokenRepository;
import com.mycompany.englishtutor.module.tutor.domain.Tutor;
import com.mycompany.englishtutor.module.tutor.repository.TutorRepository;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.domain.UserRole;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationService {
    UserRepository userRepository;
    InvalidatedTokenRepository invalidatedTokenRepository;
    TutorRepository tutorRepository;
    @NonFinal
    @Value("${jwt.signerKey}")
    protected String SIGNER_KEY;

    @NonFinal
    @Value("${jwt.valid-duration}")
    protected long VALID_DURATION;

    @NonFinal
    @Value("${jwt.refreshable-duration}")
    protected long REFRESHABLE_DURATION;

    public IntrospectResponse introspect(IntrospectRequest request) throws JOSEException, ParseException {
        var token = request.getToken();
        boolean isValid = true;

        try {
            verifyToken(token, false);
        } catch (AppException e) {
            isValid = false;
        }

        return IntrospectResponse.builder().valid(isValid).build();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        var user = userRepository
                .findByUsername(request.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());

        if (!authenticated) throw new AppException(ErrorCode.UNAUTHENTICATED);

        var token = generateToken(user);

        return AuthenticationResponse.builder().token(token).authenticated(true).build();
    }

    /**
     * Đăng ký tài khoản gia sư từ frontend (UC-T01).
     * - Tạo {@link User} với role = TUTOR, status = ACTIVE, mustChangePassword = true.
     * - Tạo {@link Tutor} với profile_status = INCOMPLETE (chờ gia sư hoàn thiện hồ sơ).
     * - Trả về JWT để frontend dùng cho các API xác thực sau.
     *
     * @param request thông tin đăng ký (fullName, email, password)
     * @return TutorRegistrationResponse chứa token + thông tin user
     */
    public TutorRegistrationResponse registerTutor(TutorRegistrationRequest request) {
        log.info("Starting tutor registration for email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Email already exists: {}", request.getEmail());
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        String username = deriveUsername(request.getEmail());
        log.info("Derived username: {}", username);

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

        User user = User.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .email(request.getEmail())
                .role(UserRole.TUTOR.name())
                .status("ACTIVE")
                .mustChangePassword(true)
                .build();

        try {
            user = userRepository.save(user);
            log.info("User saved successfully with id: {}", user.getId());
        } catch (org.springframework.dao.DataIntegrityViolationException exception) {
            log.error("DataIntegrityViolationException during user save", exception);
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        } catch (Exception exception) {
            log.error("Unexpected error during user save", exception);
            throw exception;
        }

        // Tạo bản ghi tutors với profile_status = INCOMPLETE
        // Lưu ý: Với @MapsId, KHÔNG set id thủ công - Hibernate tự lấy từ User
        Tutor tutor = Tutor.builder()
                .user(user)
                .profileStatus("INCOMPLETE")
                .build();
        tutorRepository.save(tutor);

        String token = generateToken(user);

        return TutorRegistrationResponse.builder()
                .token(token)
                .authenticated(true)
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .profileStatus(tutor.getProfileStatus())
                .build();
    }

    /**
     * Derive username từ email local-part. Nếu đã tồn tại, append hậu tố số.
     * VD: nguyenvana@gmail.com -> "nguyenvana", nếu trùng -> "nguyenvana_1", ...
     */
    private String deriveUsername(String email) {
        String localPart = email.substring(0, email.indexOf('@'));
        // Chuẩn hoá: chỉ giữ chữ thường, số, dấu gạch dưới; các ký tự khác thay bằng _
        String base = localPart.toLowerCase().replaceAll("[^a-z0-9_]", "_");
        if (base.length() > 40) {
            base = base.substring(0, 40);
        }
        String candidate = base;
        int suffix = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + "_" + suffix++;
            if (suffix > 999) {
                throw new AppException(ErrorCode.TUTOR_REGISTRATION_FAILED);
            }
        }
        return candidate;
    }

    public void logout(LogoutRequest request) throws ParseException, JOSEException {
        try {
            var signedJWT = verifyToken(request.getToken(), true);
            invalidate(signedJWT);
        } catch (AppException exception) {
            log.info("Token already expired");
        }
    }

    public AuthenticationResponse refreshToken(RefreshRequest request) throws ParseException, JOSEException {
        var signedJWT = verifyToken(request.getToken(), true);
        invalidate(signedJWT);

        var username = signedJWT.getJWTClaimsSet().getSubject();

        var user =
                userRepository.findByUsername(username).orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        var token = generateToken(user);

        return AuthenticationResponse.builder().token(token).authenticated(true).build();
    }

    private void invalidate(SignedJWT signedJWT) throws ParseException {
        invalidatedTokenRepository.save(InvalidatedToken.builder()
                .id(signedJWT.getJWTClaimsSet().getJWTID())
                .expiryTime(signedJWT.getJWTClaimsSet().getExpirationTime())
                .build());
    }

    private String generateToken(User user) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getUsername())
                .issuer("devteria.com")
                .issueTime(new Date())
                .expirationTime(new Date(
                        Instant.now().plus(VALID_DURATION, ChronoUnit.SECONDS).toEpochMilli()))
                .jwtID(UUID.randomUUID().toString())
                .claim("scope", buildScope(user))
                .build();

        Payload payload = new Payload(jwtClaimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(header, payload);

        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            log.error("Cannot create token", e);
            throw new RuntimeException(e);
        }
    }

    private SignedJWT verifyToken(String token, boolean isRefresh) throws JOSEException, ParseException {
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());

        SignedJWT signedJWT = SignedJWT.parse(token);

        Date expiryTime = (isRefresh)
                ? new Date(signedJWT
                        .getJWTClaimsSet()
                        .getIssueTime()
                        .toInstant()
                        .plus(REFRESHABLE_DURATION, ChronoUnit.SECONDS)
                        .toEpochMilli())
                : signedJWT.getJWTClaimsSet().getExpirationTime();

        var verified = signedJWT.verify(verifier);

        if (!(verified && expiryTime.after(new Date()))) throw new AppException(ErrorCode.UNAUTHENTICATED);

        if (invalidatedTokenRepository.existsById(signedJWT.getJWTClaimsSet().getJWTID())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        return signedJWT;
    }

    private String buildScope(User user) {
        StringJoiner stringJoiner = new StringJoiner(" ");

        if (user.getRole() != null) {
            stringJoiner.add("ROLE_" + user.getRole());
        }

        return stringJoiner.toString();
    }
}
