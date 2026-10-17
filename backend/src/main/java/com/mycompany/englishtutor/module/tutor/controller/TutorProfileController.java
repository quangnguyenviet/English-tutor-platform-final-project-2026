package com.mycompany.englishtutor.module.tutor.controller;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.mycompany.englishtutor.module.tutor.api.request.TutorProfileUpsertRequest;
import com.mycompany.englishtutor.module.tutor.api.response.TutorProfileResponse;
import com.mycompany.englishtutor.module.tutor.service.TutorProfileService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/tutors")
@RequiredArgsConstructor
@Tag(name = "Tutor Profile", description = "Tutor profile management APIs")
public class TutorProfileController {

    private final TutorProfileService tutorProfileService;

    @GetMapping("/me/profile")
    @PreAuthorize("hasRole('TUTOR')")
    @Operation(summary = "Get current tutor profile", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Tutor profile not found")
    })
    public ResponseEntity<TutorProfileResponse> getProfile() {
        return ResponseEntity.ok(tutorProfileService.getProfile());
    }

    @PostMapping(value = "/me/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('TUTOR')")
    @Operation(summary = "Create or update tutor profile", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile updated successfully"),
            @ApiResponse(responseCode = "201", description = "Profile created successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "400", description = "Invalid request")
    })
    public ResponseEntity<TutorProfileResponse> upsertProfile(
            @ModelAttribute @Valid TutorProfileUpsertRequest request,
            @RequestParam(value = "avatar", required = false) MultipartFile avatar,
            @RequestParam(value = "credentialsFiles", required = false) List<MultipartFile> credentialFiles) {

        log.info("Received profile upsert request for tutor");
        TutorProfileResponse response = tutorProfileService.upsertProfile(request, avatar, credentialFiles);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/me/profile/submit")
    @PreAuthorize("hasRole('TUTOR')")
    @Operation(summary = "Submit tutor profile for review", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile submitted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "409", description = "Profile already submitted")
    })
    public ResponseEntity<TutorProfileResponse> submitForReview() {
        return ResponseEntity.ok(tutorProfileService.submitForReview());
    }
}
