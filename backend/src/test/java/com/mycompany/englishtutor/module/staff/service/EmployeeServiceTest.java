package com.mycompany.englishtutor.module.staff.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.staff.api.request.EmployeeCreationRequest;
import com.mycompany.englishtutor.module.staff.api.request.EmployeeStatusUpdateRequest;
import com.mycompany.englishtutor.module.staff.api.response.EmployeeCreatedResponse;
import com.mycompany.englishtutor.module.staff.api.response.EmployeeDetailResponse;
import com.mycompany.englishtutor.module.staff.domain.Employee;
import com.mycompany.englishtutor.module.staff.mapper.EmployeeMapper;
import com.mycompany.englishtutor.module.staff.repository.EmployeeRepository;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {
    private static final Long EMPLOYEE_ID = 22L;

    @Mock EmployeeRepository employeeRepository;
    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock AuditLogService auditLogService;

    EmployeeService service;

    @BeforeEach
    void setUp() {
        service = new EmployeeService(
                employeeRepository, userRepository, new EmployeeMapper(), passwordEncoder, auditLogService);
        lenient().when(passwordEncoder.encode(anyString())).thenReturn("hash");
        lenient().when(userRepository.saveAndFlush(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(EMPLOYEE_ID);
            return user;
        });
        lenient().when(employeeRepository.saveAndFlush(any(Employee.class))).thenAnswer(invocation -> {
            Employee employee = invocation.getArgument(0);
            employee.setId(EMPLOYEE_ID);
            return employee;
        });
    }

    private EmployeeCreationRequest request(String email, String phone) {
        EmployeeCreationRequest request = new EmployeeCreationRequest();
        request.setRole("RECEPTIONIST");
        request.setFullName("Nguyễn Minh Khôi");
        request.setEmail(email);
        request.setPhone(phone);
        return request;
    }

    private Employee employee(String role, String status) {
        User user = User.builder()
                .id(EMPLOYEE_ID)
                .username("lt_0901234567")
                .fullName("Nguyễn Minh Khôi")
                .role(role)
                .status(status)
                .build();
        return Employee.builder().id(EMPLOYEE_ID).user(user).employeeCode("NV-0006").build();
    }

    @Test
    void createEmployee_sinhMaNvKeTiepVaBatCoDoiMatKhau() {
        when(employeeRepository.findMaxEmployeeNumber()).thenReturn(5);

        EmployeeCreatedResponse response = service.createEmployee(request("a@example.test", "0901234567"));

        assertEquals("NV-0006", response.getEmployee().getEmployeeCode());
        assertEquals("lt_0901234567", response.getUsername());
        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).saveAndFlush(saved.capture());
        assertThat(saved.getValue().isMustChangePassword()).isTrue();
        verify(auditLogService).log(any(), eq("CREATE_EMPLOYEE"), eq("EMPLOYEE"), eq(EMPLOYEE_ID), any(), any());
    }

    @Test
    void createEmployee_chuanHoaEmailVaSdtTruocKhiKiemTraTrung() {
        when(employeeRepository.findMaxEmployeeNumber()).thenReturn(0);

        service.createEmployee(request("  UJ6.A@Example.Test ", "+84901234567"));

        verify(userRepository).existsByEmailIgnoreCase("uj6.a@example.test");
        verify(userRepository).existsByPhone("0901234567");
        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).saveAndFlush(saved.capture());
        assertEquals("uj6.a@example.test", saved.getValue().getEmail());
        assertEquals("0901234567", saved.getValue().getPhone());
    }

    @Test
    void createEmployee_trungEmail_tuChoi() {
        when(userRepository.existsByEmailIgnoreCase("a@example.test")).thenReturn(true);

        AppException exception = assertThrows(
                AppException.class, () -> service.createEmployee(request("A@example.test", "0901234567")));

        assertEquals(ErrorCode.EMAIL_EXISTED, exception.getErrorCode());
        verify(userRepository, never()).saveAndFlush(any());
    }

    @Test
    void createEmployee_trungSdt84_tuChoi() {
        when(userRepository.existsByPhone("0901234567")).thenReturn(true);

        AppException exception = assertThrows(
                AppException.class, () -> service.createEmployee(request("a@example.test", "84901234567")));

        assertEquals(ErrorCode.PHONE_EXISTED, exception.getErrorCode());
    }

    @Test
    void createEmployee_dbBaoTrung_khongLoCauSql() {
        when(employeeRepository.findMaxEmployeeNumber()).thenReturn(0);
        when(userRepository.saveAndFlush(any(User.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate key"));

        AppException exception = assertThrows(
                AppException.class, () -> service.createEmployee(request("a@example.test", "0901234567")));

        assertEquals(ErrorCode.EMPLOYEE_CONTACT_EXISTED, exception.getErrorCode());
    }

    @Test
    void createEmployee_vaiTroAdmin_tuChoi() {
        EmployeeCreationRequest request = request("a@example.test", "0901234567");
        request.setRole("ADMIN");

        AppException exception = assertThrows(AppException.class, () -> service.createEmployee(request));

        assertEquals(ErrorCode.INVALID_EMPLOYEE_ROLE, exception.getErrorCode());
    }

    @Test
    void getEmployee_leTan_coSoLieuTheoVaiTro() {
        when(employeeRepository.findById(EMPLOYEE_ID)).thenReturn(Optional.of(employee("RECEPTIONIST", "ACTIVE")));
        when(employeeRepository.countHandledClassRequests(EMPLOYEE_ID)).thenReturn(4L);
        when(employeeRepository.countReceivedComplaints(EMPLOYEE_ID)).thenReturn(2L);
        when(employeeRepository.countReviewedPayments(EMPLOYEE_ID)).thenReturn(1L);

        EmployeeDetailResponse detail = service.getEmployee(EMPLOYEE_ID);

        assertThat(detail.getWorkStats())
                .containsOnlyKeys("handledClassRequests", "receivedComplaints", "reviewedPayments")
                .containsEntry("handledClassRequests", 4L);
    }

    @Test
    void getEmployee_keToan_coSoLieuTheoVaiTro() {
        when(employeeRepository.findById(EMPLOYEE_ID)).thenReturn(Optional.of(employee("ACCOUNTANT", "ACTIVE")));
        when(employeeRepository.countProcessedRefunds(EMPLOYEE_ID)).thenReturn(3L);

        EmployeeDetailResponse detail = service.getEmployee(EMPLOYEE_ID);

        assertThat(detail.getWorkStats())
                .containsOnlyKeys("reviewedPayments", "processedRefunds")
                .containsEntry("processedRefunds", 3L);
    }

    @Test
    void getEmployee_taiKhoanAdmin_khongQuanLyQuaManHinhNay() {
        when(employeeRepository.findById(EMPLOYEE_ID)).thenReturn(Optional.of(employee("ADMIN", "ACTIVE")));

        AppException exception = assertThrows(AppException.class, () -> service.getEmployee(EMPLOYEE_ID));

        assertEquals(ErrorCode.EMPLOYEE_NOT_FOUND, exception.getErrorCode());
    }

    @Test
    void updateStatus_khoaTaiKhoan_ghiAudit() {
        Employee employee = employee("RECEPTIONIST", "ACTIVE");
        when(employeeRepository.findById(EMPLOYEE_ID)).thenReturn(Optional.of(employee));

        EmployeeDetailResponse detail = service.updateStatus(EMPLOYEE_ID, statusRequest("inactive"));

        assertEquals("INACTIVE", detail.getStatus());
        verify(auditLogService).log(any(), eq("UPDATE_EMPLOYEE_STATUS"), eq("EMPLOYEE"), eq(EMPLOYEE_ID), any(), any());
    }

    @Test
    void updateStatus_giuNguyenTrangThai_tra409() {
        when(employeeRepository.findById(EMPLOYEE_ID)).thenReturn(Optional.of(employee("RECEPTIONIST", "INACTIVE")));

        AppException exception = assertThrows(
                AppException.class, () -> service.updateStatus(EMPLOYEE_ID, statusRequest("INACTIVE")));

        assertEquals(ErrorCode.INVALID_EMPLOYEE_STATUS, exception.getErrorCode());
    }

    @Test
    void updateStatus_giaTriLa_tra400() {
        when(employeeRepository.findById(EMPLOYEE_ID)).thenReturn(Optional.of(employee("RECEPTIONIST", "ACTIVE")));

        AppException exception = assertThrows(
                AppException.class, () -> service.updateStatus(EMPLOYEE_ID, statusRequest("BANNED")));

        assertEquals(ErrorCode.EMPLOYEE_STATUS_VALUE_INVALID, exception.getErrorCode());
    }

    private EmployeeStatusUpdateRequest statusRequest(String status) {
        EmployeeStatusUpdateRequest request = new EmployeeStatusUpdateRequest();
        request.setStatus(status);
        return request;
    }
}
