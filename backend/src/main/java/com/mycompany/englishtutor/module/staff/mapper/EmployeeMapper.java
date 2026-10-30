package com.mycompany.englishtutor.module.staff.mapper;

import org.springframework.stereotype.Component;

import com.mycompany.englishtutor.module.staff.api.response.EmployeeDetailResponse;
import com.mycompany.englishtutor.module.staff.api.response.EmployeeSummaryResponse;
import com.mycompany.englishtutor.module.staff.domain.Employee;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.domain.UserRole;

/**
 * Chuyển đổi {@link Employee} (+ {@link User}) sang DTO phản hồi, kèm nhãn tiếng Việt cho vai trò và trạng thái.
 */
@Component
public class EmployeeMapper {

    public EmployeeSummaryResponse toSummary(Employee employee) {
        User user = employee.getUser();
        return EmployeeSummaryResponse.builder()
                .id(employee.getId())
                .employeeCode(employee.getEmployeeCode())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .roleLabel(roleLabel(user.getRole()))
                .hiredDate(employee.getHiredDate())
                .status(user.getStatus())
                .statusLabel(statusLabel(user.getStatus()))
                .build();
    }

    public EmployeeDetailResponse toDetail(Employee employee) {
        User user = employee.getUser();
        return EmployeeDetailResponse.builder()
                .id(employee.getId())
                .employeeCode(employee.getEmployeeCode())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .roleLabel(roleLabel(user.getRole()))
                .hiredDate(employee.getHiredDate())
                .status(user.getStatus())
                .statusLabel(statusLabel(user.getStatus()))
                .createdAt(user.getCreatedAt())
                .build();
    }

    public String roleLabel(String role) {
        if (role == null) return null;
        if (UserRole.RECEPTIONIST.name().equals(role)) return "Lễ tân";
        if (UserRole.ACCOUNTANT.name().equals(role)) return "Kế toán";
        if (UserRole.ADMIN.name().equals(role)) return "Quản trị viên";
        return role;
    }

    public String statusLabel(String status) {
        if (status == null) return null;
        return "ACTIVE".equals(status) ? "Đang hoạt động" : "Ngưng hoạt động";
    }
}
