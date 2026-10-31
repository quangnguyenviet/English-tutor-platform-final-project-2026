# AI Service — Python, FastAPI & uv

Dịch vụ AI hỗ trợ gia sư soạn quiz trắc nghiệm. Dịch vụ **không lưu trạng thái** và chỉ được Backend gọi qua mạng nội bộ; frontend không gọi trực tiếp. Kiến trúc chi tiết: [docs/project/ARCHITECTURE.md](../docs/project/ARCHITECTURE.md) (AD-2, AD-4).

## Nhiệm vụ

| Endpoint | Việc | Use case | Trạng thái |
| --- | --- | --- | --- |
| `POST /api/v1/ai/quiz/chat` | Một lượt hội thoại soạn hoặc sửa quiz. Nhận yêu cầu của gia sư, hồ sơ kỹ năng đã ẩn danh (SKP), catalog kỹ năng, bản nháp câu hỏi hiện tại và tin hội thoại gần nhất. Trả về `{ reply, questions[] }` theo `QuizDraftSchema` | UC-T03 | Đã cài đặt |
| `POST /api/v1/ai/quiz/validate` | Kiểm định JSON gia sư dán từ AI ngoài (ChatGPT, Claude, Gemini). Trả lỗi theo từng câu, ví dụ "thiếu đáp án đúng tại câu 2" | UC-T03b | Chưa (lát cắt import, FR-14) |
| `POST /api/v1/ai/moderate` | Kiểm duyệt nội dung đầu vào và đầu ra | AD-2 | Chưa |
| `GET /health` | Kiểm tra sức khỏe | | Đã cài đặt |

## Provider LLM

| `LLM_PROVIDER` | Hành vi |
| --- | --- |
| `openai` (mặc định) | Gọi `LLM_MODEL` (gpt-4o-mini) bằng SDK OpenAI. Bắt buộc `LLM_API_KEY`; gọi thất bại → HTTP 502 |
| `mock` | Không tốn token: chọn 3–5 câu hỏi mẫu từ bộ bank theo kỹ năng có tỷ lệ sai cao nhất + cấp CEFR gợi ý |
| `openai` nhưng `LLM_API_KEY` trống | Tự chạy chế độ `mock` (hỗ trợ demo end-to-end không cần key thật) |

> Giai đoạn này chưa thực hiện cơ chế tính chi phí LLM (budget hằng tháng);
> `LLM_MONTHLY_BUDGET_USD` vẫn giữ trong `.env.example` cho lát cắt sau.

## Schema quiz (`QuizDraftSchema`)

```json
{
  "questions": [
    {
      "content": "She ___ to school every day.",
      "options": { "A": "go", "B": "goes", "C": "going", "D": "gone" },
      "correct": "B",
      "explanation": "Chủ ngữ ngôi thứ ba số ít ở thì hiện tại đơn dùng động từ thêm -s/-es.",
      "cefr": "A2",
      "skill": "present_simple"
    }
  ]
}
```

Quy tắc kiểm định: đủ 4 phương án A/B/C/D, `correct` thuộc A–D, có `explanation`, `cefr` thuộc A1–C2, có `skill`.

## Ràng buộc

- **Không nhận dữ liệu định danh**: chỉ mã ẩn danh học sinh (`HS-<id>`), cấp + mục tiêu, thống kê kỹ năng (SKP), catalog kỹ năng, bản nháp câu hỏi và tin hội thoại gần nhất. Không gửi tên/SĐT (AD-2).
- **Giới hạn thời gian**: Backend đặt timeout 60 giây cho `quiz/chat`; quá hạn thì giao diện hiện "Thử lại".
- **Giới hạn chi phí**: chưa thực hiện ở giai đoạn này (giữ `LLM_MONTHLY_BUDGET_USD` cho lát cắt sau). Chế độ import (FR-14) khi làm sẽ không gọi LLM nên không tốn token.
- Không lưu dữ liệu, không gọi ngược Backend.

## Biến môi trường

| Biến | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `LLM_PROVIDER` | `openai` | Nhà cung cấp LLM: `openai` hoặc `mock` (không tốn token, dùng bộ câu hỏi mẫu) |
| `LLM_MODEL` | `gpt-4o-mini` | Mô hình dùng để sinh quiz |
| `LLM_API_KEY` | (trống) | Khóa API OpenAI. Để trống (hoặc `LLM_PROVIDER=mock`) thì chạy chế độ mock |
| `LLM_MONTHLY_BUDGET_USD` | `10` | Hạn mức chi phí hằng tháng (dùng ở lát cắt sau) |

## Công nghệ sử dụng
- **Python 3.11**
- **uv** (bộ quản lý gói và môi trường ảo)
- **FastAPI**, **Uvicorn**, **Pydantic**, **OpenAI SDK**

## Khởi chạy dịch vụ

### 1. Khởi chạy độc lập (local với `uv`)

Cài đặt `uv` (nếu chưa có):
```bash
# Windows (PowerShell):
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# macOS / Linux:
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Tạo môi trường ảo, cài thư viện và chạy:
```bash
uv venv

# Windows (PowerShell):
.venv\Scripts\activate
# Linux / macOS:
source .venv/bin/activate

uv pip install -r requirements.txt
uv run uvicorn app.main:app --reload --port 8000
```

### 2. Khởi chạy qua Docker
```bash
docker build -t tutor-ai .
docker run -p 8000:8000 tutor-ai
```

Hoặc chạy cùng cả hệ thống bằng `docker compose up --build` ở thư mục gốc.

## Endpoints sẵn có
- `GET /health`: kiểm tra sức khỏe.
- `GET /docs`: OpenAPI (Swagger UI).
- `POST /api/v1/ai/quiz/chat`: 1 lượt hội thoại soạn/sửa quiz (mock hoặc OpenAI).

### Ví dụ gọi (chế độ mock, không cần key)
```bash
curl -X POST http://localhost:8000/api/v1/ai/quiz/chat \
  -H "Content-Type: application/json" \
  -d '{
    "student_code": "HS-20",
    "grade": "Lớp 9",
    "learning_goal": "IELTS",
    "cefr_hint": "B1",
    "skill_profile": [
      {"skill_code": "narrative_tense", "error_rate": 0.7, "last_practiced_at": "2026-09-10T00:00:00Z"}
    ],
    "skill_catalog": [
      {"skill_code": "narrative_tense", "skill_name": "Kể chuyện quá khứ / Narrative Tense"}
    ],
    "message": "Tạo 5 câu tập trung thì quá khứ đơn, độ khó B1"
  }'
```
Trả về `{"reply": "...", "questions": [ ... ] }` (schema `QuizDraftSchema`).
