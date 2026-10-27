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

    boolean existsByEmployeeCode(String employeeCode);

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
     * Đếm số nhân sự có mã bắt đầu bằng prefix (để sinh số thứ tự mã nhân viên kế tiếp).
     */
    @Query("SELECT COUNT(e) FROM Employee e WHERE e.employeeCode LIKE CONCAT(:prefix, '%')")
    long countByEmployeeCodePrefix(@Param("prefix") String prefix);
}
