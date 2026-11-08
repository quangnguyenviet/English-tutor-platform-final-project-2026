package com.mycompany.englishtutor.module.complaint.service;

import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import com.mycompany.englishtutor.module.complaint.domain.enums.RequestOutcome;
import com.mycompany.englishtutor.module.matching.service.MatchingLifecycleSupport;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

/**
 * Quy tắc xử lý lớp cần gia sư khi giải quyết khiếu nại không hoàn tiền (Plan mục 0, mục 3).
 *
 * <p>Hàm thuần, dùng chung cho màn chi tiết (để UI biết lựa chọn nào hợp lệ) và cho thao tác giải quyết,
 * nên hai phía không lệch nhau.
 */
public final class ComplaintTargetEvaluator {

    private ComplaintTargetEvaluator() {}

    /**
     * @param requestStatus        {@code class_requests.status} thô: NEW, OPEN, MATCHED, REMATCH, CANCELLED
     * @param latestClassStatus    trạng thái lớp học mới nhất, null nếu chưa có lớp
     * @param latestActiveFrom     ngày học chính thức của lớp mới nhất
     * @param complaintClassId     lớp học ghi trên khiếu nại lúc tạo đơn
     * @param complaintClassStatus trạng thái hiện tại của lớp ghi trên khiếu nại
     */
    public record TargetState(
            String requestStatus,
            String latestClassStatus,
            LocalDate latestActiveFrom,
            Long complaintClassId,
            String complaintClassStatus) {}

    public record Evaluation(
            boolean hasTutor,
            boolean windowExpired,
            List<RequestOutcome> allowedOutcomes,
            Map<RequestOutcome, Boolean> alreadyHandled) {

        public boolean handled(RequestOutcome outcome) {
            return Boolean.TRUE.equals(alreadyHandled.get(outcome));
        }
    }

    public record Decision(RequestOutcome outcome, boolean alreadyHandled) {}

    public static Evaluation evaluate(TargetState state, LocalDate today) {
        boolean cancelled = is(state.requestStatus(), "CANCELLED");
        boolean hasTutor = is(state.requestStatus(), "MATCHED")
                && (is(state.latestClassStatus(), "TRIAL") || is(state.latestClassStatus(), "ACTIVE"));
        boolean windowExpired = !cancelled && isWindowExpired(state.latestClassStatus(), state.latestActiveFrom(), today);

        Map<RequestOutcome, Boolean> handled = new EnumMap<>(RequestOutcome.class);
        handled.put(RequestOutcome.CANCELLED, cancelled);
        handled.put(RequestOutcome.REMATCH,
                !cancelled && state.complaintClassId() != null && is(state.complaintClassStatus(), "CANCELLED"));

        List<RequestOutcome> allowed;
        if (cancelled || windowExpired) {
            allowed = List.of();
        } else if (hasTutor) {
            allowed = List.of(RequestOutcome.CANCELLED, RequestOutcome.REMATCH);
        } else {
            allowed = List.of(RequestOutcome.CANCELLED);
        }
        return new Evaluation(hasTutor, windowExpired, allowed, handled);
    }

    /**
     * Chuẩn hóa lựa chọn của Lễ tân và kiểm tra theo bảng "Trạng thái lớp khi Giải quyết".
     *
     * @throws AppException 1513, 1514, 1516 hoặc 1503 khi không hợp lệ
     */
    public static Decision decide(RequestOutcome requested, Evaluation evaluation, int fileCount) {
        RequestOutcome outcome = requested;
        if (outcome == null) {
            if (evaluation.handled(RequestOutcome.CANCELLED)) {
                outcome = RequestOutcome.CANCELLED;
            } else if (evaluation.handled(RequestOutcome.REMATCH)) {
                outcome = RequestOutcome.REMATCH;
            } else if (evaluation.allowedOutcomes().size() == 1) {
                outcome = evaluation.allowedOutcomes().get(0);
            } else if (evaluation.allowedOutcomes().isEmpty()) {
                throw new AppException(evaluation.windowExpired()
                        ? ErrorCode.COMPLAINT_WINDOW_EXPIRED
                        : ErrorCode.COMPLAINT_TARGET_NOT_PROCESSABLE);
            } else {
                throw new AppException(ErrorCode.COMPLAINT_OUTCOME_REQUIRED);
            }
        }

        if (evaluation.handled(outcome)) {
            if (fileCount <= 0) {
                throw new AppException(ErrorCode.COMPLAINT_EVIDENCE_REQUIRED);
            }
            return new Decision(outcome, true);
        }
        if (evaluation.windowExpired()) {
            throw new AppException(ErrorCode.COMPLAINT_WINDOW_EXPIRED);
        }
        if (!evaluation.allowedOutcomes().contains(outcome)) {
            throw new AppException(ErrorCode.COMPLAINT_TARGET_NOT_PROCESSABLE);
        }
        return new Decision(outcome, false);
    }

    /** Lớp đã ghép thành công quá 7 ngày kể từ {@code active_from} (Quy định website I.3). */
    public static boolean isWindowExpired(String classStatus, LocalDate activeFrom, LocalDate today) {
        boolean matched = is(classStatus, "ACTIVE") || is(classStatus, "COMPLETED");
        LocalDate deadline = MatchingLifecycleSupport.cancelDeadline(activeFrom);
        return matched && deadline != null && today.isAfter(deadline);
    }

    private static boolean is(String value, String expected) {
        return expected.equalsIgnoreCase(value);
    }
}
