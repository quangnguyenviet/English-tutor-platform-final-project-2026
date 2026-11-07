package com.mycompany.englishtutor.module.matching.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import com.mycompany.englishtutor.module.matching.api.request.ClassRequestSubmitRequest;
import com.mycompany.englishtutor.module.matching.api.response.ClassRequestSubmitResponse;
import com.mycompany.englishtutor.module.tutor.domain.Tutor;
import com.mycompany.englishtutor.module.tutor.repository.TutorRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

/** Unit test luồng phụ huynh gửi yêu cầu từ trang công khai. */
@ExtendWith(MockitoExtension.class)
class ClassRequestSubmitServiceTest {

    private static final String PHONE = "0912345678";
    private static final Long TUTOR_ID = 3L;
    private static final OffsetDateTime CREATED_AT = OffsetDateTime.parse("2026-10-23T10:00:00+07:00");

    @Mock
    JdbcTemplate jdbcTemplate;

    @Mock
    TutorRepository tutorRepository;

    @Mock
    PhoneRateLimiter phoneRateLimiter;

    @Mock
    ParentResolver parentResolver;

    @InjectMocks
    ClassRequestSubmitService service;

    ClassRequestSubmitRequest request;

    @BeforeEach
    void setUp() {
        request = ClassRequestSubmitRequest.builder()
                .parentName("  Nguyễn Lan Anh ")
                .phone("0912 345 678")
                .tutorId(TUTOR_ID)
                .build();
    }

    private void givenExistingParent() {
        when(parentResolver.resolve("Nguyễn Lan Anh", PHONE))
                .thenReturn(new ParentResolver.Parent(7L, "Nguyễn Lan Anh"));
    }

    @Test
    void submit_tutorNotActive_throwsUnavailable() {
        when(tutorRepository.findPublicByIdAndProfileStatus(TUTOR_ID, "ACTIVE")).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> service.submit(request));

        assertEquals(ErrorCode.TUTOR_PROFILE_UNAVAILABLE, ex.getErrorCode());
        verify(phoneRateLimiter, never()).tryAcquire(anyString());
    }

    @Test
    void submit_rateLimited_throwsTooManyRequests() {
        when(tutorRepository.findPublicByIdAndProfileStatus(TUTOR_ID, "ACTIVE"))
                .thenReturn(Optional.of(new Tutor()));
        when(phoneRateLimiter.tryAcquire(PHONE)).thenReturn(false);

        AppException ex = assertThrows(AppException.class, () -> service.submit(request));

        assertEquals(ErrorCode.TOO_MANY_REQUESTS, ex.getErrorCode());
        verify(jdbcTemplate, never()).update(anyString(), any(Object[].class));
    }

    @Test
    void submit_newRequest_insertsNewAndReturnsCode() {
        when(tutorRepository.findPublicByIdAndProfileStatus(TUTOR_ID, "ACTIVE"))
                .thenReturn(Optional.of(new Tutor()));
        when(phoneRateLimiter.tryAcquire(PHONE)).thenReturn(true);
        givenExistingParent();
        when(jdbcTemplate.queryForList(contains("FROM class_requests"), any(Object[].class)))
                .thenReturn(List.of());
        when(jdbcTemplate.queryForMap(contains("INSERT INTO class_requests"), any(Object[].class)))
                .thenReturn(Map.of("id", 12L, "created_at", CREATED_AT));

        ClassRequestSubmitResponse response = service.submit(request);

        assertEquals("REQ-20261023-12", response.getRequestCode());
        verify(jdbcTemplate).queryForMap(contains("INSERT INTO class_requests"), eq(7L), eq(TUTOR_ID));
        verify(jdbcTemplate).update(contains("INSERT INTO notifications"), anyString(), anyString(), eq(12L));
    }

    @Test
    void submit_generalRequestWithoutTutor_doesNotCheckTutor() {
        request.setTutorId(null);
        when(phoneRateLimiter.tryAcquire(PHONE)).thenReturn(true);
        givenExistingParent();
        when(jdbcTemplate.queryForList(contains("FROM class_requests"), any(Object[].class)))
                .thenReturn(List.of());
        when(jdbcTemplate.queryForMap(contains("INSERT INTO class_requests"), any(Object[].class)))
                .thenReturn(Map.of("id", 5L, "created_at", CREATED_AT));

        ClassRequestSubmitResponse response = service.submit(request);

        assertTrue(response.getRequestCode().endsWith("-5"));
        verify(tutorRepository, never()).findPublicByIdAndProfileStatus(anyLong(), anyString());
    }

    @Test
    void submit_duplicatePendingRequest_returnsExistingCodeWithoutInsert() {
        when(tutorRepository.findPublicByIdAndProfileStatus(TUTOR_ID, "ACTIVE"))
                .thenReturn(Optional.of(new Tutor()));
        when(phoneRateLimiter.tryAcquire(PHONE)).thenReturn(true);
        givenExistingParent();
        when(jdbcTemplate.queryForList(contains("FROM class_requests"), any(Object[].class)))
                .thenReturn(List.of(Map.of("id", 9L, "created_at", CREATED_AT)));

        ClassRequestSubmitResponse response = service.submit(request);

        assertEquals("REQ-20261023-9", response.getRequestCode());
        verify(jdbcTemplate, never()).queryForMap(anyString(), any(Object[].class));
        verify(jdbcTemplate, never()).update(contains("notifications"), any(Object[].class));
    }

    @Test
    void submit_sameParentWithoutMarksAndInternationalPhone_createsRequest() {
        request.setTutorId(null);
        request.setParentName("nguyen  lan anh");
        request.setPhone("+84912345678");
        when(phoneRateLimiter.tryAcquire(PHONE)).thenReturn(true);
        when(parentResolver.resolve("nguyen  lan anh", PHONE))
                .thenReturn(new ParentResolver.Parent(7L, "Nguyễn Lan Anh"));
        when(jdbcTemplate.queryForList(contains("FROM class_requests"), any(Object[].class)))
                .thenReturn(List.of());
        when(jdbcTemplate.queryForMap(contains("INSERT INTO class_requests"), any(Object[].class)))
                .thenReturn(Map.of("id", 30L, "created_at", CREATED_AT));

        service.submit(request);

        verify(jdbcTemplate).queryForMap(contains("INSERT INTO class_requests"), eq(7L), any());
    }

    @Test
    void submit_phoneOfAnotherParent_rejectsWithoutCreatingRequest() {
        request.setTutorId(null);
        when(phoneRateLimiter.tryAcquire(PHONE)).thenReturn(true);
        when(parentResolver.resolve("Nguyễn Lan Anh", PHONE))
                .thenReturn(new ParentResolver.Parent(7L, "Phạm Công Minh"));

        AppException ex = assertThrows(AppException.class, () -> service.submit(request));

        assertEquals(ErrorCode.PARENT_PHONE_NAME_MISMATCH, ex.getErrorCode());
        assertFalse(ex.getMessage() != null && ex.getMessage().contains("Phạm Công Minh"));
        verify(jdbcTemplate, never()).queryForMap(anyString(), any(Object[].class));
    }
}
