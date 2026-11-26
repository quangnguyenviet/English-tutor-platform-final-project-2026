# Kế hoạch refactor: tách Nhật ký (teaching_logs) + đổi sessions → Lessons (bài giảng = driver)

> **Nhánh:** `feature/fixed-schedules` (hoặc nhánh mới rẽ từ `dev` theo quy ước Git)
> **Ngày:** 2026
> **Trạng thái:** Chờ duyệt
>
> **Bối cảnh:** Hiện bảng `sessions` vừa giữ "buổi học" (ngày/giờ) vừa giữ nhật ký
> (`log_knowledge`, `log_homework`), vừa chịu cả buổi dạy thử (`is_trial`). Refactor này:
> 1. Tách **nhật ký** thành bảng riêng `teaching_logs` — chỉ gắn `class_id` + ngày/giờ ca,
>    hiển thị **trực tiếp trên lưới lịch dạy** (bấm chip ca → modal log).
> 2. Đổi `sessions` thành **`lessons` (bài giảng)** — "driver" nhúng vào lớp, **chỉ còn
>    quan hệ với `classes`**, không mang ngày/giờ, không lên lịch.
> 3. Đổi tên đồng bộ các bảng con (theo chủ ý: "đổi tên cả bảng con").
> 4. Dạy thử (trial) **không còn ở cấp bài giảng** — trial chỉ là trạng thái lớp
>    (`classes.status = TRIAL`), buổi dạy thử được ghi nhận bằng 1 `lesson_log` thử.
> 5. **Chiến lược dữ liệu: reset/seed** (đề án sinh viên, DB tạo lại từ đầu) — không
>    backfill phức tạp, chỉ 1 câu `INSERT ... SELECT` giữ seed demo của V6.

## 1. Quyết định đã chốt với user

| # | Quyết định |
|---|---|
| D-01 | Log **tách hoàn toàn** khỏi lesson: `teaching_logs` (đặt tên theo nghiệp vụ "nhật ký dạy học", **không** đặt `lesson_logs` để tránh hiểu nhầm gắn với `lessons`) không có cột `lesson_id` |
| D-02 | `lessons` giữ: `class_id`, `title`, `status` (ẩn/hiện), timestamps. **Bỏ** ngày/giờ/`is_trial`/`teaching_mode`/`meeting_url`/`location`/2 cột log |
| D-03 | Đổi tên bảng con: `session_materials` → `lesson_materials`, `quizzes.session_id` → `quizzes.lesson_id`, `session_exceptions` → `schedule_exceptions`; `ai_chat_messages.session_id` → `lesson_id` (Mongo, soft-link) |
| D-04 | Trial **không còn cờ ở bất kỳ đâu**. Buổi thử = đúng 1 ca thuộc `classes` (thêm các cột trial_* lên `classes`, chỉ có khi `status=TRIAL`). Log thử chỉ là 1 dòng `teaching_logs` thường tại ca thử — không có endpoint trial-log riêng, lattice vẽ chip thử từ `classes.trial_*` |
| D-05 | Tạo/sửa bài giảng từ **tab "Bài giảng" riêng**, không còn materialize từ lưới lịch (bỏ luồng R9 "Tạo buổi học") |
| D-06 | Log hiển thị trên lịch: **bấm chip ca → modal có log + form ghi/sửa log** |
| D-07 | Đổi tên bảng vật lý bằng migration mới `V16`, không sửa lại migration cũ (V5/V11/V13 giữ nguyên — Flyway immutable); DB dev reset |

## 2. Schema mới

### 2.1 `lessons` (thay `sessions`)

```
id, class_id (FK classes, CASCADE, NN)
title VARCHAR(200)
status VARCHAR(20) NN DEFAULT 'PUBLISHED'  -- CHECK IN ('PUBLISHED','HIDDEN')
created_at, updated_at
INDEX (class_id, status)
```

- Chỉ còn quan hệ với `classes` (D-02), không ngày/giờ, không cờ.
- Không còn: `session_date`, `start_time`, `end_time`, `is_trial`, `teaching_mode`,
  `meeting_url`, `location`, `log_knowledge`, `log_homework`, unique indexes C-15.
- Không thêm `created_by` (người tạo = `classes.tutor_id`, audit qua `audit_logs`).
- `lessons.id` giữ nguyên id của `sessions` cũ → FK con (`lesson_materials`, `quizzes`)
  vẫn trỏ đúng sau khi rename.
- Một lớp có **nhiều bài giảng** (driver), không ràng buộc thời gian.

### 2.2 `teaching_logs` (bảng mới — nhật ký dạy học)

```
id, class_id (FK classes, CASCADE, NN)
log_date DATE NN
start_time TIME NN, end_time TIME NN        -- khớp ca trên lưới lịch
knowledge TEXT, homework TEXT
created_at, updated_at
CHECK start_time < end_time
UNIQUE (class_id, log_date, start_time)      -- 1 ca = 1 log (idempotent, thay C-15)
INDEX (class_id, log_date)
```

- Log thuần **nội dung**: chỉ ngày + giờ ca + kiến thức/dặn dò. Không ngày-giờ riêng cho
  "buổi", không mode/link/địa chỉ (đặc tả buổi lấy từ `classes` + `schedule_exceptions`).
- Không `created_by`/`updated_by` (người ghi luôn là `classes.tutor_id`; ai ghi được audit
  qua `audit_logs`).
- Không có `lesson_id` (D-01), không có cờ `is_trial` (D-04).
- Log khớp **ô ca** theo `(class_id, log_date, start_time)` — đủ để render vào lưới
  mà không cần JOIN `class_schedules` (ca có thể đã đổi lịch/hết hiệu lực, log vẫn
  đứng đúng ô nó được viết).
- `firstPublish` = cả 2 nội dung NULL trước khi lưu (giữ hành vi notification hiện
  tại: log đầu tiên mới báo học sinh).

### 2.3 `classes` bổ sung các cột ca thử (thay trial-session cũ)

```
trial_date DATE, trial_start_time TIME, trial_end_time TIME
trial_teaching_mode VARCHAR(20), trial_meeting_url VARCHAR(500), trial_location VARCHAR(500)
CHECK (trial_start_time IS NULL OR trial_start_time < trial_end_time)
CHECK (trial_teaching_mode IS NULL OR trial_teaching_mode IN ('ONLINE','AT_HOME'))
CHECK (trial_start_time IS NULL
       OR (trial_date IS NOT NULL AND trial_end_time IS NOT NULL
           AND trial_meeting_url IS NOT NULL))   -- ca thử online phải có link
```

- Chỉ giữ giá trị khi `classes.status = 'TRIAL'` (enforce ở backend khi set/unset).
- 1 lớp TRIAL = đúng 1 ca thử (cùng dòng), nên không cần unique index như C-15 cũ.
- Chip "Buổi dạy thử" trên lattice + trial session trong class detail lấy từ đây.
- Khi lớp chuyển ACTIVE/các cột trial giữ nguyên giá trị đã dạy (lịch sử), hoặc xóa
  (đổi NULL) — quyết định ở bước set status (tham khảo: giữ, hiển thị "đã dạy thử ngày X").

| Cũ | Mới | Ghi chú |
|---|---|---|
| `sessions` | `lessons` | ALTER RENAME + DROP cột (mục 2.1) |
| `session_materials` | `lesson_materials` | FK `session_id` → `lesson_id` (CASCADE) |
| `quizzes.session_id` | `quizzes.lesson_id` | FK → `lessons(id)` CASCADE |
| `session_exceptions` | `schedule_exceptions` | Không đổi cột; thuật ngữ "exception" giờ là overlay của **lịch**, không liên quan session |
| `ai_chat_messages.session_id` (Mongo) | `lesson_id` | Chỉ sửa code/ tài liệu; không có migration (soft-link, DB dev reset) |

### 2.4 Ràng buộc nghiệp vụ mới (thay thế C-15, C-16 trong ERD)

| Mã | Ràng buộc |
|---|---|
| C-15' | UNIQUE `teaching_logs(class_id, log_date, start_time)` — 1 ca diễn ra 1 ngày = tối đa 1 log; ghi đè bằng upsert (idempotent) |
| R-LOG | Không viết/sửa log ở ô đang có exception `CANCELLED` hoặc `RESCHEDULED` (buổi không diễn ra đúng ca đó); `MODIFIED` vẫn được log (buổi vẫn diễn ra) |
| R-TRIAL | 1 lớp có tối đa 1 ca thử, lưu trên chính dòng `classes` (trial_*) — chỉ khi `status='TRIAL'`. Log thử là dòng `teaching_logs` thường tại ca thử, không có cờ/trạng thái riêng (bỏ C-15 trial) |
| R9 (bỏ) | Bỏ luồng "vật chất hóa ô" — không còn create session on-demand từ lưới lịch; tạo bài giảng ở tab riêng |

## 3. Migration V16 (thao tác DDL, 1 migration)

1. `ALTER TABLE sessions RENAME TO lessons`; `ALTER TABLE lessons DROP CONSTRAINT chk_sessions_status` (chuẩn bị đổi CHECK, bước 5).
2. `ALTER TABLE classes ADD COLUMN` 6 cột `trial_*` + CHECK (mục 2.3).
3. Bounce ca thử từ dòng trial cũ (seed V6) lên `classes` — làm trước khi drop `lessons.is_trial` (bước 5):
   `UPDATE classes c SET trial_date = s.session_date, trial_start_time = s.start_time, trial_end_time = s.end_time, trial_teaching_mode = s.teaching_mode, trial_meeting_url = s.meeting_url, trial_location = s.location FROM lessons s WHERE s.class_id = c.id AND s.is_trial = TRUE`
4. Tạo bảng `teaching_logs` + C-15' (mục 2.2/2.4), sau đó copy log cũ (duy nhất thao tác data, giữ seed V6 — bảng `sessions` không có cột `created_by` nên không copy):
   `INSERT INTO teaching_logs(class_id, log_date, start_time, end_time, knowledge, homework, created_at, updated_at) SELECT class_id, session_date, start_time, end_time, log_knowledge, log_homework, created_at, updated_at FROM lessons WHERE log_knowledge IS NOT NULL OR log_homework IS NOT NULL`
5. `DROP COLUMN` các cột bỏ của `lessons` (mục 2.1: `session_date`, `start_time`, `end_time`, `is_trial`, `teaching_mode`, `meeting_url`, `location`, `log_knowledge`, `log_homework`); `UPDATE lessons SET status = 'PUBLISHED'` (seed V6 dùng `COMPLETED`) rồi thêm CHECK mới `status IN ('PUBLISHED','HIDDEN')`.
6. Xóa indexes cũ: `uq_sessions_one_trial_per_class`, `uq_sessions_class_date_start`, `idx_sessions_class_date`, `idx_sessions_status`.
7. Đổi tên bảng con + cột FK: `session_materials` → `lesson_materials` (cột `session_id` → `lesson_id` + index), `quizzes.session_id` → `lesson_id` (index), `session_exceptions` → `schedule_exceptions` (index).
8. **Không** đụng `class_schedules` (logic + data), `payments` (phí vẫn tính theo `classes.sessions_per_week`).

> Thứ tự quan trọng: `trial_*` phải thêm (bước 2) trước khi bounce (bước 3); copy log (bước 4) trước khi drop cột log (bước 5); `teaching_logs` không liên quan đến `lessons` nên không bị ảnh hưởng bởi DROP.

> DB chạy lại: `docker compose` hạ DB + `flyway clean`/xóa volume → apply V1–V16, seed demo vẫn hoạt động.

## 4. Ma trận bảng đọc/ghi theo operation (bắt buộc trước khi code)

### Backend — modul classroom (tab "Lịch dạy" + tab "Bài giảng" mới)

| Operation (endpoint) | Đọc | Ghi |
|---|---|---|
| Lattice tuần `GET /classes/{id}/schedule?weekStart=` (listOccurrences) | `classes` (quyền + ca thử trial_*), `class_schedules`, `schedule_exceptions`, `teaching_logs` (log trong tuần) | – |
| Ghi log `POST/PUT /classes/{id}/logs` (upsert theo `(class_id, log_date, start_time)`; validate R-LOG) | `class_schedules` (ô ca + khoảng hiệu lực), `schedule_exceptions` (R-LOG), `teaching_logs` (FOR UPDATE, firstPublish), `classes` (quyền + tên HS) | `teaching_logs`, `audit_logs`, `notifications` (chỉ khi firstPublish, link_entity_type='CLASS') |
| Xóa log `DELETE /classes/{id}/logs/{logId}` | `teaching_logs` (FOR UPDATE), `classes` | `teaching_logs`, `audit_logs` |
| Ca thử `PUT /classes/{id}/trial` (thay trial-session; set 6 cột trial_* trên `classes`, chỉ khi status=TRIAL) | `classes` (quyền + conflict ca khác lớp: `class_schedules` + `teaching_logs` cùng tutor), `schedule_exceptions` (conflict ca tuần khác lớp) | `classes` (cột trial_*), `audit_logs` |
| Exception `POST/DELETE /classes/{id}/exceptions[...]` (upsert/gỡ) | `class_schedules` (sở hữu + hiệu lực), `schedule_exceptions` (idempotent), `teaching_logs` (R-LOG: chặn CANCELLED/RESCHEDULED khi ô đã có log), conflict check như hiện tại | `schedule_exceptions`, `audit_logs` |
| **Bài giảng** `POST /classes/{id}/lessons` | `classes` (quyền) | `lessons`, `audit_logs` |
| Sửa bài giảng `PUT /lessons/{id}` (title + ẩn/hiện) | `lessons` (FOR UPDATE + quyền qua `classes`) | `lessons`, `audit_logs` |
| Xóa bài giảng `DELETE /lessons/{id}` | `lessons` (quyền) | `lessons` (CASCADE tự xóa `lesson_materials`, `quizzes`), `audit_logs` |
| Tài liệu `POST/DELETE /lessons/{id}/materials[...]`, `GET /materials/{id}/access-url` | `lesson_materials`, `lessons`, `classes` (quyền) | `lesson_materials`, `audit_logs` |
| Quiz theo lesson (modul quiz, đường dẫn mới `/lessons/{id}/quizzes`) | `quizzes` (FK `lesson_id`), `lessons → classes` (chuỗi quyền), `skills` (AI sinh câu) | `quizzes`, `quiz_questions`, `notifications` (giao quiz, link 'CLASS') |

### Backend — modul student portal

| Operation | Đọc (cũ → mới) | Ghi |
|---|---|---|
| `GET /students/me/schedule` (tuần) | sessions→ **`teaching_logs`** (log + ca thử từ `classes.trial_*`), class_schedules (ô ảo, giữ như cũ), session_exceptions→`schedule_exceptions` (kèm reschedule đến) | – |
| `GET /students/me/sessions` (lịch sử buổi) | sessions→ **`teaching_logs`** (ROW_NUMBER seq, has_log = knowledge/homework), lesson_materials (material_count) | – |
| "Buổi sắp tới" (dashboard) | sessions (SCHEDULED) → **ô ca `class_schedules` trong hiệu lực gần nhất** (buổi thật giờ là log, không còn dòng scheduled) | – |
| `GET /students/me/tutors` (đánh giá "done") | COUNT sessions COMPLETED → **COUNT `lessons` PUBLISHED của lớp** | – |
| Quiz (lọc theo buổi) | quizzes JOIN sessions → **quizzes JOIN `lessons`** (quyền qua `lessons → classes`) | – |

### Backend — matching (bỏ cleanup sessions)

| Operation | Đọc | Ghi |
|---|---|---|
| `closeOpenClasses` (hủy/rematch) — thay `UPDATE sessions SET status='CANCELLED'` | `class_requests`, `classes` (TRIAL/ACTIVE) | `lessons` (SET status='HIDDEN' ở các lớp TRIAL của đơn — bài giảng driver không còn "trạng thái dạy", ẩn đi để không treo trên lớp chết; lớp ACTIVE giữ nguyên), `payments` (CANCELLED, như cũ), `classes` (CANCELLED) |

> `payments` KHÔNG đổi (phí tính theo `classes.sessions_per_week`, không đọc bảng sessions — đã xác minh qua scan code).

### Frontend — tutor

| File | Thay đổi |
|---|---|
| `lib/classroomApi.js` | Đổi API: endpoints lesson/log/exception/material/quiz theo mục 4; bỏ `apiCreateSession` (materialize); `mapSession*` → `mapLesson*` + `mapLessonLog*`; `hasLog` lấy từ log |
| `components/tutor/ClassScheduleLattice.jsx` | Chip ca: chấm "đã có log" khi `teaching_logs` khớp ô; **bỏ nút "Tạo bài giảng"**; modal cell: hiển thị log (nếu có) + form ghi/sửa log (knowledge, homework) + giữ thao tác exception (dời/hủy/sửa ca). Chip "Buổi dạy thử" giờ vẽ từ `classes.trial_*` |
| `components/tutor/TrialSessionForm.jsx` (giữ tên, sửa payload) | Form ca thử: set 6 cột `trial_*` trên `classes` (ngày + giờ + mode/link/địa chỉ) → `PUT /classes/{id}/trial` (thay `POST .../trial-session`) |
| Tab "Bài giảng" (thay "Buổi học" — `ManageSessions.jsx` → `LessonList.jsx` + `LessonDetail.jsx` trong workspace) | CRUD bài giảng (title, ẩn/hiện, xóa), tài liệu + quiz gắn lesson; **không còn** ngày/giờ/form log (log đã chuyển sang lịch dạy) |
| `QuizAuthoring.jsx` + route | Quiz scope: `?sessionId=` → `?lessonId=`; API theo lesson |
| `pages/tutor/TutorClassWorkspace.jsx` | Tab mới "Bài giảng" thay tab "Buổi học"; wiring ca thử (`PUT /classes/{id}/trial`) thay trial-session |
| Class overview / sidebar | `sessionDates` (danh sách ngày có buổi ngoài ca) — bỏ; thay bằng cờ "có log ngoài ca" từ `teaching_logs` (log nào không khớp ca cố định hiện ở dạng note) |

### Frontend — student

| File | Thay đổi |
|---|---|
| `lib/studentApi.js`, `lib/studentModel.js` | Item lịch/buổi đọc từ response mới (log thay session); `sessionLogState` đọc từ log |
| `pages/student/StudentSchedule.jsx`, `StudentSessionDetail.jsx`, `SessionDetailModal.jsx`, `LessonSessionDetail.jsx` | Hiển thị log + tài liệu + quiz theo lesson/log (API đổi, UI giữ layout) |
| `pages/student/StudentExercises.jsx`, `StudentMaterials.jsx` | Quiz theo lesson, tài liệu theo lesson |

### AI service

- `ai/app/main.py` (stub FastAPI) và source hiện tại **không** tham chiếu `session_id` — chỉ sửa tài liệu.
- `ai_chat_messages` (Mongo): đổi trường `session_id` → `lesson_id` (code backend tạo/lấy + docs); DB dev reset nên không migrate data.

## 5. Tests cần cập nhật

- `ClassOccurrenceServiceTest` — row log thay session row; conflict log thử; R-LOG chặn; materialize test **xóa**
- `TutorClassServiceTest` — trial-session → ca thử `classes.trial_*` (conflict, missing URL); log test tách riêng
- `ClassOccurrenceControllerTest`, `TutorClassControllerTest` — route lesson/log/quiz
- `QuizServiceTest` — quyền qua `lessons → classes`
- Smoke: docker compose up, flyway apply tới V16, chạy seed demo → kiểm tra: (1) lattice hiện log chấm + modal ghi log, (2) trial log chip, (3) tab Bài giảng CRUD + upload tài liệu, (4) quiz theo lesson, (5) student schedule/history, (6) hủy lớp TRIAL → lesson HIDDEN.

## 6. Tài liệu

- `docs/project/ERD.md` → v2.7: thay nhóm 4 bằng `lessons`, `teaching_logs`, `schedule_exceptions`, `lesson_materials` + các cột `trial_*` trên `classes`; sửa mermaid, mục quan hệ (R-23/R-24/R-26/R-44–46), ràng buộc C-15' (thành C-15' của `teaching_logs`), C-16 (thành của `schedule_exceptions`), R-TRIAL; Mongo `ai_chat_messages.lesson_id`; changelog v2.7.
- `docs/project/ARCHITECTURE.md`, `class_diagram.md`: cập nhật tên bảng/endpoint (kèm bước nhỏ).

## 7. Trật tự thực thi

1. **V16** (mục 3) + chạy lại DB dev, kiểm tra seed demo.
2. Backend: `ClassroomQueryRepository` (SQL mới) → service classroom (log, trial log, exception R-LOG, bỏ materialize) → service bài giảng (CRUD lesson + materials) → modul quiz (lesson_id) → student portal → matching (`closeOpenClasses`). DTO/controller/endpoint theo mục 4.
3. Frontend tutor (lattice + tab Bài giảng + trial form + quiz) → frontend student.
4. Chỉnh tests (mục 5), chạy full test suite + smoke docker.
5. Cập nhật ERD v2.7 + docs (mục 6).

## 8. Rủi ro / điểm cần chú ý

- **Quiz gắn lesson (không gắn buổi)**: quiz "giao sau buổi học" hiện scope theo session; scope mới theo lesson nên quiz sẽ không "thuộc buổi" nữa — học sinh xem quiz theo lớp/lesson (đã chốt D-03).
- `sessions.status` từng dùng cho "buổi sắp tới" của student → thay bằng ca `class_schedules` (ô virtual đã có sẵn ở portal, giữ logic).
- `countDuplicateSlotInClass` + unique index V11 (idempotent on-demand) **biến mất** — không cần thay thế (lesson không có ngày/giờ; log có unique C-15').
- `sessionDates` trong class detail dùng cho "Có buổi học ngoài ca cố định" → thay bằng log không khớp ca (note dạng, không có nút tạo).
- Notification vẫn link `CLASS` (không phải SESSION/LESSON) — giữ nguyên, không phải sửa.
- `feature/sessions-and-logs` (branch cũ, đã merge về dev trước đây) chỉ là tiền đề tab Buổi học — không ảnh hưởng kế hoạch này.
