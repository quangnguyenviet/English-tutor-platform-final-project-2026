package com.mycompany.englishtutor.module.quiz.ai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.englishtutor.module.quiz.ai.dto.AiChatPayload;
import com.mycompany.englishtutor.module.quiz.ai.dto.AiChatResult;
import com.mycompany.englishtutor.module.quiz.ai.dto.AiDraftQuestion;
import com.mycompany.englishtutor.module.quiz.ai.dto.AiRecentMessage;
import com.mycompany.englishtutor.module.quiz.ai.dto.AiSkillInfo;

/**
 * Kiểm định wire format giữa Backend (Jackson) và AI Service (Pydantic).
 * Dùng {@code Jackson2ObjectMapperBuilder} — đúng factory Spring dựng
 * {@code ObjectMapper} cho {@code RestClient} — để mô phỏng chính xác JSON
 * được gửi/nhận (snake_case, khớp Pydantic phía AI).
 */
class AiPayloadSerializationTest {

    private final ObjectMapper mapper = Jackson2ObjectMapperBuilder.json().build();

    @Test
    void request_serializesToSnakeCaseKeys() throws Exception {
        AiChatPayload payload =
                AiChatPayload.of(
                        "HS-20",
                        "Lớp 9",
                        "IELTS",
                        List.of(new AiSkillInfo("narrative_tense", "Kể chuyện quá khứ", "SPEAKING", 0.7, "2026-09-10T00:00:00Z")),
                        List.of(AiSkillInfo.catalog("present_simple", "Thì hiện tại đơn", "GRAMMAR")),
                        List.of(
                                new AiDraftQuestion(
                                        "She ___ to school.",
                                        Map.of("A", "go", "B", "goes", "C", "going", "D", "gone"),
                                        "B",
                                        "Hiện tại đơn.",
                                        "A1",
                                        "present_simple",
                                        0)),
                        List.of(new AiRecentMessage("user", "Tạo 5 câu")),
                        "Tạo 5 câu B1",
                        "B1");

        JsonNode node = mapper.valueToTree(payload);

        assertEquals("HS-20", node.get("student_code").asText());
        assertEquals("Lớp 9", node.get("grade").asText());
        assertEquals("IELTS", node.get("learning_goal").asText());
        assertEquals("B1", node.get("cefr_hint").asText());
        assertEquals("Tạo 5 câu B1", node.get("message").asText());

        // skill_profile: snake_case fields + thống kê (error_rate, last_practiced_at).
        JsonNode profile = node.get("skill_profile").get(0);
        assertEquals("narrative_tense", profile.get("skill_code").asText());
        assertEquals(0.7, profile.get("error_rate").asDouble(), 0.0001);
        assertEquals("2026-09-10T00:00:00Z", profile.get("last_practiced_at").asText());

        // skill_catalog: entry catalog bỏ các field thống kê (NON_NULL, khớp Pydantic).
        JsonNode catalog = node.get("skill_catalog").get(0);
        assertEquals("present_simple", catalog.get("skill_code").asText());
        assertEquals("GRAMMAR", catalog.get("category").asText());
        assertNull(catalog.get("error_rate"));
        assertNull(catalog.get("last_practiced_at"));

        // current_draft: QuizDraftSchema snake_case, options là object A-D.
        JsonNode draft = node.get("current_draft").get(0);
        assertEquals("B", draft.get("correct").asText());
        assertEquals("A1", draft.get("cefr").asText());
        assertEquals("goes", draft.get("options").get("B").asText());

        // recent_messages.
        assertEquals("user", node.get("recent_messages").get(0).get("role").asText());
    }

    @Test
    void response_deserializesFromAiServiceJson() throws Exception {
        String json =
                """
                {
                  "reply": "Đã soạn 1 câu B1.",
                  "questions": [
                    {
                      "content": "Yesterday I ____ my grandma.",
                      "options": {"A": "helps", "B": "helped", "C": "helping", "D": "have helped"},
                      "correct": "B",
                      "explanation": "Quá khứ đơn.",
                      "cefr": "B1",
                      "skill": "narrative_tense"
                    }
                  ]
                }
                """;
        AiChatResult result = mapper.readValue(json, AiChatResult.class);

        assertEquals("Đã soạn 1 câu B1.", result.reply());
        assertEquals(1, result.safeQuestions().size());
        AiDraftQuestion q = result.safeQuestions().get(0);
        assertEquals("Yesterday I ____ my grandma.", q.content());
        assertEquals("helped", q.options().get("B"));
        assertEquals("narrative_tense", q.skill());
    }

    @Test
    void response_handlesNullQuestions() throws Exception {
        AiChatResult result = mapper.readValue("{}", AiChatResult.class);
        assertEquals(0, result.safeQuestions().size());
    }
}
