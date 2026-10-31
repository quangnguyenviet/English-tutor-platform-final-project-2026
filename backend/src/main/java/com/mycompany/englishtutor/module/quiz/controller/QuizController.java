package com.mycompany.englishtutor.module.quiz.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.englishtutor.module.quiz.api.request.AssignQuizRequest;
import com.mycompany.englishtutor.module.quiz.api.request.CreateQuizRequest;
import com.mycompany.englishtutor.module.quiz.api.request.UpdateQuizRequest;
import com.mycompany.englishtutor.module.quiz.api.response.QuizDetailResponse;
import com.mycompany.englishtutor.module.quiz.api.response.QuizListItemResponse;
import com.mycompany.englishtutor.module.quiz.api.response.SkillOptionResponse;
import com.mycompany.englishtutor.module.quiz.service.QuizService;
import com.mycompany.englishtutor.module.student.service.StudentPortalService;
import com.mycompany.englishtutor.shared.api.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Quiz buổi học cho gia sư — lát cắt nhập THỦ CÔNG (API_DESIGN §3.7, FR-13).
 * Chỉ TUTOR, riêng {@code GET /quizzes/{id}} cho thêm STUDENT (ẩn đáp án câu chưa trả lời);
 * mọi endpoint kiểm tra quyền sở hữu trong service.
 *
 * <p>Chưa có: AI chat / import (T8-B3, T8-C1). Làm quiz học sinh &amp; Elo nằm ở {@code StudentPortalController}.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TUTOR')")
@Tag(name = "Quiz buổi học (gia sư)", description = "Soạn quiz thủ công cho buổi học: tạo nháp, sửa, giao bài, đọc catalog kỹ năng")
public class QuizController {

    private final QuizService quizService;
    private final StudentPortalService studentPortalService;

    @PostMapping("/sessions/{sessionId}/quizzes")
    @Operation(
            summary = "Tạo quiz bản nháp cho buổi học (danh sách câu hỏi do gia sư nhập)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<QuizDetailResponse>> createQuiz(
            @PathVariable Long sessionId,
            @Valid @RequestBody CreateQuizRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(
                ApiResponse.<QuizDetailResponse>builder()
                        .result(quizService.createQuizForSession(sessionId, request, httpRequest))
                        .build());
    }

    @GetMapping("/sessions/{sessionId}/quizzes")
    @Operation(
            summary = "Danh sách quiz của buổi học (card \"Quiz buổi học\")",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<QuizListItemResponse>>> listSessionQuizzes(
            @PathVariable Long sessionId,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(
                ApiResponse.<List<QuizListItemResponse>>builder()
                        .result(quizService.listSessionQuizzes(sessionId, httpRequest))
                        .build());
    }

    @GetMapping("/quizzes/{id}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
    @Operation(
            summary = "Chi tiết quiz: gia sư xem đủ để sửa; học sinh chỉ thấy đáp án của câu đã trả lời",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<?>> getQuizDetail(
            @PathVariable Long id, Authentication authentication, HttpServletRequest httpRequest) {
        boolean student = AuthorityUtils.authorityListToSet(authentication.getAuthorities()).contains("ROLE_STUDENT");
        Object result = student ? studentPortalService.getQuizDetail(id) : quizService.getQuizDetail(id, httpRequest);
        return ResponseEntity.ok(ApiResponse.<Object>builder().result(result).build());
    }

    @PutMapping("/quizzes/{id}")
    @Operation(
            summary = "Sửa tiêu đề + ghi đè câu hỏi (chỉ khi DRAFT)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<QuizDetailResponse>> updateQuiz(
            @PathVariable Long id,
            @Valid @RequestBody UpdateQuizRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(
                ApiResponse.<QuizDetailResponse>builder()
                        .result(quizService.updateQuiz(id, request, httpRequest))
                        .build());
    }

    @PostMapping("/quizzes/{id}/assign")
    @Operation(
            summary = "Giao bài (DRAFT → ASSIGNED) kèm thời hạn, thông báo học sinh",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<QuizDetailResponse>> assignQuiz(
            @PathVariable Long id,
            @Valid @RequestBody AssignQuizRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(
                ApiResponse.<QuizDetailResponse>builder()
                        .result(quizService.assignQuiz(id, request, httpRequest))
                        .build());
    }

    @GetMapping("/skills")
    @Operation(
            summary = "Catalog kỹ năng chung (ô chọn khi soạn quiz)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<SkillOptionResponse>>> listSkills() {
        return ResponseEntity.ok(
                ApiResponse.<List<SkillOptionResponse>>builder()
                        .result(quizService.listSkills())
                        .build());
    }
}
