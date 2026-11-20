package com.mycompany.englishtutor.module.messaging.pii;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/** Dùng chung bộ fixture với PII Guard App ({@code rocketchat-apps/pii-fixtures.json}). */
class PiiDetectorTest {

    private static final Path FIXTURE = Path.of("..", "rocketchat-apps", "pii-fixtures.json");
    private final PiiDetector detector = new PiiDetector();

    static Stream<Arguments> blocked() throws Exception {
        JsonNode root = new ObjectMapper().readTree(Files.readString(FIXTURE));
        List<Arguments> rows = new ArrayList<>();
        for (JsonNode n : root.get("blocked")) {
            rows.add(Arguments.of(n.get("type").asText(), n.get("text").asText()));
        }
        return rows.stream();
    }

    static Stream<Arguments> allowed() throws Exception {
        JsonNode root = new ObjectMapper().readTree(Files.readString(FIXTURE));
        List<Arguments> rows = new ArrayList<>();
        for (JsonNode n : root.get("allowed")) {
            rows.add(Arguments.of(n.asText()));
        }
        return rows.stream();
    }

    @ParameterizedTest
    @MethodSource("blocked")
    void blocksContactInformation(String type, String text) {
        PiiDetector.Detection result = detector.detect(text);

        assertTrue(result.blocked(), text);
        assertTrue(result.types().stream().anyMatch(t -> t.name().equals(type)), text);
    }

    @ParameterizedTest
    @MethodSource("allowed")
    void allowsPlainConversation(String text) {
        assertFalse(detector.detect(text).blocked(), text);
    }

    @Test
    void reportsSpanOfPhoneNumberWithoutLeadingSpace() {
        String text = "SĐT của chị là 0981 234 567 nhé";

        PiiDetector.Violation violation = detector.detect(text).violations().getFirst();

        assertEquals("0981 234 567", text.substring(violation.start(), violation.end()));
    }

    @Test
    void emptyOrNullIsNotBlocked() {
        assertFalse(detector.detect(null).blocked());
        assertEquals(List.of(), detector.detect("  ").violations());
    }
}
