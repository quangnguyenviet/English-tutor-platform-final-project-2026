-- -----------------------------------------------------------------------------
-- T7-C1 / T8-B2: bổ sung catalog kỹ năng chung toàn hệ thống (>= 20 kỹ năng
-- phủ đủ 7 nhóm) để việc tag kỹ năng trên câu hỏi quiz và thống kê hồ sơ
-- kỹ năng (SKP) có đủ lựa chọn. V6 mới seed 2 kỹ năng.
-- Chỉ dữ liệu, không thay đổi schema. Idempotent: kỹ năng trùng skill_code
-- (2 dòng seed của V6) được bỏ qua.
-- -----------------------------------------------------------------------------
INSERT INTO skills (skill_code, skill_name, category, description) VALUES
    ('present_simple',      'Thì hiện tại đơn / Present Simple',    'GRAMMAR',         'Diễn tả thói quen, sự thật, lịch trình cố định.'),
    ('present_continuous',  'Thì hiện tại tiếp diễn / Present Continuous', 'GRAMMAR',  'Diễn tả hành động đang xảy ra; phân biệt với Present Simple.'),
    ('future_tense',        'Thì tương lai đơn / Future Tense',     'GRAMMAR',         'Dùng will / be going to cho sự việc trong tương lai.'),
    ('present_perfect',     'Thì hoàn thành / Present Perfect',     'GRAMMAR',         'Kết nối quá khứ và hiện tại; has/have + V3.'),
    ('passive_voice',       'Thụ động / Passive Voice',             'GRAMMAR',         'Cấu trúc bị động: am/is/are + V3.'),
    ('relative_clauses',    'Câu định ngữ / Relative Clauses',      'GRAMMAR',         'Gom câu bằng who, which, that, where.'),
    ('modal_verbs',         'Động từ khuyết thiếu / Modal Verbs',   'GRAMMAR',         'can, could, may, might, must, should.'),
    ('common_phrases',      'Cụm từ thông dụng / Common Phrases',   'VOCABULARY',      'Thành ngữ và cụm từ cố định hay gặp.'),
    ('phrasal_verbs',       'Động từ ghép / Phrasal Verbs',         'VOCABULARY',      'look up, give up, run into...'),
    ('word_collocations',   'Cụm kết hợp / Word Collocations',      'VOCABULARY',      'make a decision, do an exercise...'),
    ('linking_words',       'Từ nối / Linking Words',               'VOCABULARY',      'however, therefore, although, moreover...'),
    ('link_throat_sounds',  'Âm /l/ và /th/',                        'PRONUNCIATION',  'Phát âm /l/, /th/ (thanh, xát) chuẩn IPA.'),
    ('sentence_stress',     'Nhấn mạnh từ / Sentence Stress',       'PRONUNCIATION',   'Nhạc điệu câu, nhấn từ quan trọng.'),
    ('listening_main_idea', 'Nghe ý chính / Listening Main Idea',   'LISTENING',       'Lấy thông tin chính từ bài nghe.'),
    ('listening_detail',    'Nghe chi tiết / Listening Detail',     'LISTENING',       'Nghe thông tin cụ thể: con số, tên, thời gian.'),
    ('long_reading',        'Đọc đoạn văn / Long Reading',          'READING',         'Đọc hiểu văn bản dài; tìm từ khóa.'),
    ('vocabulary_in_context','Từ vựng theo ngữ cảnh / Vocabulary in Context', 'READING', 'Deduce meaning from context.'),
    ('paraphrasing',         'Paraphrase',                           'READING',         'Diễn đạt lại câu/đoạn bằng từ khác cùng nghĩa.'),
    ('short_paragraph',     'Đoạn văn ngắn / Short Paragraph',      'WRITING',         'Viết đoạn 5-6 câu, ý mạch lạc, có từ nối.'),
    ('email_writing',        'Viết email / Email Writing',           'WRITING',         'Email thông dụng: mẫu mở, kết, giọng văn phù hợp.'),
    ('describing_routine',  'Mô tả hoạt động thường ngày / Describing Routine', 'SPEAKING', 'Kể hoạt động một ngày bằng thì hiện tại đơn.'),
    ('expressing_opinion',  'Thể hiện quan điểm / Expressing Opinion', 'SPEAKING',     'I think, In my opinion...; lý lẽ ngắn.'),
    ('daily_conversation',  'Thảo luận thường ngày / Daily Conversation', 'SPEAKING',  'Small talk: thời tiết, sở thích, kế hoạch.'),
    ('narrative_tense',     'Kể chuyện quá khứ / Narrative Tense',  'SPEAKING',        'Kể lại sự việc bằng thì quá khứ, từ nối thời gian.'),
    ('question_tag',        'Câu hỏi đuôi / Question Tags',         'GRAMMAR',         'Đuôi hỏi: he can, can''t he? ...')
ON CONFLICT (skill_code) DO NOTHING;
