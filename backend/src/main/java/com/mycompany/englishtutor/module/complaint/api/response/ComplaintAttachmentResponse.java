package com.mycompany.englishtutor.module.complaint.api.response;

import java.time.OffsetDateTime;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ComplaintAttachmentResponse {
    Long id;
    String fileName;
    /** Link xem tạm thời (presigned). */
    String fileUrl;
    OffsetDateTime createdAt;
}
