package com.mycompany.englishtutor.module.staff.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.mycompany.englishtutor.module.staff.domain.Employee;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    /**
     * Tìm nhân sự theo danh sách vai trò, trạng thái (tùy chọn) và từ khóa (tùy chọn).
     * Từ khóa khớp theo họ tên / email / SĐT / mã nhân viên (không phân biệt hoa thường).
     */
    @Query("""
            SELECT e FROM Employee e JOIN e.user u
            WHERE u.role IN :roles
              AND (:status IS NULL OR u.status = :status)
              AND (:keyword IS NULL
                   OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
                   OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
                   OR LOWER(u.phone) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
                   OR LOWER(e.employeeCode) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')))
            """)
    Page<Employee> search(
            @Param("roles") List<String> roles,
            @Param("status") String status,
            @Param("keyword") String keyword,
            Pageable pageable);

    /**
     * Đếm số nhân sự theo vai trò và trạng thái (dùng cho badge tab).
     */
    @Query("""
            SELECT COUNT(e) FROM Employee e JOIN e.user u
            WHERE u.role IN :roles
              AND (:status IS NULL OR u.status = :status)
            """)
    long countByFilter(@Param("roles") List<String> roles, @Param("status") String status);

    /**
     * Số thứ tự lớn nhất trong các mã {@code NV-xxxx} (để sinh mã nhân viên kế tiếp).
     */
    @Query(value = """
            SELECT COALESCE(MAX(CAST(SUBSTRING(employee_code FROM 4) AS INTEGER)), 0)
            FROM employees WHERE employee_code ~ '^NV-[0-9]+$'
            """, nativeQuery = true)
    int findMaxEmployeeNumber();

    // Số liệu công việc theo vai trò (FR-38); các bảng thuộc module khác nên dùng native query.

    @Query(value = "SELECT COUNT(*) FROM class_requests WHERE handled_by = :userId", nativeQuery = true)
    long countHandledClassRequests(@Param("userId") Long userId);

    @Query(value = "SELECT COUNT(*) FROM complaints WHERE received_by = :userId", nativeQuery = true)
    long countReceivedComplaints(@Param("userId") Long userId);

    @Query(value = "SELECT COUNT(*) FROM payments WHERE reviewed_by = :userId", nativeQuery = true)
    long countReviewedPayments(@Param("userId") Long userId);

    @Query(value = "SELECT COUNT(*) FROM refunds WHERE processed_by = :userId", nativeQuery = true)
    long countProcessedRefunds(@Param("userId") Long userId);
}
