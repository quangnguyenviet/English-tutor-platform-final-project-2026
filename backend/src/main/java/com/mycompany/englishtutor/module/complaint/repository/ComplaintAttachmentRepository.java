package com.mycompany.englishtutor.module.complaint.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mycompany.englishtutor.module.complaint.domain.ComplaintAttachment;

public interface ComplaintAttachmentRepository extends JpaRepository<ComplaintAttachment, Long> {
    List<ComplaintAttachment> findByComplaintIdOrderByIdAsc(Long complaintId);
}
