package com.mycompany.englishtutor.module.complaint.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.mycompany.englishtutor.module.complaint.domain.enums.RequestOutcome;
import com.mycompany.englishtutor.module.complaint.service.ComplaintTargetEvaluator.Decision;
import com.mycompany.englishtutor.module.complaint.service.ComplaintTargetEvaluator.Evaluation;
import com.mycompany.englishtutor.module.complaint.service.ComplaintTargetEvaluator.TargetState;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

/** Bảng "Trạng thái lớp khi Giải quyết" trong Plan khiếu nại mục 3. */
class ComplaintTargetEvaluatorTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 11, 7);

    private static Evaluation eval(String requestStatus, String classStatus, LocalDate activeFrom,
            Long complaintClassId, String complaintClassStatus) {
        return ComplaintTargetEvaluator.evaluate(
                new TargetState(requestStatus, classStatus, activeFrom, complaintClassId, complaintClassStatus), TODAY);
    }

    private static ErrorCode errorOf(Runnable action) {
        return assertThrows(AppException.class, action::run).getErrorCode();
    }

    @Test
    void openRequest_onlyCancelAllowed_andEmptyOutcomeMeansCancel() {
        Evaluation e = eval("OPEN", null, null, null, null);

        assertEquals(List.of(RequestOutcome.CANCELLED), e.allowedOutcomes());
        assertFalse(e.hasTutor());
        Decision d = ComplaintTargetEvaluator.decide(null, e, 0);
        assertEquals(RequestOutcome.CANCELLED, d.outcome());
        assertFalse(d.alreadyHandled());
    }

    @Test
    void openRequest_rematch_isNotProcessable() {
        Evaluation e = eval("NEW", null, null, null, null);

        assertEquals(ErrorCode.COMPLAINT_TARGET_NOT_PROCESSABLE,
                errorOf(() -> ComplaintTargetEvaluator.decide(RequestOutcome.REMATCH, e, 0)));
    }

    @Test
    void trialClass_bothOutcomesAllowed_andChoiceIsRequired() {
        Evaluation e = eval("MATCHED", "TRIAL", null, 21L, "TRIAL");

        assertTrue(e.hasTutor());
        assertEquals(List.of(RequestOutcome.CANCELLED, RequestOutcome.REMATCH), e.allowedOutcomes());
        assertEquals(ErrorCode.COMPLAINT_OUTCOME_REQUIRED,
                errorOf(() -> ComplaintTargetEvaluator.decide(null, e, 0)));
        assertEquals(RequestOutcome.REMATCH, ComplaintTargetEvaluator.decide(RequestOutcome.REMATCH, e, 0).outcome());
    }

    @Test
    void activeClass_onSeventhDay_isStillAllowed() {
        Evaluation e = eval("MATCHED", "ACTIVE", TODAY.minusDays(7), 21L, "ACTIVE");

        assertFalse(e.windowExpired());
        assertEquals(RequestOutcome.REMATCH, ComplaintTargetEvaluator.decide(RequestOutcome.REMATCH, e, 0).outcome());
    }

    @Test
    void activeClass_afterSevenDays_isExpired() {
        Evaluation e = eval("MATCHED", "ACTIVE", TODAY.minusDays(8), 21L, "ACTIVE");

        assertTrue(e.windowExpired());
        assertTrue(e.allowedOutcomes().isEmpty());
        assertEquals(ErrorCode.COMPLAINT_WINDOW_EXPIRED,
                errorOf(() -> ComplaintTargetEvaluator.decide(RequestOutcome.CANCELLED, e, 0)));
        assertEquals(ErrorCode.COMPLAINT_WINDOW_EXPIRED,
                errorOf(() -> ComplaintTargetEvaluator.decide(null, e, 0)));
    }

    @Test
    void manuallyCancelled_requiresEvidence_andIgnoresWindow() {
        Evaluation e = eval("CANCELLED", "CANCELLED", TODAY.minusDays(30), 21L, "CANCELLED");

        assertTrue(e.handled(RequestOutcome.CANCELLED));
        assertEquals(ErrorCode.COMPLAINT_EVIDENCE_REQUIRED,
                errorOf(() -> ComplaintTargetEvaluator.decide(RequestOutcome.CANCELLED, e, 0)));
        Decision d = ComplaintTargetEvaluator.decide(null, e, 1);
        assertEquals(RequestOutcome.CANCELLED, d.outcome());
        assertTrue(d.alreadyHandled());
    }

    @Test
    void manuallyCancelled_chooseRematch_isNotProcessable() {
        Evaluation e = eval("CANCELLED", null, null, null, null);

        assertEquals(ErrorCode.COMPLAINT_TARGET_NOT_PROCESSABLE,
                errorOf(() -> ComplaintTargetEvaluator.decide(RequestOutcome.REMATCH, e, 2)));
    }

    @Test
    void manuallyRematched_classOnComplaintClosed_requiresEvidence() {
        Evaluation e = eval("REMATCH", "CANCELLED", null, 21L, "CANCELLED");

        assertTrue(e.handled(RequestOutcome.REMATCH));
        assertEquals(ErrorCode.COMPLAINT_EVIDENCE_REQUIRED,
                errorOf(() -> ComplaintTargetEvaluator.decide(RequestOutcome.REMATCH, e, 0)));
        assertTrue(ComplaintTargetEvaluator.decide(RequestOutcome.REMATCH, e, 1).alreadyHandled());
    }

    @Test
    void manuallyRematched_andMatchedWithNewTutor_isStillHandled() {
        Evaluation e = eval("MATCHED", "TRIAL", null, 21L, "CANCELLED");

        assertTrue(e.handled(RequestOutcome.REMATCH));
        Decision d = ComplaintTargetEvaluator.decide(null, e, 1);
        assertEquals(RequestOutcome.REMATCH, d.outcome());
        assertTrue(d.alreadyHandled());
    }
}
