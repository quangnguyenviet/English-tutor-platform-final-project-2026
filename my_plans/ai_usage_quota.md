# Kế hoạch: Quota trợ lý AI theo token, **gộp chung gói thuê bao** (FREE / PRO / PREMIUM) + đổi tên catalog gói

> Yêu cầu gốc + các lần chốt với user:
> - "Nghĩa giải pháp để tính tiền phí sử dụng AI của gia sư."
> - **Không giới hạn theo lượt** — task tốn 10K token và 3K token phải trừ khác nhau (đúng bản chất
>   chi phí LLM). → Quota tính theo **token thật** (prompt + completion), pool theo **tháng dương lịch**.
> - **Chốt: GỘP 1 gói** — storage + AI là 1 gói thuê bao (extend chính catalog V29, KHÔNG làm
>   catalog `ai_tiers` riêng). 1 subscription = 1 rổ resource (model SaaS), admin 1 select,
>   widget 1 card 2 thanh. Đã từ bỏ "mua chỉ AI / chỉ storage" (persona yếu trong domain); hướng
>   mở rộng sau = add-on token lẻ, không quyết v1.
> - **Chốt (bổ sung, user): đổi tên bảng `storage_tiers` → `tutor_tiers`** — catalog "gói thuê bao"
>   chung (chứa storage + token AI), không mang tên 1 resource. Rename **trước khi merge V29 vào
>   dev** (V29 đang nằm trên `feature/tutor-storage-quota`, dev mới ở `548f1ff` msg-messaging)
>   → sửa thẳng file migration + code trên feature branch, KHÔNG cần migration chuyển đổi dữ liệu
>   (mục 3).
> - Pool token tháng: **FREE 100K / PRO 500K / PREMIUM 2M** (token = prompt + completion). FREE ≠ 0.
> - Định giá theo **DeepSeek V4 Flash** (bảng giá API DeepSeek, 07/2026, cache miss):
>   off-peak **$0.15/M input, $0.60/M output**; peak (01:00–04:00 & 06:00–10:00 UTC) = off-peak ×2.
>   Theo 26.500đ/USD, 1M token (2:1 input:output) ≈ **$2.10 ≈ 55.700đ**:
>   FREE 100K ≈ **5.6Kđ** / PRO 500K ≈ **28Kđ** / PREMIUM 2M ≈ **111Kđ** (vốn off-peak).
>   *Update số khi giá provider đổi; peak window 13:00–17:00 VN → chi phí thực tế gần off-peak.*

## 0. Trạng thái nhánh (check thực tế 07/2026)

- `dev` (local + origin) HEAD = `548f1ff` (merge msg-messaging). **Các commit V29
  (`4f2f07d`…`2aaeb05`) CHƯA merge dev** — vẫn nằm trên `feature/tutor-storage-quota`.
- → Trật tự làm việc: **(A)** rename `storage_tiers` → `tutor_tiers` trên `feature/tutor-storage-quota`
  (1 commit mới, mục 3), **(B)** gộp PR V29 + rename vào `dev`, **(C)** tách
  `feature/ai-usage-quota` từ `dev` để làm V30 (mục 4–9).

## 1. Context — tại sao phải làm

`AiQuizService.aiChatQuiz` (FR-13/UC-T06) gọi LLM không giới hạn — chi phí token do hệ thống chịu.
AI service (Python) có biến dự phòng `LLM_MONTHLY_BUDGET_USD` nhưng chưa implement
([ai/README.md](../ai/README.md)). Giải pháp: quota token **theo tháng dương lịch**, **gộp vào chính
gói thuê bao** (lễ tân gán + thu tiền offline, đúng model V29 — không cần payment gateway).
Gói trả phí hết hạn → tự hạ về FREE (không cần scheduled job).

**Giống V29 (storage) ở:** dùng chung catalog, dùng chung `tutors.tier_id` + `tier_expires_at`,
bảng lịch sử subscription, UI admin, widget — AI chỉ thêm 1 cột + 1 bảng log + 1 thanh progress.

**Khác storage ở 1 điểm duy nhất:** storage là **trần tổng** (bytes, không reset); AI là **pool
tháng** (token, reset `date_trunc('month')`).

## 2. Rename catalog `storage_tiers` → `tutor_tiers` (làm trên `feature/tutor-storage-quota`)

> Vì V29 chưa merge dev + chưa có DB production chạy bảng này, rename = **sửa thẳng file V29 +
> mọi tham chiếu** (1 commit refactor), rẻ hơn nhiều so với migration chuyển đổi về sau.
> **Lưu ý DB local:** nếu DB dev đã chạy flyway V29, sửa file V29 làm sai checksum →
> `DELETE FROM flyway_schema_history WHERE version='29' AND script_name LIKE '%tutor_storage_tier%'`
> rồi drop các bảng/tại cột liên quan, chạy lại `docker compose up` (hoặc tạo DB mới).

Bảng đặt tên mới (dùng xuyên suốt mục 4–9):

| Hiện tại (đã commit V29) | Sau rename |
|---|---|
| Bảng `storage_tiers` | **`tutor_tiers`** (catalog gói thuê bao: `id, code, name, quota_bytes, is_default, is_paid` + `ai_tokens` ở V30) |
| `tutors.storage_tier_id` / `storage_tier_expires_at` | **`tutors.tier_id`** / **`tier_expires_at`** |
| Bảng `tutor_storage_subscriptions` | **`tutor_subscriptions`** |
| Entity `StorageTier` / `StorageTierRepository` | **`TutorTier`** / **`TutorTierRepository`** |
| Entity `TutorStorageSubscription` + repo | **`TutorSubscription`** + **`TutorSubscriptionRepository`** |
| Service `TutorStorageService` / response `TutorStorageResponse` | **`TutorTierService`** / **`TutorTierResponse`** (widget "Gói thuê bao") |
| Endpoint `GET /tutors/me/storage` | **`GET /tutors/me/tier`** (API chưa release — cùng feature branch, FE + BE đổi cùng lúc) |
| Endpoint `GET /tutors/{id}/storage-subscriptions` | **`GET /tutors/{id}/tier-subscriptions`** |
| Request field `storageTier` / `storageTierDurationMonths` | **`tier`** / **`tierDurationMonths`** |
| Response field `storageTier` / `storageTierExpiresAt` | **`tier`** / **`tierExpiresAt`** |
| ErrorCode 1603–1605 | **Giữ nguyên số** (FE `QuizAiAssistant`/`ManageSessions` đã dùng 1603/1604), chỉ viết lại message cho hợp nghĩa: 1604 = "Gói trả phí đã hết hạn, vui lòng liên hệ lễ tân để gia hạn"; 1605 = "Không tìm thấy gói được chỉ định" (dùng chung cả storage gate + AI gate) |
| FE copy "Gói lưu trữ" (admin modal, widget) | **"Gói thuê bao"** (V30 bổ nghĩa "Gói thuê bao (lưu trữ + trợ lý AI)") |
| File migration `V29__tutor_storage_tier.sql` | Đổi tên file thành **`V29__tutor_tier.sql`** (flyway nhận script_name mới — DB dev phải xóa history V29 như trên) |
| FE `apiGetTutorStorage` / `apiGetTutorStorageSubscriptions` | **`apiGetTutorTier`** / **`apiGetTutorTierSubscriptions`** |

Phạm vị sửa (liệt kê để commit nhỏ, kiểm tra từng bước theo CLAUDE.md):
1. Migration V29 (đổi tên file + bảng + cột + comment seed).
2. Entities/repos (`Tutor`, `TutorTier`, `TutorSubscription` + 2 repo, `AdminTutorService` block gán gói, `ErrorCode`).
3. Gate upload + widget (`ClassOccurrenceService.checkStorageQuota`, `TutorTierService`, controller, response).
4. Tests (`TutorStorageServiceTest` → `TutorTierServiceTest`, `AdminTutorServiceTest`, `ClassOccurrenceServiceTest`).
5. Frontend (5 file V29: `tutorApi.js`, `TutorDashboard.jsx`, `TutorManagement.jsx`, `ManageSessions.jsx`, …).

**Commit: 1–2 commit** trên `feature/tutor-storage-quota` (đề xuất 1 commit
`refactor(tutor): đổi tên catalog gói storage_tiers thành tutor_tiers (gói thuê bao chung)`
bao gồm 5 mục trên — V29 chưa merge nên squash gọn). Chạy `mvn test` + `vite build` xanh.

## 3. Database — migration V30 (làm trên `feature/ai-usage-quota`, tách từ `dev` sau khi merge V29)

```sql
-- V30: Quota trợ lý AI theo token, GỘP vào gói thuê bao (catalog tutor_tiers, V29).
-- 1 gói = dung lượng lưu trữ (quota_bytes, trần tổng) + token AI (ai_tokens, pool THÁNG).
-- Reuse toàn bộ V29: tutor_tiers / tutors.tier_id / tier_expires_at / tutor_subscriptions.
-- Chỉ thêm: (1) tutor_tiers.ai_tokens, (2) ai_usage_logs.

-- 1. Cột pool token AI trên catalog (backfill DEFAULT 0 rồi seed theo mã).
ALTER TABLE tutor_tiers ADD COLUMN ai_tokens BIGINT NOT NULL DEFAULT 0 CHECK (ai_tokens >= 0);
UPDATE tutor_tiers SET ai_tokens = 100000  WHERE code = 'FREE';    -- ~$0.21 / ~5.6Kđ
UPDATE tutor_tiers SET ai_tokens = 500000  WHERE code = 'PRO';     -- ~$1.05 / ~28Kđ
UPDATE tutor_tiers SET ai_tokens = 2000000 WHERE code = 'PREMIUM'; -- ~$4.20 / ~111Kđ

-- 2. Log tiêu thụ (mỗi call LLM thành công = 1 row; call lỗi 502/timeout KHÔNG log).
CREATE TABLE ai_usage_logs (
    id                BIGSERIAL   PRIMARY KEY,
    tutor_id          BIGINT      NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    lesson_id         BIGINT      REFERENCES lessons(id) ON DELETE SET NULL,
    prompt_tokens     INTEGER     NOT NULL DEFAULT 0,
    completion_tokens INTEGER     NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_usage_logs_tutor_created ON ai_usage_logs(tutor_id, created_at);
```

- `lesson_id` SET NULL (không CASCADE) — xóa lesson không mất lịch sử tiêu thụ.
- Index composite `(tutor_id, created_at)` cho SUM theo tháng (gate + widget 1 query
  `WHERE tutor_id = ? AND created_at >= date_trunc('month', now())`).
- Không đụng `tutors`, `tutor_subscriptions`, `lesson_materials` (V29 giữ nguyên sau rename).
- Không scheduled job — reset tháng + hết hạn gói xử lý lazy tại thời điểm gọi AI/widget kế tiếp.
- `ddl-auto: validate` → entity `TutorTier` phải có field `aiTokens` khớp, nếu không app không start.

## 4. Backend (V30)

### 4.1 Catalog `TutorTier` + cột `aiTokens`

- `module/tutor/domain/TutorTier.java` (bảng `tutor_tiers`) — thêm cạnh `quotaBytes`:
  ```java
  /** Pool token trợ lý AI của gói, tính theo THÁNG (V30; khác quota_bytes là trần tổng). */
  @Builder.Default
  @Column(name = "ai_tokens", nullable = false)
  Long aiTokens = 0L;
  ```
- `TutorTierRepository` (V29, đã đổi tên) giữ nguyên — `findByCode` / `findByIsDefaultTrue` / `findById`.
  Logic "hết hạn → hạ về FREE" (mirror [TutorStorageService.java:47-54](../backend/src/main/java/com/mycompany/englishtutor/module/tutor/service/TutorStorageService.java#L47-L54),
  sẽ thành `TutorTierService` sau rename): gói `isPaid=TRUE` mà `tierExpiresAt` đã qua → effective = `findByIsDefaultTrue()`.

### 4.2 Entity `AiUsageLog` + repo + `ErrorCode`

- `module/quiz/domain/AiUsageLog.java` (entity JPA, bảng `ai_usage_logs`) —
  `id, tutorId, lessonId, promptTokens, completionTokens, createdAt`.
- `module/quiz/repository/AiUsageLogRepository.java` (JpaRepository + 2 native method):
  ```java
  @Modifying
  @Query(value = """
      INSERT INTO ai_usage_logs (tutor_id, lesson_id, prompt_tokens, completion_tokens)
      VALUES (:tutorId, :lessonId, :promptTokens, :completionTokens)
      """)
  void logCall(@Param("tutorId") Long tutorId, @Param("lessonId") Long lessonId,
               @Param("promptTokens") int promptTokens, @Param("completionTokens") int completionTokens);

  @Query(value = """
      SELECT COALESCE(SUM(prompt_tokens + completion_tokens), 0)
      FROM ai_usage_logs
      WHERE tutor_id = :tutorId AND created_at >= date_trunc('month', NOW())
      """)
  long sumTokensThisMonth(@Param("tutorId") Long tutorId);
  ```
- `shared/exception/ErrorCode.java` — thêm 1 mã sau 1605 (1606; precedent 400):
  ```java
  // --- Quota trợ lý AI theo gói thuê bao (gộp V30 vào tutor_tiers) ---
  AI_USAGE_QUOTA_EXCEEDED(
      1606, "Bạn đã dùng hết token trợ lý AI của tháng này, vui lòng liên hệ lễ tân để nâng gói",
      HttpStatus.BAD_REQUEST),
  ```
  **Chỉ thêm 1 mã.** "Gói không tồn tại" tái dùng `TUTOR_TIER_NOT_FOUND`(1605, message đã đổi
  sang nghĩa chung ở mục 2). Hết hạn mà vượt cả pool FREE → vẫn 1606 (CTA "liên hệ lễ tân"
  bao trùm nâng gói + gia hạn).

### 4.3 AI service (Python) trả `usage` tokens — thay đổi nhỏ, không đổi contract

| File | Thay đổi |
|---|---|
| [ai/app/schemas.py](../ai/app/schemas.py) | `class AiUsage(BaseModel): prompt_tokens: int = 0; completion_tokens: int = 0`; `QuizChatResponse` + `usage: AiUsage = AiUsage()` (default → client cũ vẫn parse được). |
| [ai/app/llm.py](../ai/app/llm.py) | `generate_openai`: đọc `resp.usage` (OpenAI SDK luôn trả `prompt_tokens`/`completion_tokens`). `generate_anthropic`: `data["usage"]`. Provider không trả usage → mặc định 0 (quota "đếm thiếu", rủi ro mục 7). |
| [ai/README.md](../ai/README.md) | Ghi response `quiz/chat` kèm `usage`; nhắc `LLM_MONTHLY_BUDGET_USD` chưa implement (budget provider, khác quota gia sư). |

### 4.4 Backend DTO + gate quota trong `AiQuizService`

- `module/quiz/ai/dto/AiChatResult.java` — record thêm field `usage` (wire Python:
  `{"reply","questions","usage":{"prompt_tokens","completion_tokens"}}`). Style codebase là
  `@JsonProperty` snake_case tường minh (xem [AiSkillInfo.java](../backend/src/main/java/com/mycompany/englishtutor/module/quiz/ai/dto/AiSkillInfo.java)):
  ```java
  public record AiChatResult(
          String reply, List<AiDraftQuestion> questions,
          @JsonProperty("usage") AiUsage usage) {
      public List<AiDraftQuestion> safeQuestions() { return questions == null ? List.of() : questions; }
      public int promptTokens()     { return usage != null ? usage.promptTokens() : 0; }
      public int completionTokens() { return usage != null ? usage.completionTokens() : 0; }
      public AiChatResult(String reply, List<AiDraftQuestion> questions) { this(reply, questions, null); } // caller/test cũ không vỡ
  }
  ```
  + `module/quiz/ai/dto/AiUsage.java` (record mới):
  ```java
  public record AiUsage(
          @JsonProperty("prompt_tokens") int promptTokens,
          @JsonProperty("completion_tokens") int completionTokens) {}
  ```
- `module/quiz/service/AiQuizService.java` (class `@RequiredArgsConstructor`) — thêm 3 field:
  `TutorRepository`, `TutorTierRepository`, `AiUsageLogRepository`. Trong `aiChatQuiz`
  ([AiQuizService.java:55-126](../backend/src/main/java/com/mycompany/englishtutor/module/quiz/service/AiQuizService.java#L55-L126)):
  - **Trước `aiClient.quizChat` (L117)** — gate (dùng `lesson.tutorId()`):
    ```java
    Tutor tutor = tutorRepository.findDetailById(lesson.tutorId())
            .orElseThrow(() -> new AppException(ErrorCode.TUTOR_PROFILE_NOT_FOUND));
    TutorTier tier = tutorTierRepository.findById(tutor.getTierId())
            .orElseThrow(() -> new AppException(ErrorCode.TUTOR_TIER_NOT_FOUND)); // 1605
    boolean expired = Boolean.TRUE.equals(tier.getIsPaid())
            && tutor.getTierExpiresAt() != null
            && !OffsetDateTime.now().isBefore(tutor.getTierExpiresAt());
    TutorTier effective = expired
            ? tutorTierRepository.findByIsDefaultTrue()
                    .orElseThrow(() -> new AppException(ErrorCode.TUTOR_TIER_NOT_FOUND))
            : tier;
    long used = aiUsageLogRepository.sumTokensThisMonth(tutor.getId());
    if (used >= effective.getAiTokens()) {
        throw new AppException(ErrorCode.AI_USAGE_QUOTA_EXCEEDED,
            String.format("Bạn đã dùng %d / %d token trợ lý AI của tháng này (gói %s). Vui lòng liên hệ lễ tân để nâng gói.",
                used, effective.getAiTokens(), effective.getCode()));
    }
    ```
  - **Sau `aiClient.quizChat` OK** — log 1 row (cùng `@Transactional`, rollback-only nếu fail):
    ```java
    aiUsageLogRepository.logCall(tutor.getId(), lessonId, result.promptTokens(), result.completionTokens());
    ```
    (Call 502/timeout → exception đã ném ở L117 → không log, không trừ token.)

  > Ghi chú test: thêm 3 dependency → cập nhật `@Mock` + stub mặc định trong
  > `AiQuizServiceTest` (stub chung 1 chỗ: tutor FREE, `sumTokensThisMonth → 0`).

### 4.5 Widget: extend `GET /me/tier` (1 card, 2 thanh progress)

- `module/tutor/api/response/TutorTierResponse.java` (record, tên mới sau rename) — thêm 3 field:
  ```java
  public record TutorTierResponse(
      String tier, OffsetDateTime tierExpiresAt,
      long quotaBytes, long effectiveQuotaBytes, long usedBytes,
      long monthlyAiTokens,      // pool theo tier gốc (PRO = 500K)
      long effectiveAiTokens,    // pool THỰC TẾ tại NOW (PRO hết hạn → 100K)
      long usedAiTokens) {}      // SUM prompt+completion tháng này (thật)
  ```
- `module/tutor/service/TutorTierService.java` (tên mới) — inject `AiUsageLogRepository`;
  `getMyTier()` trả thêm 3 field (`monthlyAiTokens = tier.getAiTokens()`,
  `effectiveAiTokens = effective.getAiTokens()`, `usedAiTokens = sumTokensThisMonth`).
  Endpoint `GET /me/tier` + `TutorProfileController` chỉ đổi path (đã rename mục 2).

### 4.6 Admin — KHÔNG đổi logic, chỉ đổi field name (đi theo rename)

1 select `tier` + 1 select thời hạn — code V29 (block gán gói trong `AdminTutorService.updateProfile`,
bảng `tutor_subscriptions`, endpoint `GET /{id}/tier-subscriptions`) giữ nguyên logic, chỉ đổi
tên theo mục 2. Đổi gói PRO giờ **tự động cấp cả** storage + token AI (cùng 1 tier). Số token
hiển thị trong UI là copy tĩnh theo mã (FREE/PRO/PREMIUM) — chấp nhận đồ án; số thật nếu cần
thêm 1 endpoint đọc catalog (không làm v1).

### 4.7 Mapping đọc/ghi bảng theo thao tác (bắt buộc)

| # | Thao tác | Đọc | Ghi |
|---|---|-----|-----|
| 1 | Gate token trước LLM | `tutors.tier_id`(+`tier_expires_at`) → `tutor_tiers`(ai_tokens, is_paid, is_default); `SUM(prompt+completion)` `ai_usage_logs` (tháng này) | — (chặn trước khi gọi AI service) |
| 2 | Log sau LLM OK | — | `ai_usage_logs` (1 row: tutor_id, lesson_id, 2 cột token) |
| 3 | `GET /me/tier` (widget, extension) | `users`(current), `tutors.tier_id`+`tier_expires_at` → `tutor_tiers`, SUM `ai_usage_logs` + SUM `lesson_materials.file_size` (storage, V29) | — |
| 4 | Admin đổi gói (`updateProfile`, logic không đổi) | `tutors`, `users`, `tutor_tiers`(tra code, gồm ai_tokens) | `tutors.tier_id`+`tier_expires_at`, `tutor_subscriptions`(INSERT khi isPaid), `audit_logs` |
| 5 | `GET /{tutorId}/tier-subscriptions` (lịch sử, không đổi) | `tutor_subscriptions` JOIN `tutor_tiers` + `tutors`(verify) | — |
| 6 | Report chi phí nội bộ (lát cắt SAU, không làm lần này) | SUM tokens `ai_usage_logs` theo tháng × bảng giá DeepSeek Flash | — |

**Không đụng (V29 giữ nguyên sau rename):** `deleteMaterial`, `MATERIAL_MAX_BYTES` (20MB),
payment module, toàn bộ code admin gán gói (logic).

## 5. Frontend (V30; các file rename FE của mục 2 đã đổi tên hàm/copy xong)

| File | Thay đổi |
|---|---|
| `lib/tutorApi.js` | `apiGetTutorTier` (tên mới sau rename) **giữ nguyên** — response giờ tự kèm 3 field AI (FE chỉ đọc). Không thêm hàm mới (1 card, 1 endpoint). |
| `lib/quizApi.js` | `request` (L48-52) thêm `error.code = data?.code;` để `QuizAiAssistant` nhận diện 1606. |
| `pages/tutor/TutorDashboard.jsx` | Widget "Gói thuê bao" (thay widget "Dung lượng lưu trữ" L214-257): **2 thanh progress** — thanh storage (icon `HardDrive`, blue) + thanh AI (icon `Sparkles`, violet). Giá trị AI `formatTokens(usedAiTokens)/formatTokens(effectiveAiTokens)`, hint `Gói {label} · {monthly} token/tháng · hết hạn dd/MM`. Tone: violet <70%, amber <90%, rose ≥90%. Fetch `apiGetTutorTier` (đã có, giờ trả cả AI). Lỗi → "—", không block. `formatTokens`: 150000 → "150K". |
| `components/tutor/QuizAiAssistant.jsx` | Trong catch (L164-178): `if (err?.code === 1606)` → tin assistant dạng amber (KHÔNG phải red bubble lỗi mạng): "Bạn đã dùng hết token trợ lý AI của tháng này. Vui lòng liên hệ lễ tân để nâng gói." — không nút "Thử lại" (thử vẫn 1606). |
| `pages/admin/TutorManagement.jsx` | Đổi **copy** khối "Gói" → "Gói thuê bao (lưu trữ + trợ lý AI)"; mỗi option select hiện "1GB + 100K token/tháng" · "10GB + 500K" · "50GB + 2M". **Không** thêm select/field (1 gói). Khối "Lịch sử thuê bao" giữ nguyên (1 dòng = 1 lần gán gói, giờ bao gồm cả AI). |

> Số token là **thật** từ backend (mirror widget storage V29). Dashboard widget số thật, không mock.

## 6. Test (V30)

| File | Thay đổi |
|---|---|
| `AiQuizServiceTest.java` | Thêm `@Mock TutorRepository` / `@Mock TutorTierRepository` / `@Mock AiUsageLogRepository` + stub mặc định trong `setUp` (tutor FREE, `sumTokensThisMonth → 0`) — test hiện có chạy không đổi. 4 test mới: (1) `aiChat_exceedsFreePool_throws1606`: SUM=100K → `AI_USAGE_QUOTA_EXCEEDED` + `verify(aiClient, never()).quizChat(...)`. (2) `aiChat_withinPool_logsUsage`: `AiChatResult(usage=8K/4K)` → call OK + `verify(logCall).logCall(TUTOR_ID, LESSON_ID, 8000, 4000)`. (3) `aiChat_paidExpired_fallsBackToFreePool`: PRO hết hạn, SUM=100K → 1606 (chặn theo FREE). (4) `aiChat_paidActive_usesPaidPool`: PRO còn hạn, SUM=100K (<500K) → call OK. |
| `AiPayloadSerializationTest.java` | (1) wire **có** `usage` → deserialize đúng. (2) wire **thiếu** `usage` (Python cũ) → accessors trả 0, không lỗi. (3) 2-arg constructor vẫn hoạt động. |
| `TutorTierServiceTest.java` (tên mới sau rename) | Mock thêm `AiUsageLogRepository`; 3 test hiện có + assert 3 field AI: FREE → `effectiveAiTokens`=100K; PRO hết hạn → hạ FREE (`monthlyAiTokens` vẫn PRO, `effectiveAiTokens`=FREE); PREMIUM còn hạn → giữ 2M. |
| `AdminTutorServiceTest.java` | Không test mới (logic admin không đổi). Chạy lại để chắc (đặc biệt sau rename). |

## 7. Trạng thái biên / rủi ro (ghi trong PR)

- **Rename V29 khi chưa merge dev:** sửa thẳng file migration V29 → DB local đã chạy V29 phải
  xóa flyway history V29 (mục 2) rồi chạy lại; **không** dùng cho DB đã chạy V29 ở đâu khác.
- **Race 2 call AI song song cùng tutor:** gate đọc SUM rồi gọi LLM — 2 call có thể đều pass rồi
  vượt nhẹ pool (giống storage V29). Chấp nhận v1, ghi PR.
- **Provider không trả `usage`** (Ollama / host tự): `usage` = 0 → log 0 token, quota "đếm thiếu".
  Ollama trả `prompt_eval_count`/`eval_count` — cần map (ngoài v1).
- **Gói hết hạn giữa tháng:** pool hiệu lực theo FREE (100K), tháng dương lịch reset; không bù.
- **Tier do admin gán**, tutor không self-upgrade (chưa có billing) — đúng model V29.
- **Gộp 1 gói** = không mua "chỉ AI / chỉ storage". Mở rộng sau = add-on lẻ (ngoài v1).
- **Giá seed (100K/500K/2M) theo DeepSeek Flash off-peak 07/2026**: đổi giá provider → sửa SQL
  seed (dữ liệu DB, không deploy).

## 8. Định giá tham khảo cho lễ tân (đóng gói)

| Gói | Storage (trần) | Token AI/tháng | Vốn AI (Flash off-peak) | Vốn AI (Flash peak ×2) |
|---|---|---|---|---|
| FREE | 1 GB | 100K | ~5.6Kđ | ~11Kđ |
| PRO | 10 GB | 500K | ~28Kđ | ~56Kđ |
| PREMIUM | 50 GB | 2M | ~111Kđ | ~223Kđ |

> Peak = 13:00–17:00 VN (T2–T6). Lễ tân bán PRO ~100Kđ/tháng, PREMIUM ~400Kđ/tháng vẫn dương
> (chốt giá bán khi làm UI).

## 9. Trật tự thực hiện (mỗi bước 1 commit, kiểm tra sau mỗi bước)

**Phần A — trên `feature/tutor-storage-quota` (trước khi merge dev):**

0. `refactor(tutor): đổi tên catalog gói storage_tiers thành tutor_tiers (gói thuê bao chung)`
   — mục 2 (migration V29 + entities + services + endpoints + ErrorCode message + FE + tests).
   `mvn test` + `vite build` xanh → **gộp PR V29 (+rename) vào `dev`**.

**Phần B — trên `feature/ai-usage-quota` (tách từ `dev` sau khi merge A):**

1. `feat(db): V30 thêm ai_tokens vào tutor_tiers + bảng ai_usage_logs` — chỉ migration.
2. `feat(tutor): TutorTier + aiTokens + ErrorCode 1606 (quota AI theo gói)` — entity + error code.
3. `feat(ai): quiz/chat trả usage token + log ai_usage_logs` — Python + `AiChatResult`/`AiUsage`
   + log trong `AiQuizService` (chưa chặn) + test serialization.
4. `feat(quiz): chặn trợ lý AI khi vượt pool token tháng theo gói (V30)` — gate mục 4.4 + 4 test.
5. `feat(tutor): widget /me/tier kèm dung lượng AI (gói thuê bao)` — mục 4.5 + extend test service.
6. `feat(ui): widget 2 thanh (lưu trữ + AI) + CTA AI + copy admin gói thuê bao` — 4 file FE mục 5,
   `vite build` + lint, rà checklist AGENTS.md.
7. Build + test toàn bộ (backend `mvn test`, frontend build), rà checklist, gộp PR vào `dev`.

### Critical files

- `backend/src/main/resources/db/migration/V29__tutor_tier.sql` (đổi tên + sửa nội dung)
- `backend/.../module/tutor/domain/{TutorTier,Tutor,TutorSubscription}.java` (+repos)
- `backend/.../module/tutor/service/{TutorTierService,AdminTutorService}.java`
- `ai/app/schemas.py`, `ai/app/llm.py`, `ai/README.md`
- `backend/.../module/quiz/service/AiQuizService.java`
- `backend/.../module/quiz/ai/dto/AiChatResult.java` (+ `AiUsage.java` mới)
- `backend/.../module/quiz/repository/AiUsageLogRepository.java` (mới)
- `frontend/src/pages/tutor/TutorDashboard.jsx`
- `frontend/src/components/tutor/QuizAiAssistant.jsx`
- `frontend/src/pages/admin/TutorManagement.jsx`
