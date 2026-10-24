package com.mycompany.englishtutor.module.matching.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.withSettings;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.time.OffsetDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import com.mycompany.englishtutor.module.matching.api.response.TutorApplicationResponse;
import com.mycompany.englishtutor.module.matching.api.response.TutorOpenClassRequestResponse;

/** Test SQL và row mapper của truy vấn đọc lớp cần gia sư. */
@ExtendWith(MockitoExtension.class)
class TutorClassRequestQueryRepositoryTest {

    private static final Long TUTOR_ID = 3L;
    private static final Long REQUEST_ID = 7L;
    private static final OffsetDateTime CREATED_AT = OffsetDateTime.parse("2026-10-23T10:00:00+07:00");

    @Mock
    JdbcTemplate jdbcTemplate;

    @InjectMocks
    TutorClassRequestQueryRepository repository;

    @Test
    void findOpenRequests_mapsAppliedFlagAndGeneralLocation() throws Exception {
        when(jdbcTemplate.queryForObject(contains("COUNT(*)"), eq(Long.class), any(Object[].class)))
                .thenReturn(1L);

        ArgumentCaptor<RowMapper<TutorOpenClassRequestResponse>> mapperCaptor =
                ArgumentCaptor.forClass(RowMapper.class);
        when(jdbcTemplate.query(contains("LEFT JOIN class_applications"), mapperCaptor.capture(),
                        any(Object[].class)))
                .thenReturn(List.of());

        repository.findOpenRequests(TUTOR_ID,
                new TutorClassRequestQueryRepository.Filter(null, null, null, null), 0, 20);

        ResultSet rs = mockResultSet();
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
    void findOpenRequests_noApplication_appliedFalse() throws Exception {
        when(jdbcTemplate.queryForObject(contains("COUNT(*)"), eq(Long.class), any(Object[].class)))
                .thenReturn(0L);

        ArgumentCaptor<RowMapper<TutorOpenClassRequestResponse>> mapperCaptor =
                ArgumentCaptor.forClass(RowMapper.class);
        when(jdbcTemplate.query(contains("LEFT JOIN class_applications"), mapperCaptor.capture(),
                        any(Object[].class)))
                .thenReturn(List.of());

        repository.findOpenRequests(TUTOR_ID,
                new TutorClassRequestQueryRepository.Filter(null, null, null, null), 0, 20);

        ResultSet rs = mockResultSet();
        when(rs.getLong("id")).thenReturn(REQUEST_ID);
        when(rs.getString("address")).thenReturn(null);

        TutorOpenClassRequestResponse row = mapperCaptor.getValue().mapRow(rs, 0);

        assertFalse(row.isApplied());
        assertNull(row.getApplicationId());
        assertNull(row.getGeneralLocation());
    }

    @Test
    void findOpenRequests_keywordFiltersAndFeeSort_buildsSqlAndParams() {
        when(jdbcTemplate.queryForObject(contains("COUNT(*)"), eq(Long.class), any(Object[].class)))
                .thenReturn(0L);
        when(jdbcTemplate.query(contains("ORDER BY cr.price_per_session ASC"), any(RowMapper.class),
                        any(Object[].class)))
                .thenReturn(List.of());

        repository.findOpenRequests(TUTOR_ID,
                new TutorClassRequestQueryRepository.Filter("IELTS", "ONLINE", "thpt", "fee_asc"), 1, 10);

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
    void findOpenRequest_notFound_returnsEmpty() {
        when(jdbcTemplate.query(contains("AND cr.id = ?"), any(RowMapper.class), any(Object[].class)))
                .thenReturn(List.of());

        assertTrue(repository.findOpenRequest(TUTOR_ID, REQUEST_ID).isEmpty());
    }

    @Test
    void findApplicationsByTutor_keepsMatchedHistory() throws Exception {
        ArgumentCaptor<RowMapper<TutorApplicationResponse>> mapperCaptor =
                ArgumentCaptor.forClass(RowMapper.class);
        when(jdbcTemplate.query(contains("ORDER BY ca.applied_at DESC"), mapperCaptor.capture(),
                        any(Object[].class)))
                .thenReturn(List.of());

        repository.findApplicationsByTutor(TUTOR_ID);

        ResultSet rs = mockResultSet();
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

    private static ResultSet mockResultSet() {
        return mock(ResultSet.class, withSettings().lenient());
    }
}
