package com.mycompany.englishtutor.module.messaging.api;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** DTO của API nhắn tin và đề xuất. */
public final class ChatDtos {

    private ChatDtos() {}

    public record Counterpart(Long userId, String fullName, String avatarUrl, String role) {}

    public record RoomSummary(
            Long id,
            String roomType,
            String status,
            boolean writable,
            Counterpart counterpart,
            Long classApplicationId,
            Long classRequestId,
            int unread,
            String lastMessageAt,
            int pendingProposals) {}

    public record ChildItem(Long studentId, String fullName, String grade) {}

    /** Thông tin phụ huynh phía gia sư; {@code phone} chỉ có sau khi một đề xuất được đồng ý (Phone Gate). */
    public record ParentInfo(
            String fullName,
            String purpose,
            String province,
            String ward,
            String phone,
            boolean phoneUnlocked,
            String phoneUnlockedAt,
            List<ChildItem> children) {}

    public record TutorInfo(String university, Integer experienceYears, String bio) {}

    public record RoomDetail(RoomSummary room, ParentInfo parent, TutorInfo tutor) {}

    public record StudentInfo(Long studentId, String name, String grade, String school, String learningGoal, boolean isNew) {}

    /** Tài khoản học sinh tạo lần đầu; password chỉ có khi học sinh chưa đổi mật khẩu mặc định. */
    public record StudentAccountInfo(String studentName, String username, String initialPassword, boolean passwordChanged) {}

    /** Khung giờ học của một thứ: {@code dayOfWeek} 1 = Thứ 2 … 7 = Chủ nhật, giờ dạng HH:mm. */
    public record ScheduleSlot(
            @NotNull(message = "Vui lòng chọn thứ trong tuần") Integer dayOfWeek,
            @NotBlank(message = "Vui lòng nhập giờ bắt đầu") String startTime,
            @NotBlank(message = "Vui lòng nhập giờ kết thúc") String endTime) {}

    /**
     * {@code learningAddress}: địa chỉ học tại nhà lấy theo hồ sơ phụ huynh; gia sư chỉ nhận phường/xã, tỉnh/thành.
     * {@code parentPhone}:
     * chỉ có khi đề xuất đã được đồng ý (Phone Gate), null ở mọi trạng thái khác.
     */
    public record ProposalItem(
            Long id,
            Long roomId,
            int version,
            String status,
            StudentInfo student,
            String classType,
            BigDecimal feePercentage,
            BigDecimal pricePerSession,
            String startDate,
            List<ScheduleSlot> scheduleSlots,
            String trialDate,
            String trialTimeFrom,
            String trialTimeTo,
            String classMode,
            String note,
            String rejectionReason,
            String decidedAt,
            String createdAt,
            String expiresAt,
            Long classId,
            boolean studentConflict,
            String learningAddress,
            String parentPhone) {}

    /** type: TEXT | SYSTEM | PROPOSAL. */
    public record MessageItem(
            String id,
            String type,
            String text,
            Long senderUserId,
            String senderRole,
            boolean mine,
            String createdAt,
            ProposalItem proposal) {}

    public record MessagePage(List<MessageItem> items, String nextCursor) {}

    public record SendMessageRequest(
            @NotBlank(message = "Nội dung tin nhắn không được để trống")
                    @Size(max = 2000, message = "Tin nhắn tối đa 2.000 ký tự")
                    String text) {}

    public record PiiViolationItem(String type, int start, int end) {}

    public record PreCheckResponse(boolean blocked, List<PiiViolationItem> violations) {}

    public record OpenDirectRoomRequest(@NotNull(message = "Thiếu gia sư") Long tutorId) {}

    public record OpenApplicationRoomRequest(@NotNull(message = "Thiếu ứng viên") Long applicationId) {}

    public record RoomIdResponse(Long roomId) {}

    public record ProposalRequest(
            Long studentId,
            @Size(min = 2, max = 50, message = "Họ tên học sinh từ 2 đến 50 ký tự") String studentName,
            @Size(max = 20) String studentGrade,
            @Size(max = 200) String studentSchool,
            @Size(max = 1000) String studentLearningGoal,
            @NotBlank(message = "Vui lòng chọn loại lớp") String classType,
            @NotNull(message = "Vui lòng nhập học phí mỗi buổi") BigDecimal pricePerSession,
            @NotBlank(message = "Vui lòng chọn ngày bắt đầu học") String startDate,
            @NotEmpty(message = "Vui lòng chọn thứ trong tuần") List<@NotNull @Valid ScheduleSlot> scheduleSlots,
            @NotBlank(message = "Vui lòng chọn hình thức dạy") String classMode,
            @Size(max = 1000) String note) {}

    public record RejectRequest(@Size(max = 500, message = "Lý do tối đa 500 ký tự") String reason) {}

    public record WithdrawRequest(
            @NotBlank(message = "Vui lòng nhập lý do rút đề xuất") @Size(min = 5, max = 500, message = "Lý do từ 5 đến 500 ký tự")
                    String reason) {}

    /** Kết quả đồng ý đề xuất; mật khẩu chỉ có khi tài khoản học sinh vừa được tạo. */
    public record AcceptResult(
            Long proposalId,
            Long classId,
            Long classRequestId,
            Long studentId,
            String studentUsername,
            String initialPassword,
            boolean studentCreated) {}
}
