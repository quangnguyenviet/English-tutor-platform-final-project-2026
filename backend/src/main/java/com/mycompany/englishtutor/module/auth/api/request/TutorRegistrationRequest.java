package com.mycompany.englishtutor.module.auth.api.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TutorRegistrationRequest {
    @NotBlank(message = "INVALID_KEY")
    @Size(min = 2, max = 100, message = "INVALID_KEY")
    String fullName;

    @NotBlank(message = "INVALID_KEY")
    @Email(message = "INVALID_KEY")
    String email;

    @NotBlank(message = "INVALID_PASSWORD")
    @Size(min = 6, max = 100, message = "INVALID_PASSWORD")
    String password;
}
