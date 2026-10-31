package com.mycompany.englishtutor.module.student.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

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
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.QuizResultResponse;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.ReviewItem;
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
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        return ok(service.getSchedule(weekStart));
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
            @RequestParam(required = false) String status, @RequestParam(required = false) Long sessionId) {
        return ok(service.getQuizzes(status, sessionId));
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
}
