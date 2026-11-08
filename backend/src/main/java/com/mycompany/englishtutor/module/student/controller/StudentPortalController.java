package com.mycompany.englishtutor.module.student.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.AnswerResultResponse;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.AttemptStateResponse;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.DashboardResponse;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.DueReviewItem;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.QuizResultResponse;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.ReviewFeedback;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.ReviewItem;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.ReviewScheduleResponse;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.ReviewStatsResponse;
import com.mycompany.englishtutor.module.student.api.ReviewAnswerRequest;
import com.mycompany.englishtutor.module.student.api.ReviewRateRequest;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.StudentClassDetail;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.StudentClassMaterialItem;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.StudentClassSummary;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.StudentLessonItem;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.StudentMaterialItem;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.StudentQuizItem;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.StudentScheduleResponse;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.StudentSessionItem;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.StudentTutorItem;
import com.mycompany.englishtutor.module.student.service.StudentPortalService;
import com.mycompany.englishtutor.shared.api.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * Cổng Học sinh (API_DESIGN §3.6, §3.7): lịch, buổi học, dashboard, quiz từng câu, Elo, ôn tập.
 * Mọi endpoint {@code /students/me/*} chỉ cho STUDENT và luôn tự lọc theo chính học sinh đăng nhập.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Cổng học sinh", description = "Lịch học, buổi học, quiz và Elo của học sinh")
public class StudentPortalController {

    private final StudentPortalService service;

    private static <T> ResponseEntity<ApiResponse<T>> ok(T result) {
        return ResponseEntity.ok(ApiResponse.<T>builder().result(result).build());
    }

    // ------------------------------------------------------------ LỊCH & BUỔI HỌC

    @GetMapping("/students/me/schedule")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Lịch tuần T2–CN của học sinh", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<StudentScheduleResponse>> schedule(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart,
            @RequestParam(required = false) Long classId) {
        return ok(service.getSchedule(weekStart, classId));
    }

    @GetMapping("/students/me/sessions")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Lịch sử buổi học (mới nhất trước)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<StudentSessionItem>>> sessions(
            @RequestParam(required = false) Long classId) {
        return ok(service.getSessionHistory(classId));
    }

    @GetMapping("/students/me/tutors")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Gia sư đang dạy kèm tiến trình", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<StudentTutorItem>>> tutors() {
        return ok(service.getTutors());
    }

    @GetMapping("/students/me/classes")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Danh sách lớp học của học sinh", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<StudentClassSummary>>> classes() {
        return ok(service.getClasses());
    }

    @GetMapping("/students/me/classes/{classId}")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Chi tiết lớp của học sinh", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<StudentClassDetail>> classDetail(@PathVariable Long classId) {
        return ok(service.getClassDetail(classId));
    }

    @GetMapping("/students/me/classes/{classId}/lessons")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "Bài giảng đã công bố của lớp",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<StudentLessonItem>>> classLessons(@PathVariable Long classId) {
        return ok(service.getClassLessons(classId));
    }

    @GetMapping("/students/me/classes/{classId}/materials")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "Tài liệu và video của các bài giảng đã công bố",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<StudentClassMaterialItem>>> classMaterials(
            @PathVariable Long classId) {
        return ok(service.getClassWorkspaceMaterials(classId));
    }

    /** Tài liệu lớp (bài giảng PUBLISHED) khi học sinh mở chi tiết buổi học (V16). */
    @GetMapping("/students/me/sessions/{logId}/materials")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "Tài liệu kèm buổi học (từ các bài giảng PUBLISHED của lớp)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<StudentMaterialItem>>> sessionMaterials(
            @PathVariable Long logId) {
        return ok(service.getClassMaterials(logId));
    }

    @GetMapping("/students/me/dashboard")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "Dashboard gộp, mỗi khu vực lỗi độc lập",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<DashboardResponse>> dashboard() {
        return ok(service.getDashboard());
    }

    // ----------------------------------------------------------------- QUIZ & ELO

    @GetMapping("/students/me/quizzes")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Bài quiz của học sinh", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<StudentQuizItem>>> quizzes(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long sessionId,
            @RequestParam(required = false) Long classId) {
        return ok(service.getQuizzes(status, sessionId, classId));
    }

    @PostMapping("/quizzes/{id}/attempts/start")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "Bắt đầu hoặc làm tiếp quiz: trả câu chưa trả lời kế tiếp và tiến độ",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<AttemptStateResponse>> start(@PathVariable Long id) {
        return ok(service.startAttempt(id));
    }

    @PostMapping("/quizzes/{id}/questions/{questionId}/answer")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(
            summary = "Trả lời một câu: chấm ngay, cập nhật Elo (idempotent theo học sinh + câu)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<AnswerResultResponse>> answer(
            @PathVariable Long id, @PathVariable Long questionId, @RequestBody Map<String, String> body) {
        return ok(service.answer(id, questionId, body.get("selectedAnswer")));
    }

    @GetMapping("/quizzes/{id}/result")
    @PreAuthorize("hasAnyRole('STUDENT', 'TUTOR')")
    @Operation(summary = "Tổng kết quiz", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<QuizResultResponse>> result(@PathVariable Long id) {
        return ok(service.getResult(id));
    }

    @GetMapping("/students/me/review-list")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Danh sách ôn tập: các câu đã trả lời sai", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<ReviewItem>>> reviewList() {
        return ok(service.getReviewList());
    }

    @GetMapping("/students/me/reviews/due")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Các câu sai đã đến hạn ôn", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<DueReviewItem>>> dueReviews(
            @RequestParam(required = false) Integer limit) {
        return ok(service.getDueReviews(limit));
    }

    @GetMapping("/students/me/reviews/stats")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Thống kê phiên ôn tập", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ReviewStatsResponse>> reviewStats() {
        return ok(service.getReviewStats());
    }

    @PostMapping("/students/me/reviews/{questionId}/answer")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Trả lời lại một câu sai", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ReviewFeedback>> answerReview(
            @PathVariable Long questionId, @Valid @RequestBody ReviewAnswerRequest request) {
        return ok(service.answerReview(questionId, request.selectedAnswer()));
    }

    @PostMapping("/students/me/reviews/{questionId}/rate")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Tự đánh giá và lên lịch lượt ôn kế tiếp", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ReviewScheduleResponse>> rateReview(
            @PathVariable Long questionId, @Valid @RequestBody ReviewRateRequest request) {
        return ok(service.rateReview(questionId, request));
    }
}
