package com.mycompany.englishtutor.module.staff.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.staff.api.request.StudentStatusUpdateRequest;
import com.mycompany.englishtutor.module.staff.api.response.StudentClassResponse;
import com.mycompany.englishtutor.module.staff.api.response.StudentDetailResponse;
import com.mycompany.englishtutor.module.staff.repository.StudentQueryRepository;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

/**
 * Unit test nghiệp vụ quản lý học sinh của Lễ tân / Admin (UC-REC-11, UC-ADM-10).
 */
@ExtendWith(MockitoExtension.class)
class StudentManagementServiceTest {

    private static final Long STUDENT_ID = 5L;
    private static final Long RECEPTIONIST_ID = 2L;

    @Mock
    StudentQueryRepository studentQueryRepository;

    @Mock
    UserRepository userRepository;

    @Mock
    AuditLogService auditLogService;

    @InjectMocks
    StudentManagementService studentManagementService;

    User student;
    User receptionist;

    @BeforeEach
    void setUp() {
        student = User.builder()
                .id(STUDENT_ID)
                .username("hs_0911000001")
                .fullName("Nguyễn Minh Khôi")
                .role("STUDENT")
                .status("ACTIVE")
                .build();
        receptionist = User.builder()
                .id(RECEPTIONIST_ID)
                .username("letan01")
                .fullName("Lê Thị Lễ Tân")
                .role("RECEPTIONIST")
                .status("ACTIVE")
                .build();
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken("letan01", null, List.of()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private static StudentClassResponse classWithStatus(long id, String status) {
        return StudentClassResponse.builder().id(id).className("Lớp " + id).status(status).build();
    }

    // -------------------------------------------------------------- getStudent

    @Test
    void getStudent_splitsCurrentAndPastClasses() {
        when(studentQueryRepository.findDetail(STUDENT_ID))
                .thenReturn(Optional.of(StudentDetailResponse.builder().id(STUDENT_ID).build()));
        when(studentQueryRepository.findClasses(STUDENT_ID)).thenReturn(List.of(
                classWithStatus(1, "ACTIVE"),
                classWithStatus(2, "TRIAL"),
                classWithStatus(3, "COMPLETED"),
                classWithStatus(4, "CANCELLED")));

        StudentDetailResponse detail = studentManagementService.getStudent(STUDENT_ID);

        assertThat(detail.getCurrentClasses()).extracting(StudentClassResponse::getId).containsExactly(1L, 2L);
        assertThat(detail.getPastClasses()).extracting(StudentClassResponse::getId).containsExactly(3L, 4L);
    }

    @Test
    void getStudent_notFound_throws404() {
        when(studentQueryRepository.findDetail(STUDENT_ID)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> studentManagementService.getStudent(STUDENT_ID));

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.STUDENT_NOT_FOUND);
    }

    // -------------------------------------------------------------- getStudents / counts

    @Test
    void getStudents_normalizesFilters() {
        studentManagementService.getStudents("inactive", "khoi", "studying", 0, 20);

        verify(studentQueryRepository).search("INACTIVE", "khoi", "STUDYING", 0, 20);
    }

    @Test
    void getStudents_allFiltersMeanNoFilter() {
        studentManagementService.getStudents("ALL", null, "ALL", 0, 20);

        verify(studentQueryRepository).search(isNull(), isNull(), isNull(), eq(0), eq(20));
    }

    @Test
    void getStudents_invalidStatusFilter_throws400() {
        AppException ex = assertThrows(AppException.class,
                () -> studentManagementService.getStudents("LOCKED", null, null, 0, 20));

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.INVALID_STUDENT_FILTER);
    }

    @Test
    void getStudents_invalidLearningFilter_throws400() {
        AppException ex = assertThrows(AppException.class,
                () -> studentManagementService.getStudents(null, null, "XYZ", 0, 20));

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.INVALID_STUDENT_FILTER);
    }

    @Test
    void getCounts_returnsAllActiveInactive() {
        when(studentQueryRepository.count(null, "khoi", null)).thenReturn(3L);
        when(studentQueryRepository.count("ACTIVE", "khoi", null)).thenReturn(2L);
        when(studentQueryRepository.count("INACTIVE", "khoi", null)).thenReturn(1L);

        Map<String, Long> counts = studentManagementService.getCounts("khoi", null);

        assertThat(counts).containsEntry("ALL", 3L).containsEntry("ACTIVE", 2L).containsEntry("INACTIVE", 1L);
    }

    // -------------------------------------------------------------- updateStatus

    @Test
    @SuppressWarnings("unchecked")
    void updateStatus_activeToInactive_savesAndWritesAudit() {
        when(userRepository.findById(STUDENT_ID)).thenReturn(Optional.of(student));
        when(userRepository.findByUsername("letan01")).thenReturn(Optional.of(receptionist));
        when(studentQueryRepository.findDetail(STUDENT_ID))
                .thenReturn(Optional.of(StudentDetailResponse.builder().id(STUDENT_ID).status("INACTIVE").build()));
        when(studentQueryRepository.findClasses(STUDENT_ID)).thenReturn(List.of());

        StudentDetailResponse result = studentManagementService.updateStatus(STUDENT_ID,
                StudentStatusUpdateRequest.builder().status("inactive").note("Phụ huynh xin tạm nghỉ").build());

        assertThat(student.getStatus()).isEqualTo("INACTIVE");
        assertThat(result.getStatus()).isEqualTo("INACTIVE");
        verify(userRepository).saveAndFlush(student);

        ArgumentCaptor<Object> details = ArgumentCaptor.forClass(Object.class);
        verify(auditLogService).log(eq(RECEPTIONIST_ID), eq("UPDATE_STUDENT_STATUS"), eq("STUDENT"),
                eq(STUDENT_ID), details.capture(), any());
        assertThat((Map<String, Object>) details.getValue())
                .containsEntry("oldStatus", "ACTIVE")
                .containsEntry("newStatus", "INACTIVE")
                .containsEntry("note", "Phụ huynh xin tạm nghỉ");
    }

    @Test
    void updateStatus_sameStatus_throws409() {
        when(userRepository.findById(STUDENT_ID)).thenReturn(Optional.of(student));

        AppException ex = assertThrows(AppException.class, () -> studentManagementService.updateStatus(
                STUDENT_ID, StudentStatusUpdateRequest.builder().status("ACTIVE").build()));

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.INVALID_STUDENT_STATUS);
        verify(userRepository, never()).saveAndFlush(any());
        verify(auditLogService, never()).log(any(), anyString(), anyString(), any(), anyMap(), any());
    }

    @Test
    void updateStatus_invalidValue_throws400() {
        when(userRepository.findById(STUDENT_ID)).thenReturn(Optional.of(student));

        AppException ex = assertThrows(AppException.class, () -> studentManagementService.updateStatus(
                STUDENT_ID, StudentStatusUpdateRequest.builder().status("LOCKED").build()));

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.INVALID_STUDENT_STATUS_VALUE);
    }

    @Test
    void updateStatus_userIsNotStudent_throws404() {
        when(userRepository.findById(RECEPTIONIST_ID)).thenReturn(Optional.of(receptionist));

        AppException ex = assertThrows(AppException.class, () -> studentManagementService.updateStatus(
                RECEPTIONIST_ID, StudentStatusUpdateRequest.builder().status("INACTIVE").build()));

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.STUDENT_NOT_FOUND);
        assertThat(receptionist.getStatus()).isEqualTo("ACTIVE");
    }
}
