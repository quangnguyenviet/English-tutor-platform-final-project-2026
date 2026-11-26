package com.mycompany.englishtutor.module.classroom.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.ArgumentMatchers.eq;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.englishtutor.module.classroom.api.response.TrialReportTaskDetailResponse;
import com.mycompany.englishtutor.module.classroom.api.response.TrialReportTaskListItemResponse;
import com.mycompany.englishtutor.module.classroom.repository.TrialReportTaskRepository;
import com.mycompany.englishtutor.module.matching.service.StaffClassRequestService;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.domain.UserRole;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.api.PageResponse;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Hàng đợi xử lý report dạy thử thất bại cho admin/lễ tân (V32):
 * danh sách/đếm/chi tiết, gán cho mình (409 khi đã gán), gán/bỏ gán,
 * ghép lại (idempotent, 404 khi không có request), chuyển trạng thái dropdown.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TrialReportTaskServiceTest {

    private static final Long TASK_ID = 100L;
    private static final Long STAFF_ID = 7L;
    private static final Long TARGET_STAFF_ID = 9L;
    private static final Long CLASS_REQUEST_ID = 55L;

    @Mock
    TrialReportTaskRepository taskRepository;

    @Mock
    StaffClassRequestService staffClassRequestService;

    @Mock
    UserRepository userRepository;

    @InjectMocks
    TrialReportTaskService service;

    ObjectMapper objectMapper;

    HttpServletRequest httpRequest;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        service = new TrialReportTaskService(taskRepository, staffClassRequestService, userRepository, objectMapper);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("staff1", "x", List.of()));
        when(userRepository.findByUsername("staff1"))
                .thenReturn(Optional.of(User.builder()
                        .id(STAFF_ID)
                        .username("staff1")
                        .fullName("Lễ tân A")
                        .role(UserRole.RECEPTIONIST.name())
                        .build()));
        httpRequest = new MockHttpServletRequest(HttpMethod.POST.name(), "/api/v1/trial-report-tasks/100");
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    // ------------------------------------------------------------- helpers

    private TrialReportTaskDetailResponse detail(String status) {
        TrialReportTaskDetailResponse.ClassRequestInfo request =
                TrialReportTaskDetailResponse.ClassRequestInfo.builder()
                        .id(CLASS_REQUEST_ID)
                        .status("REMATCH")
                        .build();
        TrialReportTaskDetailResponse.ClassInfo classInfo =
                TrialReportTaskDetailResponse.ClassInfo.builder()
                        .classId(5L)
                        .className("IELTS 1 kèm 1")
                        .classRequest(request)
                        .build();
        TrialReportTaskDetailResponse.ReportDetail report =
                TrialReportTaskDetailResponse.ReportDetail.builder()
                        .reportId(10L)
                        .outcome("FAILED")
                        .note("Học sinh chưa phù hợp")
                        .build();
        TrialReportTaskDetailResponse.TaskDetail task =
                TrialReportTaskDetailResponse.TaskDetail.builder()
                        .taskId(TASK_ID)
                        .status(status)
                        .report(report)
                        .classInfo(classInfo)
                        .build();
        return TrialReportTaskDetailResponse.builder().task(task).build();
    }

    private static TrialReportTaskListItemResponse item() {
        return TrialReportTaskListItemResponse.builder()
                .taskId(TASK_ID)
                .status("PENDING")
                .reportId(10L)
                .classId(5L)
                .build();
    }

    // ------------------------------------------------------------- list

    /** Phân trang mặc định (page<0→0, size rỗng→20), status không hợp lệ → 400. */
    @Test
    void listDefaultsPagingAndRejectsInvalidStatus() {
        when(taskRepository.countQueue(any(), any())).thenReturn(0L);
        when(taskRepository.findQueue(any(), any(), eq(0), eq(20))).thenReturn(List.of(item()));

        PageResponse<TrialReportTaskListItemResponse> page = service.listTasks("PENDING", null, -3, null);

        assertEquals(0, page.getPage());
        assertEquals(20, page.getSize());
        assertEquals(1, page.getItems().size());
        verify(taskRepository).findQueue("PENDING", null, 0, 20);

        AppException ex = assertThrows(
                AppException.class,
                () -> service.listTasks("ARCHIVED", null, 0, 20));
        assertTrue(ex.getErrorCode() == ErrorCode.TRIAL_REPORT_TASK_INVALID_STATUS);
    }

    // ------------------------------------------------------------- assign-self

    /** Gán cho mình: có dòng trả về 409; trả về 1 ghi lịch sử ASSIGN_SELF. */
    @Test
    void assignSelfLocksWritesHistoryOrConflicts() {
        when(taskRepository.lockTask(TASK_ID)).thenReturn(Optional.of(detail("PENDING")));

        // Đã được gán trước: assignSelf trả 0 → 409
        when(taskRepository.assignSelf(TASK_ID, STAFF_ID)).thenReturn(0);
        AppException conflict =
                assertThrows(
                        AppException.class, () -> service.assignSelf(TASK_ID));
        assertTrue(conflict.getErrorCode() == ErrorCode.TRIAL_REPORT_ALREADY_ASSIGNED);
        verify(taskRepository, never()).insertHistory(anyLong(), anyLong(), eq("ASSIGN_SELF"), any());

        // Chưa ai gán: trả 1 → ghi lịch sử
        when(taskRepository.assignSelf(TASK_ID, STAFF_ID)).thenReturn(1);
        service.assignSelf(TASK_ID);
        verify(taskRepository).insertHistory(eq(TASK_ID), eq(STAFF_ID), eq("ASSIGN_SELF"), isNull());
    }

    @org.junit.jupiter.api.Test
    void getTaskDetailReturns404WhenMissing() {
        when(taskRepository.findTaskDetail(TASK_ID)).thenReturn(Optional.empty());
        AppException ex = assertThrows(AppException.class, () -> service.getTaskDetail(TASK_ID));
        assertTrue(ex.getErrorCode() == ErrorCode.TRIAL_REPORT_TASK_NOT_FOUND);
    }

    @org.junit.jupiter.api.Test
    void getTaskDetailAttachesHistory() {
        when(taskRepository.findTaskDetail(TASK_ID)).thenReturn(Optional.of(detail("PENDING")));
        when(taskRepository.findHistory(TASK_ID)).thenReturn(List.of());
        TrialReportTaskDetailResponse result = service.getTaskDetail(TASK_ID);
        assertEquals(TASK_ID, result.getTask().getTaskId());
        assertTrue(result.getHistory().isEmpty());
    }

    // ------------------------------------------------------------- unassign

    @Test
    void unassignClearsAssignmentAndWritesHistory() {
        when(taskRepository.lockTask(TASK_ID)).thenReturn(Optional.of(detail("IN_PROGRESS")));
        service.unassign(TASK_ID);
        verify(taskRepository).unassign(TASK_ID);
        verify(taskRepository).insertHistory(eq(TASK_ID), eq(STAFF_ID), eq("UNASSIGN"), isNull());
    }

    // ------------------------------------------------------------- assign-other

    @Test
    void assignValidatesTargetAndWritesHistory() {
        when(taskRepository.lockTask(TASK_ID)).thenReturn(Optional.of(detail("PENDING")));

        // Người nhận không phải nhân sự ACTIVE → 404
        when(taskRepository.findAssignableStaffName(TARGET_STAFF_ID)).thenReturn(Optional.empty());
        AppException notStaff = assertThrows(AppException.class, () -> service.assign(TASK_ID, TARGET_STAFF_ID));
        assertTrue(notStaff.getErrorCode() == ErrorCode.USER_NOT_EXISTED);
        verify(taskRepository, never()).assignTo(anyLong(), anyLong());

        when(taskRepository.findAssignableStaffName(TARGET_STAFF_ID)).thenReturn(Optional.of("Lễ tân B"));
        service.assign(TASK_ID, TARGET_STAFF_ID);
        verify(taskRepository).assignTo(TASK_ID, TARGET_STAFF_ID);
        verify(taskRepository).insertHistory(eq(TASK_ID), eq(STAFF_ID), eq("ASSIGN_OTHER"), any());
    }

    // ------------------------------------------------------------- rematch

    @Test
    void rematchThrows404WhenClassHasNoRequest() {
        TrialReportTaskDetailResponse noRequest =
                TrialReportTaskDetailResponse.builder()
                        .task(
                                TrialReportTaskDetailResponse.TaskDetail.builder()
                                        .taskId(TASK_ID)
                                        .status("PENDING")
                                        .report(TrialReportTaskDetailResponse.ReportDetail.builder()
                                                .reportId(10L)
                                                .note("chưa phù hợp")
                                                .build())
                                        .classInfo(TrialReportTaskDetailResponse.ClassInfo.builder()
                                                .classId(5L)
                                                .build()) // không có classRequest
                                        .build())
                        .build();
        when(taskRepository.lockTask(TASK_ID)).thenReturn(Optional.of(noRequest));
        AppException ex =
                assertThrows(AppException.class, () -> service.rematch(TASK_ID, httpRequest));
        assertTrue(ex.getErrorCode() == ErrorCode.TRIAL_REPORT_REMATCH_NO_REQUEST);
        verify(staffClassRequestService, never())
                .rematchClass(anyLong(), any(), anyBoolean(), anyBoolean(), any());
    }

    @Test
    void rematchIsIdempotentWhenRequestAlreadyOpenOrRematch() {
        when(taskRepository.lockTask(TASK_ID)).thenReturn(Optional.of(detail("PENDING")));
        when(taskRepository.findRequestStatus(CLASS_REQUEST_ID)).thenReturn("REMATCH");

        service.rematch(TASK_ID, httpRequest);

        // Đã REMATCH: không gọi lại rematchClass (idempotent), vẫn ghi lịch sử
        verify(staffClassRequestService, never())
                .rematchClass(anyLong(), any(), anyBoolean(), anyBoolean(), any());
        verify(taskRepository)
                .insertHistory(eq(TASK_ID), eq(STAFF_ID), eq("REMATCH"), any());
    }

    @Test
    void rematchCallsRematchClassWhenRequestClosed() {
        when(taskRepository.lockTask(TASK_ID)).thenReturn(Optional.of(detail("IN_PROGRESS")));
        when(taskRepository.findRequestStatus(CLASS_REQUEST_ID)).thenReturn("CANCELLED");

        service.rematch(TASK_ID, httpRequest);

        verify(staffClassRequestService)
                .rematchClass(eq(CLASS_REQUEST_ID), eq("Học sinh chưa phù hợp"), eq(false), eq(true), eq(httpRequest));
        verify(taskRepository)
                .insertHistory(eq(TASK_ID), eq(STAFF_ID), eq("REMATCH"), any());
    }

    // ------------------------------------------------------------- change-status

    @Test
    void changeStatusNormalizesAndWritesHistory() {
        when(taskRepository.lockTask(TASK_ID)).thenReturn(Optional.of(detail("PENDING")));
        service.changeStatus(TASK_ID, " resolved ");
        verify(taskRepository).changeStatus(TASK_ID, "RESOLVED", STAFF_ID);
        verify(taskRepository).insertHistory(eq(TASK_ID), eq(STAFF_ID), eq("CHANGE_STATUS"), contains("RESOLVED"));
    }

    @Test
    void changeStatusRejectsUnknownValue() {
        when(taskRepository.lockTask(TASK_ID)).thenReturn(Optional.of(detail("PENDING")));
        AppException ex =
                assertThrows(
                        AppException.class, () -> service.changeStatus(TASK_ID, "DONE"));
        assertTrue(ex.getErrorCode() == ErrorCode.TRIAL_REPORT_TASK_INVALID_STATUS);
        verify(taskRepository, never()).changeStatus(anyLong(), any(), anyLong());
    }
}
