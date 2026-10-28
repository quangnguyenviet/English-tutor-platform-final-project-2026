package com.mycompany.englishtutor.module.staff.domain;

import java.time.LocalDate;

import com.mycompany.englishtutor.module.user.domain.User;

import jakarta.persistence.*;

import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Hồ sơ nhân sự trung tâm (Lễ tân / Kế toán / Admin) — ánh xạ bảng {@code employees} (V5).
 * Dùng chung khóa chính với {@link User} qua {@link MapsId}: {@code employees.id} = {@code users.id}.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "employees")
public class Employee {

    @Id
    Long id;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id")
    User user;

    @Column(name = "employee_code", nullable = false, unique = true, length = 20)
    String employeeCode;

    @Column(name = "hired_date")
    LocalDate hiredDate;
}
