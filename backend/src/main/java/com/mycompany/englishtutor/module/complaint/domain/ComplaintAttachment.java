package com.mycompany.englishtutor.module.complaint.domain;

import java.time.OffsetDateTime;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/** Tệp minh chứng đính kèm khi giải quyết khiếu nại. */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "complaint_attachments")
public class ComplaintAttachment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "complaint_id", nullable = false)
    Long complaintId;

    @Column(name = "file_url", nullable = false, length = 500)
    String fileUrl;

    @Column(name = "file_name", length = 255)
    String fileName;

    @Column(name = "uploaded_by", nullable = false)
    Long uploadedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    OffsetDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
