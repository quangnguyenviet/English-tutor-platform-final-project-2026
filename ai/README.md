# AI Service — Python, FastAPI & uv

Dịch vụ AI hỗ trợ gia sư soạn quiz trắc nghiệm. Dịch vụ **không lưu trạng thái** và chỉ được Backend gọi qua mạng nội bộ; frontend không gọi trực tiếp. Kiến trúc chi tiết: [docs/project/ARCHITECTURE.md](../docs/project/ARCHITECTURE.md) (AD-2, AD-4).

## Nhiệm vụ

| Endpoint | Việc | Use case |
| --- | --- | --- |
| `POST /api/v1/ai/quiz/chat` | Một lượt hội thoại soạn hoặc sửa quiz. Nhận yêu cầu của gia sư, tài liệu đã trích, hồ sơ kỹ năng đã ẩn danh. Trả về bộ câu hỏi theo `QuizDraftSchema` | UC-T03 |
| `POST /api/v1/ai/quiz/validate` | Kiểm định JSON gia sư dán từ AI ngoài (ChatGPT, Claude, Gemini). Trả lỗi theo từng câu, ví dụ "thiếu đáp án đúng tại câu 2" | UC-T03b |
| `POST /api/v1/ai/moderate` | Kiểm duyệt nội dung đầu vào và đầu ra | AD-2 |
| `GET /health` | Kiểm tra sức khỏe | |

Trạng thái hiện tại: mới có `GET /` và `GET /health`. Ba endpoint trên chưa được cài đặt.

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

- **Không nhận dữ liệu định danh**: chỉ mã ẩn danh, mô tả bài học, thống kê kỹ năng.
- **Giới hạn thời gian**: Backend đặt timeout 60 giây cho `quiz/chat`; quá hạn thì giao diện hiện "Thử lại".
- **Giới hạn chi phí**: hạn mức hằng tháng theo `LLM_MONTHLY_BUDGET_USD`. Chế độ import không gọi LLM nên không tốn token.
- Không lưu dữ liệu, không gọi ngược Backend.

## Biến môi trường

| Biến | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `LLM_PROVIDER` | `openai` | Nhà cung cấp LLM |
| `LLM_MODEL` | `gpt-4o-mini` | Mô hình dùng để sinh quiz |
| `LLM_API_KEY` | (trống) | Khóa API. Để trống thì chỉ dùng được `quiz/validate` |
| `LLM_MONTHLY_BUDGET_USD` | `10` | Hạn mức chi phí hằng tháng |

## Công nghệ sử dụng
- **Python 3.11**
- **uv** (bộ quản lý gói và môi trường ảo)
- **FastAPI**, **Uvicorn**, **Pydantic**
- **LangGraph** (luồng nhận yêu cầu, ghép ngữ cảnh, sinh câu hỏi, kiểm định đầu ra; sẽ thêm vào `requirements.txt` khi cài đặt)

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
