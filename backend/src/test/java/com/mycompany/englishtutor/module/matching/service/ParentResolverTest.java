package com.mycompany.englishtutor.module.matching.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.stubbing.OngoingStubbing;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import com.mycompany.englishtutor.module.matching.service.ParentResolver.Parent;

@ExtendWith(MockitoExtension.class)
class ParentResolverTest {

    private static final String PHONE = "0984453212";

    @Mock
    JdbcTemplate jdbcTemplate;

    @InjectMocks
    ParentResolver resolver;

    @Test
    void sameName_ignoresCaseSpacesAndVietnameseMarks() {
        assertTrue(ParentResolver.sameName("Nguyễn Văn Đức", "nguyen  van   duc "));
        assertFalse(ParentResolver.sameName("Nguyễn Văn Đức", "Nguyễn Văn Minh"));
    }

    @Test
    void resolve_existingPhone_doesNotInsert() {
        givenParents(List.of(new Parent(7L, "Phạm Công Minh")));

        Parent parent = resolver.resolve("Tên khác", PHONE);

        assertEquals(7L, parent.id());
        assertEquals("Phạm Công Minh", parent.fullName());
        verify(jdbcTemplate, never()).queryForList(anyString(), eq(Long.class), any(), any());
    }

    @Test
    void resolve_newPhone_insertsParent() {
        givenParents(List.of());
        when(jdbcTemplate.queryForList(contains("ON CONFLICT"), eq(Long.class), any(), any()))
                .thenReturn(List.of(9L));

        Parent parent = resolver.resolve("Phạm Công Minh", PHONE);

        assertEquals(new Parent(9L, "Phạm Công Minh"), parent);
    }

    @Test
    void resolve_lostInsertRace_returnsWinnerSoCallerCanCompareName() {
        givenParents(List.of(), List.of(new Parent(7L, "Lê Thị Hoa")));
        when(jdbcTemplate.queryForList(contains("ON CONFLICT"), eq(Long.class), any(), any()))
                .thenReturn(List.of());

        Parent parent = resolver.resolve("Phạm Công Minh", PHONE);

        assertEquals(new Parent(7L, "Lê Thị Hoa"), parent);
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private void givenParents(List... results) {
        OngoingStubbing<List> stubbing =
                when((List) jdbcTemplate.query(contains("FROM parents"), any(RowMapper.class), eq(PHONE)));
        for (List result : results) {
            stubbing = stubbing.thenReturn(result);
        }
    }
}
