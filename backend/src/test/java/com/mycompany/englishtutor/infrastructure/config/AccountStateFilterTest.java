package com.mycompany.englishtutor.infrastructure.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.module.user.repository.UserRepository.AccountState;

@ExtendWith(MockitoExtension.class)
class AccountStateFilterTest {
    private static final String USERNAME = "lt_0901234567";

    @Mock UserRepository userRepository;

    AccountStateFilter filter;
    MockHttpServletResponse response;
    MockFilterChain chain;

    @BeforeEach
    void setUp() {
        filter = new AccountStateFilter(userRepository);
        response = new MockHttpServletResponse();
        chain = new MockFilterChain();
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "HS512")
                .subject(USERNAME)
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void givenAccount(String role, String status, boolean mustChangePassword) {
        when(userRepository.findAccountState(USERNAME)).thenReturn(Optional.of(new AccountState() {
            @Override
            public String getRole() {
                return role;
            }

            @Override
            public String getStatus() {
                return status;
            }

            @Override
            public boolean getMustChangePassword() {
                return mustChangePassword;
            }
        }));
    }

    private void perform(String method, String path) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        filter.doFilter(request, response, chain);
    }

    private void assertPassed() {
        assertThat(chain.getRequest()).isNotNull();
        assertEquals(200, response.getStatus());
    }

    private void assertBlocked(int code) throws Exception {
        assertThat(chain.getRequest()).isNull();
        assertEquals(403, response.getStatus());
        assertThat(response.getContentAsString()).contains("\"code\":" + code);
    }

    @Test
    void leTanChuaDoiMatKhau_biChanApiNghiepVu() throws Exception {
        givenAccount("RECEPTIONIST", "ACTIVE", true);

        perform("GET", "/api/v1/students");

        assertBlocked(1600);
    }

    @Test
    void keToanChuaDoiMatKhau_biChanApiNghiepVu() throws Exception {
        givenAccount("ACCOUNTANT", "ACTIVE", true);

        perform("GET", "/api/v1/payments");

        assertBlocked(1600);
    }

    @Test
    void leTanChuaDoiMatKhau_vanGoiDuocDoiMatKhau() throws Exception {
        givenAccount("RECEPTIONIST", "ACTIVE", true);

        perform("POST", "/api/v1/auth/change-password");

        assertPassed();
    }

    @Test
    void leTanDaDoiMatKhau_diQua() throws Exception {
        givenAccount("RECEPTIONIST", "ACTIVE", false);

        perform("GET", "/api/v1/students");

        assertPassed();
    }

    @Test
    void giaSuConCoDoiMatKhau_khongBiChan() throws Exception {
        givenAccount("TUTOR", "ACTIVE", true);

        perform("GET", "/api/v1/tutors/me");

        assertPassed();
    }

    @Test
    void hocSinhConCoDoiMatKhau_khongBiChanOBackend() throws Exception {
        givenAccount("STUDENT", "ACTIVE", true);

        perform("GET", "/api/v1/students/me");

        assertPassed();
    }

    @Test
    void taiKhoanBiKhoa_biChanMoiApi() throws Exception {
        givenAccount("TUTOR", "INACTIVE", false);

        perform("GET", "/api/v1/tutors/me");

        assertBlocked(1304);
    }

    @Test
    void taiKhoanBiKhoa_khongDoiDuocMatKhau() throws Exception {
        givenAccount("RECEPTIONIST", "INACTIVE", true);

        perform("POST", "/api/v1/auth/change-password");

        assertBlocked(1304);
    }

    @Test
    void endpointCongKhai_khongTruyVanTaiKhoan() throws Exception {
        perform("POST", "/api/v1/auth/logout");

        assertPassed();
        verify(userRepository, never()).findAccountState(USERNAME);
    }

    @Test
    void chuaDangNhap_diQuaDeSpringSecurityXuLy() throws Exception {
        SecurityContextHolder.clearContext();

        perform("GET", "/api/v1/students");

        assertPassed();
        verify(userRepository, never()).findAccountState(USERNAME);
    }

    @Test
    void khongTimThayTaiKhoan_diQua() throws Exception {
        when(userRepository.findAccountState(USERNAME)).thenReturn(Optional.empty());

        perform("GET", "/api/v1/students");

        assertPassed();
    }
}
