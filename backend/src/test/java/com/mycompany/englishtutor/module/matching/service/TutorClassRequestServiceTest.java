package com.mycompany.englishtutor.module.matching.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.withSettings;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mycompany.englishtutor.module.matching.api.request.ApplyClassRequest;
import com.mycompany.englishtutor.module.matching.api.response.TutorApplicationResponse;
import com.mycompany.englishtutor.module.matching.api.response.TutorOpenClassRequestResponse;
import com.mycompany.englishtutor.module.tutor.domain.Tutor;
import com.mycompany.englishtutor.module.tutor.domain.enums.ProfileStatus;
import com.mycompany.englishtutor.module.tutor.repository.TutorRepository;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

/** Unit test luồng gia sư xem lớp đang tuyển, ứng tuyển và rút đơn (FR-08). */
@ExtendWith(MockitoExtension.class)
class TutorClassRequestServiceTest {

    private static final Long TUTOR_ID = 3L;
    private static final Long REQUEST_ID = 7L;
    private static final OffsetDateTime CREATED_AT = OffsetDateTime.parse("2026-10-23T10:00:00+07:00");

    @Mock
    JdbcTemplate jdbcTemplate;

    @Mock
    UserRepository userRepository;

    @Mock
    TutorRepository tutorRepository;

    @InjectMocks
    TutorClassRequestService service;

    User user;

    @BeforeEach
    void setUp() {
        user = User.builder().id(TUTOR_ID).fullName("Phạm Ngọc Gia Sư").build();
        when(userRepository.findByUsername("tutor")).thenReturn(Optional.of(user));
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken("tutor", null));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ------------------------------------------------------------- list/detail

    @Test
    void getOpenRequests_mapsAppliedFlagAndGeneralLocation() throws Exception {
        when(jdbcTemplate.queryForObject(contains("COUNT(*)"), eq(Long.class), any(Object[].class)))
                .thenReturn(1L);

        ArgumentCaptor<RowMapper<TutorOpenClassRequestResponse>> mapperCaptor =
                ArgumentCaptor.forClass(RowMapper.class);
        when(jdbcTemplate.query(contains("LEFT JOIN class_applications"), mapperCaptor.capture(),
                        any(Object[].class)))
                .thenReturn(List.of());

        service.getOpenRequests(null, null, null, null, 0, 20);

        ResultSet rs = mock(ResultSet.class, withSettings().lenient());
        when(rs.getLong("id")).thenReturn(REQUEST_ID);
        when(rs.getObject("application_id")).thenReturn(42L);
        when(rs.getString("class_requirement")).thenReturn("Luyện IELTS 5.0 lên 6.5");
        when(rs.getString("teaching_mode")).thenReturn("ONLINE");
        when(rs.getBigDecimal("price_per_session")).thenReturn(BigDecimal.valueOf(300_000));
        when(rs.getString("preferred_schedule")).thenReturn("Thứ 3 và thứ 6");
        when(rs.getString("tutor_requirement")).thenReturn("IELTS 7.5");
        when(rs.getString("grade")).thenReturn("Lớp 10");
        when(rs.getString("school")).thenReturn("THPT Việt Đức");
        when(rs.getString("learning_goal")).thenReturn("Đạt IELTS 6.5");
        when(rs.getString("gender")).thenReturn("MALE");
        when(rs.getString("address")).thenReturn("123 Nguyễn Trãi, Thanh Xuân, Hà Nội");
        when(rs.getString("my_message")).thenReturn("Em có kinh nghiệm luyện thi.");
        when(rs.getObject("created_at", OffsetDateTime.class)).thenReturn(CREATED_AT);
        when(rs.getObject("my_applied_at", OffsetDateTime.class)).thenReturn(CREATED_AT);

        TutorOpenClassRequestResponse row = mapperCaptor.getValue().mapRow(rs, 0);

        assertTrue(row.isApplied());
        assertEquals(42L, row.getApplicationId());
        assertEquals("LOP-ENG-0007", row.getRequestCode());
        assertEquals("Thanh Xuân, Hà Nội", row.getGeneralLocation());
        assertEquals("Em có kinh nghiệm luyện thi.", row.getMyMessage());
        assertEquals("Lớp 10", row.getGradeLevel());
    }

    @Test
    void getOpenRequests_noApplication_appliedFalse() throws Exception {
        when(jdbcTemplate.queryForObject(contains("COUNT(*)"), eq(Long.class), any(Object[].class)))
                .thenReturn(0L);

        ArgumentCaptor<RowMapper<TutorOpenClassRequestResponse>> mapperCaptor =
                ArgumentCaptor.forClass(RowMapper.class);
        when(jdbcTemplate.query(contains("LEFT JOIN class_applications"), mapperCaptor.capture(),
                        any(Object[].class)))
                .thenReturn(List.of());

        service.getOpenRequests(null, null, null, null, 0, 20);

        ResultSet rs = mock(ResultSet.class, withSettings().lenient());
        when(rs.getLong("id")).thenReturn(REQUEST_ID);
        when(rs.getString("address")).thenReturn(null);

        TutorOpenClassRequestResponse row = mapperCaptor.getValue().mapRow(rs, 0);

        assertFalse(row.isApplied());
        assertNull(row.getApplicationId());
        assertNull(row.getGeneralLocation());
    }

    @Test
    void getOpenRequests_keywordFiltersAndFeeSort_buildsSqlAndParams() {
        when(jdbcTemplate.queryForObject(contains("COUNT(*)"), eq(Long.class), any(Object[].class)))
                .thenReturn(0L);
        when(jdbcTemplate.query(contains("ORDER BY cr.price_per_session ASC"), any(RowMapper.class),
                        any(Object[].class)))
                .thenReturn(List.of());

        service.getOpenRequests("IELTS", "ONLINE", "thpt", "fee_asc", 1, 10);

        ArgumentCaptor<Object[]> paramsCaptor = ArgumentCaptor.forClass(Object[].class);
        verify(jdbcTemplate).query(
                contains("unaccent(lower(cr.class_requirement))"),
                any(RowMapper.class),
                paramsCaptor.capture());

        List<Object> params = List.of(paramsCaptor.getValue());
        assertEquals(TUTOR_ID, params.get(0));
        assertEquals("ONLINE", params.get(1));
        assertTrue(params.contains("%ielts%"));
        assertEquals(6, params.stream().filter("%ielts%"::equals).count());
        assertEquals(10, params.get(params.size() - 2));
        assertEquals(10L, params.get(params.size() - 1));
    }

    @Test
    void getOpenRequest_notFound_throwsNotFound() {
        when(jdbcTemplate.query(contains("AND cr.id = ?"), any(RowMapper.class), any(Object[].class)))
                .thenReturn(List.of());

        AppException ex = assertThrows(AppException.class, () -> service.getOpenRequest(REQUEST_ID));

        assertEquals(ErrorCode.CLASS_REQUEST_NOT_FOUND, ex.getErrorCode());
    }

    // ------------------------------------------------------------------ apply

    @Test
    void apply_tutorNotActive_throws403() {
        when(tutorRepository.findById(TUTOR_ID))
                .thenReturn(Optional.of(Tutor.builder()
                        .profileStatus(ProfileStatus.PENDING.name())
                        .build()));

        AppException ex = assertThrows(AppException.class,
                () -> service.apply(REQUEST_ID, new ApplyClassRequest("Lời nhắn hợp lệ")));

        assertEquals(ErrorCode.TUTOR_NOT_ACTIVE, ex.getErrorCode());
        verify(jdbcTemplate, never()).queryForList(contains("FOR UPDATE"), eq(String.class),
                any(Object[].class));
    }

    @Test
    void apply_requestMissing_throws404() {
        givenActiveTutor();
        when(jdbcTemplate.queryForList(contains("FOR UPDATE"), eq(String.class), any(Object[].class)))
                .thenReturn(List.of());

        AppException ex = assertThrows(AppException.class,
                () -> service.apply(REQUEST_ID, new ApplyClassRequest("Lời nhắn hợp lệ")));

        assertEquals(ErrorCode.CLASS_REQUEST_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void apply_requestNotOpen_throws409() {
        givenActiveTutor();
        when(jdbcTemplate.queryForList(contains("FOR UPDATE"), eq(String.class), any(Object[].class)))
                .thenReturn(List.of("MATCHED"));

        AppException ex = assertThrows(AppException.class,
                () -> service.apply(REQUEST_ID, new ApplyClassRequest("Lời nhắn hợp lệ")));

        assertEquals(ErrorCode.CLASS_REQUEST_NOT_OPEN, ex.getErrorCode());
    }

    @Test
    void apply_success_insertsApplicationAndNotifiesReceptionists() {
        givenActiveTutor();
        when(jdbcTemplate.queryForList(contains("FOR UPDATE"), eq(String.class), any(Object[].class)))
                .thenReturn(List.of("OPEN"));
        when(jdbcTemplate.queryForObject(contains("INSERT INTO class_applications"), eq(Long.class),
                        any(Object[].class)))
                .thenReturn(10L);

        TutorApplicationResponse response =
                service.apply(REQUEST_ID, new ApplyClassRequest("  Em nhận lớp được  "));

        assertEquals(10L, response.getApplicationId());
        assertEquals("APPLIED", response.getStatus());
        assertEquals("Em nhận lớp được", response.getMessage());
        verify(jdbcTemplate).queryForObject(contains("INSERT INTO class_applications"), eq(Long.class),
                eq(REQUEST_ID), eq(TUTOR_ID), eq("Em nhận lớp được"));
        verify(jdbcTemplate).update(
                contains("INSERT INTO notifications"),
                eq("Gia sư ứng tuyển lớp mới"),
                contains("Phạm Ngọc Gia Sư"),
                eq(REQUEST_ID));
    }

    @Test
    void apply_duplicate_throwsAlreadyApplied() {
        givenActiveTutor();
        when(jdbcTemplate.queryForList(contains("FOR UPDATE"), eq(String.class), any(Object[].class)))
                .thenReturn(List.of("OPEN"));
        when(jdbcTemplate.queryForObject(contains("INSERT INTO class_applications"), eq(Long.class),
                        any(Object[].class)))
                .thenThrow(new DuplicateKeyException("uq_class_applications"));

        AppException ex = assertThrows(AppException.class,
                () -> service.apply(REQUEST_ID, new ApplyClassRequest("Lời nhắn hợp lệ")));

        assertEquals(ErrorCode.CLASS_ALREADY_APPLIED, ex.getErrorCode());
    }

    // --------------------------------------------------------------- withdraw

    @Test
    void withdraw_notOwned_throws404AndDoesNotDelete() {
        givenWithdrawState(99L, "APPLIED", "OPEN", false);

        AppException ex = assertThrows(AppException.class, () -> service.withdrawApplication(9L));

        assertEquals(ErrorCode.APPLICATION_NOT_FOUND, ex.getErrorCode());
        verify(jdbcTemplate, never()).update(contains("DELETE FROM class_applications"), eq(9L));
    }

    @Test
    void withdraw_applicationNotApplied_throws409() {
        givenWithdrawState(TUTOR_ID, "SELECTED", "MATCHED", true);

        AppException ex = assertThrows(AppException.class, () -> service.withdrawApplication(9L));

        assertEquals(ErrorCode.APPLICATION_NOT_WITHDRAWABLE, ex.getErrorCode());
    }

    @Test
    void withdraw_requestMatched_throws409() {
        givenWithdrawState(TUTOR_ID, "APPLIED", "MATCHED", false);

        AppException ex = assertThrows(AppException.class, () -> service.withdrawApplication(9L));

        assertEquals(ErrorCode.APPLICATION_NOT_WITHDRAWABLE, ex.getErrorCode());
    }

    @Test
    void withdraw_selectedSibling_throws409() {
        givenWithdrawState(TUTOR_ID, "APPLIED", "OPEN", true);

        AppException ex = assertThrows(AppException.class, () -> service.withdrawApplication(9L));

        assertEquals(ErrorCode.APPLICATION_NOT_WITHDRAWABLE, ex.getErrorCode());
    }

    @Test
    void withdraw_success_deletesRow() {
        givenWithdrawState(TUTOR_ID, "APPLIED", "OPEN", false);

        service.withdrawApplication(9L);

        verify(jdbcTemplate).update(contains("DELETE FROM class_applications"), eq(9L));
    }

    // -------------------------------------------------------------- my history

    @Test
    void getMyApplications_keepsMatchedHistory() throws Exception {
        ArgumentCaptor<RowMapper<TutorApplicationResponse>> mapperCaptor =
                ArgumentCaptor.forClass(RowMapper.class);
        when(jdbcTemplate.query(contains("ORDER BY ca.applied_at DESC"), mapperCaptor.capture(),
                        any(Object[].class)))
                .thenReturn(List.of());

        service.getMyApplications();

        ResultSet rs = mock(ResultSet.class, withSettings().lenient());
        when(rs.getLong("application_id")).thenReturn(9L);
        when(rs.getString("application_status")).thenReturn("REJECTED");
        when(rs.getString("message")).thenReturn("Lời nhắn");
        when(rs.getObject("applied_at", OffsetDateTime.class)).thenReturn(CREATED_AT);
        when(rs.getLong("request_id")).thenReturn(REQUEST_ID);
        when(rs.getString("request_status")).thenReturn("MATCHED");
        when(rs.getString("class_requirement")).thenReturn("Luyện IELTS");
        when(rs.getString("teaching_mode")).thenReturn("ONLINE");
        when(rs.getObject("request_created_at", OffsetDateTime.class)).thenReturn(CREATED_AT);

        TutorApplicationResponse row = mapperCaptor.getValue().mapRow(rs, 0);

        assertEquals(9L, row.getApplicationId());
        assertEquals("REJECTED", row.getStatus());
        assertEquals("MATCHED", row.getClassRequest().getStatus());
        assertEquals("LOP-ENG-0007", row.getClassRequest().getRequestCode());
    }

    // ----------------------------------------------------------------- helper

    private void givenActiveTutor() {
        when(tutorRepository.findById(TUTOR_ID))
                .thenReturn(Optional.of(Tutor.builder()
                        .profileStatus(ProfileStatus.ACTIVE.name())
                        .build()));
    }

    private void givenWithdrawState(long ownerId, String appStatus, String requestStatus,
            boolean hasSelected) {
        when(jdbcTemplate.query(contains("has_selected"), any(RowMapper.class), any(Object[].class)))
                .thenAnswer(invocation -> {
                    RowMapper<?> mapper = invocation.getArgument(1);
                    ResultSet rs = mock(ResultSet.class, withSettings().lenient());
                    when(rs.getLong("tutor_id")).thenReturn(ownerId);
                    when(rs.getString("app_status")).thenReturn(appStatus);
                    when(rs.getString("request_status")).thenReturn(requestStatus);
                    when(rs.getBoolean("has_selected")).thenReturn(hasSelected);
                    return List.of(mapper.mapRow(rs, 0));
                });
    }
}
