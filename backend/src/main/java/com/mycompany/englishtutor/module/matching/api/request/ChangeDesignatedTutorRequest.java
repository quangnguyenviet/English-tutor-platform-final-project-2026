package com.mycompany.englishtutor.module.matching.api.request;

import io.swagger.v3.oas.annotations.media.Schema;
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
public class ChangeDesignatedTutorRequest {

    @Schema(description = "ID gia sư chỉ định mới. Để null nghĩa là không chỉ định, lớp sẽ đăng tuyển", example = "6")
    Long tutorId;
}
