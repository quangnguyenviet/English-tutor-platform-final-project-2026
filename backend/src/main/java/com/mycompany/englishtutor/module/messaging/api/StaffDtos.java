package com.mycompany.englishtutor.module.messaging.api;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** DTO màn Lễ tân/Admin cho tính năng nhắn tin. */
public final class StaffDtos {

    private StaffDtos() {}

    public record StaffRoomItem(
            Long id,
            String roomType,
            String status,
            String parentName,
            String tutorName,
            Long classApplicationId,
            Long classRequestId,
            int pendingProposals,
            int acceptedProposals,
            int piiBlockedCount,
            String lastMessageAt,
            String createdAt) {}

    public record PiiEventItem(
            Long id,
            Long roomId,
            String type,
            String senderName,
            String detail,
            String blockedText,
            String reviewedByName,
            String reviewedAt,
            String reviewNote,
            String createdAt) {}

    public record PostingStaffItem(
            Long id, String status, String parentName, String parentPhone, String purpose, String province,
            String ward, String note, int applicantCount, String createdAt) {}

    public record TrialClassItem(
            Long classId, String className, String tutorName, String studentName, String parentName, String classType,
            String trialDate, String createdAt, Long classRequestId) {}

    public record Transcript(StaffRoomItem room, ChatDtos.MessagePage messages, List<ChatDtos.ProposalItem> proposals,
                             List<PiiEventItem> piiEvents) {}

    public record ReviewRequest(@Size(max = 500) String note) {}

    public record ReasonRequest(@NotBlank(message = "Vui lòng nhập lý do") @Size(max = 500) String reason) {}

    public record FeePolicyRequest(
            @NotBlank String classType,
            @NotNull java.math.BigDecimal feePercentage) {}

    /** Payload từ PII Guard App (ký HMAC) khi chặn tin trực tiếp trên Rocket.Chat. */
    public record InternalPiiEvent(String rocketRoomId, String rocketUsername, List<String> types, Integer textLength) {}
}
