package com.mycompany.englishtutor.module.staff.service;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.staff.api.request.EmployeeCreationRequest;
import com.mycompany.englishtutor.module.staff.api.request.EmployeeStatusUpdateRequest;
import com.mycompany.englishtutor.module.staff.api.response.EmployeeCreatedResponse;
import com.mycompany.englishtutor.module.staff.api.response.EmployeeDetailResponse;
import com.mycompany.englishtutor.module.staff.api.response.EmployeeSummaryResponse;
import com.mycompany.englishtutor.module.staff.domain.Employee;
import com.mycompany.englishtutor.module.staff.mapper.EmployeeMapper;
import com.mycompany.englishtutor.module.staff.repository.EmployeeRepository;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.domain.UserRole;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.api.PageResponse;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import jakarta.servlet.http.HttpServletRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

/**
 * Nghiệp vụ quản lý nhân sự Lễ tân / Kế toán cho Admin (UC-ADM-11, UC-ADM-12 / Luồng 25, 26).
 * Mọi thao tác chỉ dành cho vai trò ADMIN, ghi audit log và áp dụng máy trạng thái ACTIVE ↔ INACTIVE.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class EmployeeService {

    /** Vai trò nhân sự được phép quản lý qua màn hình này. */
    static final List<String> MANAGED_ROLES = List.of(UserRole.RECEPTIONIST.name(), UserRole.ACCOUNTANT.name());

    /** Mật khẩu mặc định dùng một lần, thống nhất với quy tắc tạo tài khoản học sinh (QT-2). */
    static final String DEFAULT_PASSWORD = "EnglishPath@123";

    EmployeeRepository employeeRepository;
    UserRepository userRepository;
    EmployeeMapper employeeMapper;
    PasswordEncoder passwordEncoder;
    AuditLogService auditLogService;

    /**
     * Danh sách nhân sự có phân trang + bộ lọc vai trò / trạng thái / từ khóa.
     */
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<EmployeeSummaryResponse> getEmployees(
            String role, String status, String keyword, int page, int size) {
        List<String> roles = resolveRoles(role);
        String normalizedStatus = normalizeStatusFilter(status);
        String normalizedKeyword = (keyword == null || keyword.isBlank()) ? null : keyword.trim();

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Employee> result = employeeRepository.search(roles, normalizedStatus, normalizedKeyword, pageable);
        return PageResponse.from(result, employeeMapper::toSummary);
    }

    /**
     * Đếm số nhân sự theo trạng thái (ALL / ACTIVE / INACTIVE) cho badge tab, tôn trọng bộ lọc vai trò.
     */
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Long> getCounts(String role) {
        List<String> roles = resolveRoles(role);
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("ALL", employeeRepository.countByFilter(roles, null));
        counts.put("ACTIVE", employeeRepository.countByFilter(roles, "ACTIVE"));
        counts.put("INACTIVE", employeeRepository.countByFilter(roles, "INACTIVE"));
        return counts;
    }

    /**
     * Chi tiết một nhân sự.
     */
    @PreAuthorize("hasRole('ADMIN')")
    public EmployeeDetailResponse getEmployee(Long id) {
        return employeeMapper.toDetail(findManagedEmployee(id));
    }

    /**
     * Tạo mới tài khoản nhân sự (Lễ tân / Kế toán) — UC-ADM-12.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public EmployeeCreatedResponse createEmployee(EmployeeCreationRequest request) {
        String role = normalizeRole(request.getRole());
        String fullName = request.getFullName().trim();
        String email = request.getEmail().trim();
        String phone = request.getPhone().trim();

        if (userRepository.existsByEmail(email)) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }
        if (userRepository.existsByPhone(phone)) {
            throw new AppException(ErrorCode.PHONE_EXISTED);
        }

        String username = generateUsername(role, phone);
        String employeeCode = generateEmployeeCode(role);
        LocalDate hiredDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now();

        User user = User.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode(DEFAULT_PASSWORD))
                .fullName(fullName)
                .email(email)
                .phone(phone)
                .role(role)
                .status("ACTIVE")
                .mustChangePassword(true)
                .build();
        user = userRepository.save(user);

        Employee employee = Employee.builder()
                .user(user)
                .employeeCode(employeeCode)
                .hiredDate(hiredDate)
                .build();
        employee = employeeRepository.save(employee);

        Long actorId = getCurrentUserId();
        auditLogService.log(actorId, "CREATE_EMPLOYEE", "EMPLOYEE", user.getId(),
                Map.of("employeeCode", employeeCode, "role", role, "username", username),
                getCurrentHttpRequest());

        log.info("Tạo nhân sự mới: code={}, role={}, username={}, bởi admin={}",
                employeeCode, role, username, actorId);

        return EmployeeCreatedResponse.builder()
                .employee(employeeMapper.toDetail(employee))
                .username(username)
                .defaultPassword(DEFAULT_PASSWORD)
                .build();
    }

    /**
     * Đổi trạng thái hoạt động của nhân sự (UC-ADM-11): ACTIVE ↔ INACTIVE.
     * Chuyển sai trạng thái → 409 (INVALID_EMPLOYEE_STATUS).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public EmployeeDetailResponse updateStatus(Long id, EmployeeStatusUpdateRequest request) {
        Employee employee = findManagedEmployee(id);
        User user = employee.getUser();

        String currentStatus = user.getStatus();
        String targetStatus = request.getStatus() == null ? "" : request.getStatus().trim().toUpperCase();

        if (!"ACTIVE".equals(targetStatus) && !"INACTIVE".equals(targetStatus)) {
            throw new AppException(ErrorCode.INVALID_EMPLOYEE_STATUS);
        }
        // Chỉ cho phép đổi qua lại; đặt lại cùng trạng thái cũ là chuyển không hợp lệ.
        if (targetStatus.equals(currentStatus)) {
            throw new AppException(ErrorCode.INVALID_EMPLOYEE_STATUS);
        }

        user.setStatus(targetStatus);
        userRepository.save(user);

        Long actorId = getCurrentUserId();
        auditLogService.log(actorId, "UPDATE_EMPLOYEE_STATUS", "EMPLOYEE", user.getId(),
                Map.of("oldStatus", currentStatus, "newStatus", targetStatus),
                getCurrentHttpRequest());

        log.info("Cập nhật trạng thái nhân sự id={}: {} -> {} bởi admin={}",
                id, currentStatus, targetStatus, actorId);

        return employeeMapper.toDetail(employee);
    }

    // ----------------------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------------------

    private Employee findManagedEmployee(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.EMPLOYEE_NOT_FOUND));
        if (!MANAGED_ROLES.contains(employee.getUser().getRole())) {
            // Không quản lý tài khoản ADMIN / vai trò khác qua màn hình này.
            throw new AppException(ErrorCode.EMPLOYEE_NOT_FOUND);
        }
        return employee;
    }

    private List<String> resolveRoles(String role) {
        if (role == null || role.isBlank() || "ALL".equalsIgnoreCase(role)) {
            return MANAGED_ROLES;
        }
        String normalized = role.trim().toUpperCase();
        if (!MANAGED_ROLES.contains(normalized)) {
            throw new AppException(ErrorCode.INVALID_EMPLOYEE_ROLE);
        }
        return List.of(normalized);
    }

    private String normalizeRole(String role) {
        String normalized = role == null ? "" : role.trim().toUpperCase();
        if (!MANAGED_ROLES.contains(normalized)) {
            throw new AppException(ErrorCode.INVALID_EMPLOYEE_ROLE);
        }
        return normalized;
    }

    private String normalizeStatusFilter(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            return null;
        }
        String normalized = status.trim().toUpperCase();
        if (!"ACTIVE".equals(normalized) && !"INACTIVE".equals(normalized)) {
            throw new AppException(ErrorCode.INVALID_EMPLOYEE_STATUS);
        }
        return normalized;
    }

    /**
     * Sinh username theo quy tắc giống học sinh ({@code hs_<sđt>}): {@code lt_<sđt>} cho Lễ tân,
     * {@code kt_<sđt>} cho Kế toán; thêm hậu tố số nếu trùng.
     */
    private String generateUsername(String role, String phone) {
        String prefix = UserRole.RECEPTIONIST.name().equals(role) ? "lt_" : "kt_";
        String base = prefix + phone.replaceAll("[^0-9]", "");
        String username = base;
        int suffix = 1;
        while (userRepository.existsByUsername(username)) {
            username = base + "_" + suffix++;
        }
        return username;
    }

    /**
     * Sinh mã nhân viên theo seed DB: {@code EMP-REC-00N} / {@code EMP-ACC-00N}.
     */
    private String generateEmployeeCode(String role) {
        String prefix = UserRole.RECEPTIONIST.name().equals(role) ? "EMP-REC-" : "EMP-ACC-";
        long next = employeeRepository.countByEmployeeCodePrefix(prefix) + 1;
        String code = String.format("%s%03d", prefix, next);
        while (employeeRepository.existsByEmployeeCode(code)) {
            next++;
            code = String.format("%s%03d", prefix, next);
        }
        return code;
    }

    private Long getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return null;
        }
        return userRepository.findByUsername(authentication.getName())
                .map(User::getId)
                .orElse(null);
    }

    private HttpServletRequest getCurrentHttpRequest() {
        RequestAttributes attribs = RequestContextHolder.getRequestAttributes();
        if (attribs instanceof ServletRequestAttributes servletRequestAttributes) {
            return servletRequestAttributes.getRequest();
        }
        return null;
    }
}
