# EnglishPath

Quy ước dự án (nguồn duy nhất, không nhân bản sang thư mục agent khác):

- Git, nhánh, commit: @GIT_CONVENTION.md
- Quy tắc làm task ClickUp (Lập Plan trước khi code): @docs/my_rules/RULE.md
- Quy chuẩn UI frontend (áp dụng khi sửa `frontend/`): @frontend/AGENTS.md
- Ngôn ngữ UI: tiếng Việt 100%.
- Sửa file: mỗi lần chỉ ghi một lượng thay đổi vừa phải (tách thành nhiều bước nhỏ, kiểm tra sau mỗi bước). Không gộp quá nhiều dòng/thay đổi vào một lần — dễ lỗi không chỉnh được.
- Sau khi hoàn tất toàn bộ plan, phải dừng để người dùng tự kiểm thử và chờ người dùng duyệt. Không tự ý commit trước khi người dùng xác nhận đã duyệt kết quả kiểm thử.