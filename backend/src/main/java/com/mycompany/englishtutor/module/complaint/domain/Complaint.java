package com.mycompany.englishtutor.module.complaint.domain;

import java.time.OffsetDateTime;

import com.mycompany.englishtutor.module.complaint.domain.enums.ComplainantRole;
import com.mycompany.englishtutor.module.complaint.domain.enums.ComplaintStatus;
import com.mycompany.englishtutor.module.complaint.domain.enums.ComplaintType;
import com.mycompany.englishtutor.module.complaint.domain.enums.RequestOutcome;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/** Đơn khiếu nại tại quầy, luôn gắn một lớp cần gia sư (ERD bảng {@code complaints}, V21). */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "complaints")
public class Complaint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "class_request_id", nullable = false)
    Long classRequestId;

    /** Lớp học tại thời điểm tạo đơn; NULL khi lớp chưa có gia sư. */
    @Column(name = "class_id")
    Long classId;

    @Column(name = "complainant_name", nullable = false, length = 100)
    String complainantName;

    @Column(name = "complainant_phone", nullable = false, length = 15)
    String complainantPhone;

    @Enumerated(EnumType.STRING)
    @Column(name = "complainant_role", nullable = false, length = 20)
    ComplainantRole complainantRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "complaint_type", nullable = false, length = 30)
    ComplaintType complaintType;

    @Column(name = "complaint_content", nullable = false, columnDefinition = "TEXT")
    String complaintContent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    ComplaintStatus status;

    @Column(columnDefinition = "TEXT")
    String resolution;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_outcome", length = 20)
    RequestOutcome requestOutcome;

    @Column(name = "received_by", nullable = false)
    Long receivedBy;

    @Column(name = "resolved_by")
    Long resolvedBy;

    @Column(name = "resolved_at")
    OffsetDateTime resolvedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    OffsetDateTime updatedAt;

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
