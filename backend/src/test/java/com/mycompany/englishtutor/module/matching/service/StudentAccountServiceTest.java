package com.mycompany.englishtutor.module.matching.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.mycompany.englishtutor.module.matching.service.StudentAccountService.StudentAccount;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;

class StudentAccountServiceTest {

    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final UserRepository users = mock(UserRepository.class);
    private final PasswordEncoder encoder = mock(PasswordEncoder.class);
    private final StudentAccountService service = new StudentAccountService(jdbc, users, encoder);

    @Test
    void ensureStudent_existingChildWithSameName_isReusedWithoutCreatingAccount() {
        when(jdbc.queryForList(contains("FROM students"), eq(Long.class), eq(3L), eq("Lê Hoàng Nam")))
                .thenReturn(List.of(77L));

        StudentAccount account = service.ensureStudent(3L, "Lê Hoàng Nam", "0981234567", null, null, null);

        assertEquals(77L, account.id());
        assertFalse(account.created());
        verify(users, never()).save(any());
    }

    @Test
    void ensureStudent_newChild_createsUserWithDefaultPasswordAndDoesNotStoreParentPhone() {
        when(jdbc.queryForList(contains("FROM students"), eq(Long.class), any(), anyString())).thenReturn(List.of());
        when(users.existsByUsername("hs_0981234567")).thenReturn(true);
        when(users.existsByUsername("hs_0981234567_1")).thenReturn(false);
        when(encoder.encode(StudentAccountService.DEFAULT_STUDENT_PASSWORD)).thenReturn("hash");
        when(users.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(90L);
            return u;
        });

        StudentAccount account = service.ensureStudent(3L, "Trần Bảo Ngọc", "0981234567", "Lớp 11", null, null);

        assertTrue(account.created());
        assertEquals(90L, account.id());
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(users).save(captor.capture());
        assertEquals("hs_0981234567_1", captor.getValue().getUsername());
        assertEquals("STUDENT", captor.getValue().getRole());
        assertTrue(captor.getValue().isMustChangePassword());
        assertEquals(null, captor.getValue().getPhone());
    }
}
