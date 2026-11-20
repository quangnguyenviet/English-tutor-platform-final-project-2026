package com.mycompany.englishtutor.module.messaging.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.mycompany.englishtutor.module.messaging.api.ChatDtos.AcceptResult;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.MessageItem;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.MessagePage;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.OpenApplicationRoomRequest;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.OpenDirectRoomRequest;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.PiiViolationItem;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.PreCheckResponse;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.ProposalItem;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.ProposalRequest;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.RejectRequest;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.RoomDetail;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.RoomIdResponse;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.RoomSummary;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.SendMessageRequest;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.WithdrawRequest;
import com.mycompany.englishtutor.module.messaging.service.ChatEventHub;
import com.mycompany.englishtutor.module.messaging.service.ChatMessageService;
import com.mycompany.englishtutor.module.messaging.service.ChatRoomService;
import com.mycompany.englishtutor.module.messaging.service.MessagingActor;
import com.mycompany.englishtutor.module.messaging.service.PiiBlockedException;
import com.mycompany.englishtutor.module.messaging.service.ProposalAcceptService;
import com.mycompany.englishtutor.module.messaging.service.ProposalService;
import com.mycompany.englishtutor.shared.api.ApiResponse;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** API chat phụ huynh - gia sư và đề xuất lớp học. Rocket.Chat không bao giờ được truy cập trực tiếp từ trình duyệt. */
@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@Tag(name = "Chat", description = "Nhắn tin phụ huynh - gia sư và đề xuất lớp học")
public class ChatController {

    private static final String BEARER = "bearerAuth";

    private final ChatRoomService roomService;
    private final ChatMessageService messageService;
    private final ProposalService proposalService;
    private final ProposalAcceptService acceptService;
    private final ChatEventHub hub;
    private final MessagingActor actor;

    @GetMapping("/rooms")
    @PreAuthorize("hasAnyRole('PARENT', 'TUTOR')")
    @Operation(summary = "Danh sách phòng chat của tôi (kèm unread)", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<List<RoomSummary>> rooms() {
        return ApiResponse.<List<RoomSummary>>builder().result(roomService.listMyRooms()).build();
    }

    @PostMapping("/rooms/direct")
    @PreAuthorize("hasRole('PARENT')")
    @Operation(summary = "Mở (hoặc lấy lại) phòng chat trực tiếp với gia sư", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<RoomIdResponse> openDirect(@Valid @RequestBody OpenDirectRoomRequest request) {
        return ApiResponse.<RoomIdResponse>builder()
                .result(new RoomIdResponse(roomService.openDirectRoom(request.tutorId()))).build();
    }

    @PostMapping("/rooms/application")
    @PreAuthorize("hasRole('PARENT')")
    @Operation(summary = "Mở (hoặc lấy lại) phòng chat với một ứng viên của tin đăng", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<RoomIdResponse> openApplication(@Valid @RequestBody OpenApplicationRoomRequest request) {
        return ApiResponse.<RoomIdResponse>builder()
                .result(new RoomIdResponse(roomService.openApplicationRoom(request.applicationId()))).build();
    }

    @GetMapping("/rooms/{roomId}")
    @PreAuthorize("hasAnyRole('PARENT', 'TUTOR', 'RECEPTIONIST', 'ADMIN')")
    @Operation(summary = "Chi tiết phòng; SĐT phụ huynh chỉ có sau khi đề xuất được đồng ý", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<RoomDetail> room(@PathVariable Long roomId) {
        return ApiResponse.<RoomDetail>builder().result(roomService.getDetail(roomId)).build();
    }

    @GetMapping("/rooms/{roomId}/messages")
    @PreAuthorize("hasAnyRole('PARENT', 'TUTOR', 'RECEPTIONIST', 'ADMIN')")
    @Operation(summary = "Lịch sử tin nhắn theo cursor (before = mốc thời gian của tin cũ nhất đã có)", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<MessagePage> history(
            @PathVariable Long roomId, @RequestParam(required = false) String before, @RequestParam(required = false) Integer limit) {
        return ApiResponse.<MessagePage>builder().result(messageService.history(roomId, before, limit)).build();
    }

    @PostMapping("/rooms/{roomId}/messages")
    @PreAuthorize("hasAnyRole('PARENT', 'TUTOR')")
    @Operation(summary = "Gửi tin nhắn văn bản (kiểm duyệt PII, tối đa 2.000 ký tự, 10 tin/phút)", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<MessageItem> send(@PathVariable Long roomId, @Valid @RequestBody SendMessageRequest request) {
        return ApiResponse.<MessageItem>builder().result(messageService.send(roomId, request.text())).build();
    }

    @PostMapping("/rooms/{roomId}/messages/check")
    @PreAuthorize("hasAnyRole('PARENT', 'TUTOR')")
    @Operation(summary = "Kiểm tra trước khi gửi, trả vị trí vi phạm để tô đỏ", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<PreCheckResponse> check(@PathVariable Long roomId, @RequestBody SendMessageRequest request) {
        return ApiResponse.<PreCheckResponse>builder().result(messageService.preCheck(roomId, request.text())).build();
    }

    @PostMapping("/rooms/{roomId}/read")
    @PreAuthorize("hasAnyRole('PARENT', 'TUTOR')")
    @Operation(summary = "Đánh dấu đã đọc phòng", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<Void> read(@PathVariable Long roomId) {
        messageService.markRead(roomId);
        return ApiResponse.<Void>builder().message("Đã đánh dấu đã đọc").build();
    }

    @GetMapping("/rooms/{roomId}/proposals")
    @PreAuthorize("hasAnyRole('PARENT', 'TUTOR', 'RECEPTIONIST', 'ADMIN')")
    @Operation(summary = "Các đề xuất trong phòng", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<List<ProposalItem>> proposals(@PathVariable Long roomId) {
        return ApiResponse.<List<ProposalItem>>builder().result(proposalService.listByRoom(roomId)).build();
    }

    @GetMapping("/proposals/{proposalId}/student-account")
    @PreAuthorize("hasRole('PARENT')")
    @Operation(summary = "Tài khoản học sinh tạo từ đề xuất đã đồng ý", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<com.mycompany.englishtutor.module.messaging.api.ChatDtos.StudentAccountInfo> studentAccount(
            @PathVariable Long proposalId) {
        return ApiResponse.<com.mycompany.englishtutor.module.messaging.api.ChatDtos.StudentAccountInfo>builder()
                .result(proposalService.studentAccount(proposalId)).build();
    }

    @PostMapping("/rooms/{roomId}/proposals")
    @PreAuthorize("hasRole('TUTOR')")
    @Operation(summary = "Gia sư tạo đề xuất lớp học", security = @SecurityRequirement(name = BEARER))
    public ResponseEntity<ApiResponse<ProposalItem>> createProposal(
            @PathVariable Long roomId, @Valid @RequestBody ProposalRequest request, HttpServletRequest http) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<ProposalItem>builder()
                .message("Đã gửi đề xuất cho phụ huynh").result(proposalService.create(roomId, request, http)).build());
    }

    @PostMapping("/proposals/{proposalId}/accept")
    @PreAuthorize("hasRole('PARENT')")
    @Operation(summary = "Phụ huynh đồng ý đề xuất: tạo lớp dạy thử, mở khóa SĐT", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<AcceptResult> accept(@PathVariable Long proposalId, HttpServletRequest http) {
        return ApiResponse.<AcceptResult>builder()
                .message("Đã đồng ý đề xuất, lớp dạy thử đã được tạo").result(acceptService.accept(proposalId, http)).build();
    }

    @PostMapping("/proposals/{proposalId}/reject")
    @PreAuthorize("hasRole('PARENT')")
    @Operation(summary = "Phụ huynh từ chối đề xuất", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<ProposalItem> reject(
            @PathVariable Long proposalId, @Valid @RequestBody(required = false) RejectRequest request, HttpServletRequest http) {
        return ApiResponse.<ProposalItem>builder()
                .result(proposalService.reject(proposalId, request == null ? null : request.reason(), http)).build();
    }

    @PostMapping("/proposals/{proposalId}/withdraw")
    @PreAuthorize("hasRole('TUTOR')")
    @Operation(summary = "Gia sư rút đề xuất đang chờ", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<ProposalItem> withdraw(
            @PathVariable Long proposalId, @Valid @RequestBody WithdrawRequest request, HttpServletRequest http) {
        return ApiResponse.<ProposalItem>builder().result(proposalService.withdraw(proposalId, request.reason(), http)).build();
    }

    /** Kênh realtime một chiều. Client dùng fetch có header Authorization (EventSource không gửi được header). */
    @GetMapping("/stream")
    @PreAuthorize("hasAnyRole('PARENT', 'TUTOR')")
    @Operation(summary = "SSE nhận tin nhắn/đề xuất mới", security = @SecurityRequirement(name = BEARER))
    public SseEmitter stream() {
        return hub.subscribe(actor.currentUserId());
    }

    /** Tin bị chặn: trả 422 kèm vị trí vi phạm để frontend tô đỏ. */
    @ExceptionHandler(PiiBlockedException.class)
    public ResponseEntity<ApiResponse<List<PiiViolationItem>>> onPiiBlocked(PiiBlockedException e) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(ApiResponse.<List<PiiViolationItem>>builder()
                .code(ErrorCode.CHAT_PII_BLOCKED.getCode()).message(ErrorCode.CHAT_PII_BLOCKED.getMessage())
                .result(e.getViolations()).build());
    }
}
