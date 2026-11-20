package com.mycompany.englishtutor.module.messaging.pii;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

/**
 * Phát hiện thông tin liên hệ (SĐT, email, link/handle mạng xã hội) trong tin nhắn.
 * Mẫu regex đồng bộ với {@code rocketchat-apps/pii-guard/src/piiDetector.ts}; hai bên dùng chung bộ fixture
 * {@code rocketchat-apps/pii-fixtures.json}.
 */
@Component
public class PiiDetector {

    public enum PiiType {
        PHONE,
        EMAIL,
        SOCIAL_LINK,
        SOCIAL_HANDLE
    }

    /** Một đoạn vi phạm: loại và vị trí [start, end) trong chuỗi gốc (theo chỉ số ký tự UTF-16). */
    public record Violation(PiiType type, int start, int end) {}

    public record Detection(boolean blocked, List<Violation> violations) {
        public List<PiiType> types() {
            return violations.stream().map(Violation::type).distinct().toList();
        }
    }

    private static final int FLAGS = Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE;

    private static final Pattern PHONE = Pattern.compile(
            "(?:^|[^\\d])((?:\\+?84|0)[\\s.()\\-]*[35789](?:[\\s.()\\-]*[\\dxX*]){8,9})(?=$|[^\\d])", FLAGS);
    private static final Pattern EMAIL =
            Pattern.compile("\\b[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}\\b", FLAGS);
    private static final Pattern SOCIAL_LINK = Pattern.compile(
            "(?:https?://|www\\.)?(?:zalo\\.me|(?:m\\.)?(?:facebook|fb)\\.com|t\\.me|telegram\\.me|wa\\.me"
                    + "|(?:www\\.)?instagram\\.com|linktr\\.ee)/[^\\s]+",
            FLAGS);
    private static final Pattern SOCIAL_HANDLE = Pattern.compile(
            "\\b(?:zalo|facebook|fb|messenger|telegram|whatsapp|instagram)\\s*"
                    + "(?:id|nick|user(?:name)?|tài\\s*khoản)?\\s*[:=\\-]\\s*@?[a-z0-9][a-z0-9._-]{2,}\\b",
            FLAGS);

    public Detection detect(String text) {
        String value = text == null ? "" : text;
        List<Violation> found = new ArrayList<>();
        collect(PHONE, PiiType.PHONE, value, found, 1);
        collect(EMAIL, PiiType.EMAIL, value, found, 0);
        collect(SOCIAL_LINK, PiiType.SOCIAL_LINK, value, found, 0);
        collect(SOCIAL_HANDLE, PiiType.SOCIAL_HANDLE, value, found, 0);
        found.sort(Comparator.comparingInt(Violation::start));
        return new Detection(!found.isEmpty(), List.copyOf(found));
    }

    private static void collect(Pattern pattern, PiiType type, String value, List<Violation> out, int group) {
        Matcher matcher = pattern.matcher(value);
        while (matcher.find()) {
            out.add(new Violation(type, matcher.start(group), matcher.end(group)));
        }
    }
}
