package com.mycompany.englishtutor.module.messaging.service;

import java.util.List;

import com.mycompany.englishtutor.module.messaging.api.ChatDtos.PiiViolationItem;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

/** Tin nhắn bị chặn vì chứa thông tin liên hệ; mang theo vị trí vi phạm để frontend tô đỏ. */
public class PiiBlockedException extends AppException {

    private final transient List<PiiViolationItem> violations;

    public PiiBlockedException(List<PiiViolationItem> violations) {
        super(ErrorCode.CHAT_PII_BLOCKED);
        this.violations = violations;
    }

    public List<PiiViolationItem> getViolations() {
        return violations;
    }
}
