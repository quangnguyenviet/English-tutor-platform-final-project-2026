export const students = [
  {
    id: "s1",
    name: "Nguyễn Minh Khôi",
    initials: "MK",
    level: "B1",
    grade: "Lớp 8",
    goal: "Thi chứng chỉ IELTS 6.0",
    note: "Bé mất gốc phát âm, cần gia sư kiên nhẫn, luyện thi IELTS 6.0.",
    schedule: "Thứ 3 - 5 - 7, 19:00-20:30",
    parentName: "Chị Nguyễn Hải Yến",
    parentPhone: "0966 223 344",
    parentTelegram: "@haiyen_hanoi",
    province: "Hà Nội",
    district: "Cầu Giấy",
    joinedDate: "2026-02-10",
    assignedTutorId: "t1",
    overallProgress: 68,
    approvalStatus: "account_created",
    weakSkill: "Viết",
    classStatus: "official",
    statusLabel: "✅ Học sinh chính thức",
    statusTone: "emerald",
    templateSource: "tpl1",
    dailySessions: [
      {
        id: "ds1",
        sessionNumber: 1,
        title: "Buổi 1: Thì hiện tại & Quá khứ, từ vựng chủ đề Gia đình",
        date: "2026-02-11",
        duration: "90 phút",
        status: "published",
        skills: ["Ngữ pháp", "Từ vựng"],
        publicLogWork: {
          knowledgeTaught: "1. Ôn tập & phân biệt cấu trúc Thì Quá khứ đơn (Past Simple) & Quá khứ tiếp diễn (Past Continuous).\n2. Cung cấp 20 từ vựng chủ đề Family Relationships & Extended Family.\n3. Quy tắc phát âm đuôi -ed (3 trường hợp /t/, /d/, /id/).",
          homeworkAssigned: "1. Hoàn thành Bài tập 01 trên hệ thống (Trắc nghiệm Mệnh đề quan hệ & Collocations).\n2. Học thuộc 20 từ vựng mới & thu âm 1 đoạn nói 1 phút về gia đình gửi Zalo/Telegram gia sư.",
          parentNote: "Học sinh tiếp thu kiến thức ngữ pháp rất nhanh. Cần chú ý nhắc bé làm bài tập về nhà đúng hạn 10/03.",
          publishedAt: "2026-02-11 20:45",
        },
        attachments: [
          { id: "att-101", name: "BaiGiang_Buoi1_PastTenses.pdf", size: "2.4 MB", type: "pdf", uploadedAt: "2026-02-11" },
          { id: "att-102", name: "Vocab_Family_Flashcards.docx", size: "1.2 MB", type: "docx", uploadedAt: "2026-02-11" }
        ],
        quizzes: [
          { id: "e1", title: "Bài tập Luyện tập: Mệnh đề quan hệ & Collocations", type: "MCQ Practice", questionsCount: 4, status: "assigned" }
        ]
      },
      {
        id: "ds2",
        sessionNumber: 2,
        title: "Buổi 2: Luyện nghe hội thoại đời sống & Phát âm trọng âm",
        date: "2026-02-13",
        duration: "90 phút",
        status: "published",
        skills: ["Nghe", "Nói"],
        publicLogWork: {
          knowledgeTaught: "1. Kỹ năng nghe bắt từ khóa (Keywords Listening) trong hội thoại ngắn IELTS Section 1.\n2. Quy tắc đánh trọng âm từ có 2 và 3 âm tiết (Word Stress).\n3. Thực hành hội thoại hỏi đường & mua sắm hàng ngày.",
          homeworkAssigned: "1. Nghe lại file Audio Buổi 2 và chép chính tả 5 đoạn hội thoại ngắn.\n2. Luyện tập trọng âm 30 từ trong tài liệu đính kèm.",
          parentNote: "Khôi đã tự tin phản xạ nói hơn, âm điệu tự nhiên hơn so với buổi đầu.",
          publishedAt: "2026-02-13 21:00",
        },
        attachments: [
          { id: "att-103", name: "Listening_Section1_Practice.pdf", size: "1.8 MB", type: "pdf", uploadedAt: "2026-02-13" },
          { id: "att-104", name: "Audio_Track_DailyConversation.mp3", size: "4.5 MB", type: "audio", uploadedAt: "2026-02-13" }
        ],
        quizzes: []
      },
      {
        id: "ds3",
        sessionNumber: 3,
        title: "Buổi 3: Kỹ thuật Skimming/Scanning với bài đọc IELTS",
        date: "2026-02-18",
        duration: "90 phút",
        status: "published",
        skills: ["Đọc"],
        publicLogWork: {
          knowledgeTaught: "1. Phân biệt chiến thuật Skimming (đọc lướt ý chính) và Scanning (tìm thông tin chi tiết).\n2. Giải 2 bài đọc IELTS Passage 1 chủ đề Công nghệ & Giáo dục.\n3. Phương pháp định vị từ đồng nghĩa (Paraphrasing) trong câu hỏi.",
          homeworkAssigned: "1. Làm bài đọc Passage 2 trang 45 trong giáo trình đính kèm.\n2. Note 15 từ mới tìm được từ bài đọc.",
          parentNote: "Bé Khôi làm bài đọc đạt 7/10 câu đúng, tiến bộ rõ rệt ở dạng Matching Headings.",
          publishedAt: "2026-02-18 20:30",
        },
        attachments: [
          { id: "att-105", name: "IELTS_Reading_Passage1_Tech.pdf", size: "3.1 MB", type: "pdf", uploadedAt: "2026-02-18" }
        ],
        quizzes: []
      },
      {
        id: "ds4",
        sessionNumber: 4,
        title: "Buổi 4: Task 1: Mô tả biểu đồ (Line Graph & Bar Chart)",
        date: "2026-02-25",
        duration: "90 phút",
        status: "published",
        skills: ["Viết"],
        publicLogWork: {
          knowledgeTaught: "1. Cấu trúc bài viết IELTS Writing Task 1 (Overview, Body 1, Body 2).\n2. Từ vựng mô tả xu hướng (increase, dramatic rise, fluctuate, remain steady).\n3. Viết mở bài & Overview cho 2 dạng biểu đồ đường và biểu đồ cột.",
          homeworkAssigned: "1. Hoàn thành bài viết Task 1 cho đề Bar Chart về lượng tiêu thụ năng lượng.\n2. Nộp bài trước ngày 02/03.",
          parentNote: "Đã hướng dẫn chi tiết dàn ý. Phụ huynh nhắc bé dành 30 phút hoàn thiện bài viết.",
          publishedAt: "2026-02-25 21:15",
        },
        attachments: [
          { id: "att-106", name: "Writing_Task1_Vocabulary_Guide.pdf", size: "2.0 MB", type: "pdf", uploadedAt: "2026-02-25" }
        ],
        quizzes: []
      },
      {
        id: "ds5",
        sessionNumber: 5,
        title: "Buổi 5: Task 2: Bài luận quan điểm & Câu phức",
        date: "2026-03-04",
        duration: "90 phút",
        status: "draft",
        skills: ["Viết", "Ngữ pháp"],
        publicLogWork: {
          knowledgeTaught: "1. Cách lập dàn ý bài luận Task 2 (Opinion Essay - Agree or Disagree).\n2. Cấu trúc câu phức (Complex sentences) với Mệnh đề nhượng bộ (Although/Even though) và Mệnh đề nguyên nhân (Since/As).\n3. Viết thử 2 đoạn thân bài.",
          homeworkAssigned: "1. Viết hoàn chỉnh bài luận Task 2 (250 từ) chủ đề Online Education vs Traditional Classroom.\n2. Chuẩn bị ý tưởng cho bài nói Speaking Part 2 buổi sau.",
          parentNote: "Bản nháp nhật ký bài học - Đang cập nhật thêm bài tập dặn dò.",
          publishedAt: null,
        },
        attachments: [
          { id: "att-107", name: "Task2_Opinion_Essay_Sample.pdf", size: "1.5 MB", type: "pdf", uploadedAt: "2026-03-04" }
        ],
        quizzes: []
      },
      {
        id: "ds6",
        sessionNumber: 6,
        title: "Buổi 6: IELTS Speaking Part 2 - Cue card & Phản xạ",
        date: "2026-03-06",
        duration: "90 phút",
        status: "upcoming",
        skills: ["Nói"],
        publicLogWork: {
          knowledgeTaught: "",
          homeworkAssigned: "",
          parentNote: "",
          publishedAt: null,
        },
        attachments: [],
        quizzes: []
      }
    ],
    learningPath: [
      { id: "lp1", phase: "Giai đoạn 1: Củng cố nền tảng", week: 1, session: 1, date: "2026-02-11", skills: ["Ngữ pháp", "Từ vựng"], topic: "Thì hiện tại & quá khứ, từ vựng chủ đề gia đình", status: "done" },
      { id: "lp2", phase: "Giai đoạn 1: Củng cố nền tảng", week: 1, session: 2, date: "2026-02-13", skills: ["Nghe", "Nói"], topic: "Luyện nghe hội thoại đời sống, phát âm trọng âm", status: "done" },
      { id: "lp3", phase: "Giai đoạn 1: Củng cố nền tảng", week: 2, session: 3, date: "2026-02-18", skills: ["Đọc"], topic: "Kỹ thuật Skimming/Scanning với bài đọc IELTS", status: "done" },
      { id: "lp4", phase: "Giai đoạn 2: Luyện kỹ năng thi", week: 3, session: 4, date: "2026-02-25", skills: ["Viết"], topic: "Task 1: Mô tả biểu đồ", status: "done" },
      { id: "lp5", phase: "Giai đoạn 2: Luyện kỹ năng thi", week: 4, session: 5, date: "2026-03-04", skills: ["Viết", "Ngữ pháp"], topic: "Task 2: Bài luận quan điểm, câu phức", status: "in_progress" },
      { id: "lp6", phase: "Giai đoạn 2: Luyện kỹ năng thi", week: 4, session: 6, date: "2026-03-06", skills: ["Nói"], topic: "IELTS Speaking Part 2 - Cue card", status: "upcoming" },
      { id: "lp7", phase: "Giai đoạn 3: Luyện đề tổng hợp", week: 5, session: 7, date: "2026-03-11", skills: ["Nghe", "Đọc"], topic: "Full mock test Listening + Reading", status: "upcoming" },
    ],
    exercises: [
      {
        id: "e1",
        title: "Bài tập Luyện tập: Mệnh đề quan hệ & Collocations",
        skill: "Ngữ pháp & Từ vựng",
        difficulty: "Trung bình",
        mode: "practice",
        type: "Trắc nghiệm & Sửa lỗi",
        status: "assigned",
        assignedDate: "2026-03-08",
        dueDate: "2026-03-10",
        sessionId: "lp1",
        tutorId: "t1",
        tutorName: "Cô Lan Anh",
        tutorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80",
        colorTheme: "indigo",
        subject: "Luyện thi IELTS 6.5+",
        questions: [
          {
            id: "q1",
            kind: "mcq",
            prompt: "The scientist ______ invented the new clean energy technology was awarded the Nobel Prize.",
            options: ["A. who", "B. which", "C. whose", "D. whom"],
            correct: "A. who",
            aiExplanation: {
              rule: "Đại từ quan hệ 'who' thay thế cho danh từ chỉ người đóng vai trò chủ ngữ.",
              whyCorrect: "'The scientist' là người, phía sau là động từ 'invented' cần chủ ngữ ➔ Dùng 'who'.",
              distractors: "'Which' chỉ vật; 'Whose' chỉ sở hữu; 'Whom' chỉ làm tân ngữ."
            }
          },
          {
            id: "q2",
            kind: "fill",
            prompt: "Điền từ thích hợp vào chỗ trống để tạo collocation chính xác:",
            sentence: "We need to ______ measures to reduce plastic waste in our oceans.",
            correct: "take",
            aiExplanation: {
              rule: "Collocation cố định: 'take measures' = thực hiện các biện pháp.",
              whyCorrect: "Trong văn cảnh giải quyết vấn đề, động từ đi với 'measures' bắt buộc là 'take'.",
              distractors: "Không dùng 'make' hay 'do' vì không tự nhiên trong văn phong Anh ngữ."
            }
          },
          {
            id: "q3",
            kind: "error_correction",
            prompt: "Tìm và sửa lỗi sai trong câu sau (chỉ 1 từ):",
            sentence: "She was interested on learning more about Vietnamese cultural heritage.",
            wrongPart: "on",
            correct: "in",
            aiExplanation: {
              rule: "Cụm tính từ đi với giới từ cố định: 'interested IN something'.",
              whyCorrect: "'interested on' là lỗi sai giới từ phổ biến. Cần sửa thành 'interested in'.",
              distractors: "Không kết hợp với 'on', 'at' hay 'for'."
            }
          },
          {
            id: "q4",
            kind: "sentence_transformation",
            prompt: "Viết lại câu sau với từ gợi ý 'Although':",
            originalSentence: "Despite the heavy rain, the football match continued.",
            givenStart: "Although",
            correct: "Although it rained heavily, the football match continued.",
            aiExplanation: {
              rule: "'Despite + Noun phrase' tương đương với 'Although + S + V'.",
              whyCorrect: "'heavy rain' chuyển thành mệnh đề 'it rained heavily' hoặc 'it was raining heavily'.",
              distractors: "Không dùng 'Although the heavy rain' vì Although phải đi cùng mệnh đề có động từ vị ngữ."
            }
          }
        ]
      },
      {
        id: "e3",
        title: "Bài Kiểm tra Năng lực Định kỳ (Assessment Mini-Test)",
        skill: "Tổng hợp",
        difficulty: "Chuẩn IELTS 6.0",
        mode: "assessment",
        type: "4 Dạng Chuẩn PRD",
        status: "assigned",
        score: null,
        maxScore: 10,
        assignedDate: "2026-03-09",
        dueDate: "2026-03-11",
        sessionId: "lp3",
        tutorId: "t1",
        tutorName: "Cô Lan Anh",
        tutorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80",
        colorTheme: "indigo",
        subject: "Luyện thi IELTS 6.5+",
        questions: [
          {
            id: "aq1",
            kind: "mcq",
            prompt: "If we ______ earlier, we wouldn't have missed the opening speech.",
            options: ["A. had arrived", "B. arrived", "C. would arrive", "D. have arrived"],
            correct: "A. had arrived",
            aiExplanation: {
              rule: "Câu điều kiện loại 3: If + S + had V3/ed, S + would have V3/ed.",
              whyCorrect: "Mệnh đề chính 'wouldn't have missed' chỉ sự việc không xảy ra trong quá khứ.",
              distractors: "Arrived (loại 2), have arrived (loại 1) đều không phù hợp ngữ cảnh quá khứ."
            }
          },
          {
            id: "aq2",
            kind: "fill",
            prompt: "Điền giới từ thích hợp vào chỗ trống:",
            sentence: "She apologized ______ her teacher for being late to class.",
            correct: "to",
            aiExplanation: {
              rule: "Cấu trúc: 'apologize TO someone FOR something' (xin lỗi ai về việc gì).",
              whyCorrect: "Phía sau là đối tượng tiếp nhận lời xin lỗi 'her teacher', dùng giới từ 'to'.",
              distractors: "Nhiều học sinh hay nhầm dùng 'apologize with', đây là lỗi dịch thô."
            }
          },
          {
            id: "aq3",
            kind: "error_correction",
            prompt: "Tìm và sửa lỗi sai trong câu:",
            sentence: "The number of students who applies for this scholarship has increased.",
            wrongPart: "applies",
            correct: "apply",
            aiExplanation: {
              rule: "Hòa hợp đại từ quan hệ: 'who' thay cho 'students' (danh từ số nhiều) nên động từ theo sau là số nhiều.",
              whyCorrect: "'students' là số nhiều -> động từ phải là 'apply' nguyên thể, không chia 'applies'.",
              distractors: "Lưu ý 'The number of' đi với động từ chính 'has increased' là đúng, chỉ sai ở mệnh đề quan hệ."
            }
          },
          {
            id: "aq4",
            kind: "sentence_transformation",
            prompt: "Viết lại câu sang thể bị động:",
            originalSentence: "They will announce the exam results tomorrow morning.",
            givenStart: "The exam results",
            correct: "The exam results will be announced tomorrow morning.",
            aiExplanation: {
              rule: "Bị động thì tương lai đơn: S + will be + V3/ed.",
              whyCorrect: "'will announce' chuyển thành 'will be announced'.",
              distractors: "Không được thiếu 'be' (lỗi phổ biến: will announced)."
            }
          }
        ]
      },
      {
        id: "e2",
        title: "Luyện nghe hội thoại đời sống & Ngữ điệu IPA",
        skill: "Nghe",
        difficulty: "Trung bình",
        mode: "practice",
        type: "Trắc nghiệm",
        status: "graded",
        score: 7,
        maxScore: 10,
        assignedDate: "2026-02-13",
        submittedAt: "2026-02-14",
        sessionId: "lp2",
        tutorId: "t3",
        tutorName: "Cô Thu Hà",
        tutorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80",
        colorTheme: "emerald",
        subject: "Giao tiếp & Phát âm IPA",
        feedback: "Phần nhận diện nối âm đuôi /s/ và /z/ còn hơi nhầm lẫn một chút, xem lại file ghi âm cô gửi nhé."
      },
      {
        id: "e4",
        title: "Writing Task 1: Mô tả biểu đồ dân số & Xu hướng",
        skill: "Viết",
        difficulty: "Trung bình",
        mode: "assessment",
        type: "Tự luận",
        status: "graded",
        score: 6,
        maxScore: 9,
        assignedDate: "2026-02-25",
        submittedAt: "2026-02-26",
        feedback: "Bố cục Overview ổn nhưng còn thiếu từ nối Cohesion, cần đa dạng cấu trúc câu phức hơn.",
        sessionId: "lp4",
        tutorId: "t2",
        tutorName: "Thầy Minh Quân",
        tutorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
        colorTheme: "blue",
        subject: "IELTS Writing Task 2"
      },
      {
        id: "e5",
        title: "Luyện Viết Câu Phức & Paraphrase Đề Thi Writing",
        skill: "Viết",
        difficulty: "Khá",
        mode: "practice",
        type: "4 Dạng Chuẩn PRD",
        status: "assigned",
        assignedDate: "2026-03-09",
        dueDate: "2026-03-12",
        sessionId: "lp5",
        tutorId: "t2",
        tutorName: "Thầy Minh Quân",
        tutorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
        colorTheme: "blue",
        subject: "IELTS Writing Task 2",
        tutorNote: "Em chú ý cách biến đổi câu chủ động sang bị động và dùng mệnh đề quan hệ để nâng Band điểm Cohesion nhé!",
        questions: [
          {
            id: "wq1",
            kind: "sentence_transformation",
            prompt: "Viết lại câu sau sử dụng mệnh đề quan hệ bắt đầu với 'Students':",
            originalSentence: "Some students participate in extracurricular activities. They tend to develop better social skills.",
            givenStart: "Students",
            correct: "Students who participate in extracurricular activities tend to develop better social skills.",
            aiExplanation: {
              rule: "Mệnh đề quan hệ xác định kết hợp 2 câu đơn có cùng chủ ngữ chỉ người.",
              whyCorrect: "'who participate in extracurricular activities' bổ nghĩa làm rõ cho 'Students'.",
              distractors: "Tránh viết 2 câu rời rạc để tăng điểm Grammatical Range trong IELTS Writing."
            }
          },
          {
            id: "wq2",
            kind: "fill",
            prompt: "Điền từ nối mang nghĩa nhượng bộ phù hợp vào chỗ trống:",
            sentence: "Technological advancements bring numerous benefits; ______, they pose privacy risks.",
            correct: "however",
            aiExplanation: {
              rule: "Trạng từ liên kết 'however' đứng giữa dấu chấm phẩy và dấu phẩy để nối 2 ý tương phản.",
              whyCorrect: "Vế trước nói về lợi ích, vế sau là rủi ro ➔ Cần từ nối tương phản 'however' hoặc 'nevertheless'.",
              distractors: "Không dùng 'although' ở đây vì sau dấu chấm phẩy cần trạng từ liên kết, không phải liên từ phụ thuộc."
            }
          },
          {
            id: "wq3",
            kind: "error_correction",
            prompt: "Tìm và sửa 1 lỗi sai về hòa hợp chủ vị trong câu nghị luận:",
            sentence: "The widespread use of smartphones have altered social communication patterns.",
            wrongPart: "have",
            correct: "has",
            aiExplanation: {
              rule: "Chủ ngữ là danh từ số ít 'The widespread use', cụm giới từ 'of smartphones' chỉ bổ nghĩa.",
              whyCorrect: "Động từ phải chia số ít là 'has altered', không chia theo 'smartphones'.",
              distractors: "Bẫy danh từ số nhiều đứng ngay trước trợ động từ."
            }
          },
          {
            id: "wq4",
            kind: "mcq",
            prompt: "Chọn từ học thuật thay thế tốt nhất cho 'big problem' trong bài viết luận:",
            options: ["A. pressing issue", "B. huge thing", "C. bad situation", "D. hard deal"],
            correct: "A. pressing issue",
            aiExplanation: {
              rule: "Sử dụng Academic Collocations để nâng Lexical Resource Band 7.0+.",
              whyCorrect: "'pressing issue' (vấn đề cấp bách) là cụm từ học thuật trang trọng chuẩn IELTS.",
              distractors: "'huge thing', 'hard deal' mang tính khẩu ngữ (spoken English)."
            }
          }
        ]
      },
      {
        id: "e6",
        title: "Luyện Phát Âm Đuôi /s/ và /z/ Trong Giao Tiếp Tự Nhiên",
        skill: "Phát âm & Nói",
        difficulty: "Cơ bản",
        mode: "practice",
        type: "Trắc nghiệm & Điền từ",
        status: "assigned",
        assignedDate: "2026-03-09",
        dueDate: "2026-03-11",
        sessionId: "lp6",
        tutorId: "t3",
        tutorName: "Cô Thu Hà",
        tutorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80",
        colorTheme: "emerald",
        subject: "Giao tiếp & Phát âm IPA",
        tutorNote: "Khôi nhớ phát âm chậm và rõ âm đuôi, chú ý dây thanh quản rung khi phát âm /z/ nhé con!",
        questions: [
          {
            id: "pq1",
            kind: "mcq",
            prompt: "Từ nào dưới đây có đuôi 's' được phát âm là /z/?",
            options: ["A. books", "B. plays", "C. cats", "D. laughs"],
            correct: "B. plays",
            aiExplanation: {
              rule: "Quy tắc đuôi 's': Đi sau nguyên âm hoặc phụ âm hữu thanh sẽ phát âm là /z/.",
              whyCorrect: "'play' kết thúc bằng nguyên âm đôi /eɪ/ (hữu thanh) ➔ 'plays' phát âm đuôi là /z/.",
              distractors: "books (/k/), cats (/t/), laughs (/f/) đều kết thúc bằng phụ âm vô thanh nên đuôi 's' phát âm là /s/."
            }
          },
          {
            id: "pq2",
            kind: "mcq",
            prompt: "Đuôi 'es' trong từ 'watches' được phát âm là:",
            options: ["A. /ɪz/", "B. /s/", "C. /z/", "D. /d/"],
            correct: "A. /ɪz/",
            aiExplanation: {
              rule: "Khi từ kết thúc bằng các âm xuýt (/tʃ/, /dʒ/, /s/, /z/, /ʃ/, /ʒ/), đuôi 'es' đọc là /ɪz/.",
              whyCorrect: "'watch' kết thúc bằng /tʃ/ nên thêm 'es' đọc thành /wɒtʃɪz/.",
              distractors: "Không đọc là /s/ hay /z/ vì thiếu âm đệm /ɪ/."
            }
          },
          {
            id: "pq3",
            kind: "fill",
            prompt: "Điền dạng số nhiều đúng của danh từ 'city' (chú ý đổi y ➔ ies):",
            sentence: "Many modern ______ around the world are facing traffic congestion.",
            correct: "cities",
            aiExplanation: {
              rule: "Danh từ kết thúc bằng phụ âm + 'y', khi chuyển sang số nhiều đổi 'y' thành 'ies'.",
              whyCorrect: "'city' ➔ 'cities' (phát âm đuôi là /z/).",
              distractors: "Không viết là 'citys'."
            }
          },
          {
            id: "pq4",
            kind: "error_correction",
            prompt: "Tìm và sửa lỗi chính tả ở dạng số nhiều:",
            sentence: "She bought three knifes for the cooking lesson.",
            wrongPart: "knifes",
            correct: "knives",
            aiExplanation: {
              rule: "Danh từ kết thúc bằng 'fe' chuyển sang số nhiều đổi thành 'ves'.",
              whyCorrect: "'knife' ➔ 'knives' (phát âm /naɪvz/ với âm /z/).",
              distractors: "knifes là cách viết sai ngữ pháp tiếng Anh."
            }
          }
        ]
      },
      {
        id: "e7",
        title: "Writing Task 2 Essay: Urbanization & Quality of Life",
        skill: "Viết",
        difficulty: "Nâng cao",
        mode: "assessment",
        type: "Bài luận hoàn chỉnh",
        status: "submitted",
        assignedDate: "2026-03-05",
        submittedAt: "2026-03-07",
        sessionId: "lp5",
        tutorId: "t2",
        tutorName: "Thầy Minh Quân",
        tutorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
        colorTheme: "blue",
        subject: "IELTS Writing Task 2"
      }
    ],
    studentKnowledgeProfile: {
      overallElo: 74,
      microSkills: [
        { id: "sk1", name: "Thì Quá khứ đơn & Tiếp diễn", category: "Ngữ pháp", masteryElo: 82, confidence: 90, status: "mastered" },
        { id: "sk2", name: "Mệnh đề quan hệ xác định", category: "Ngữ pháp", masteryElo: 48, confidence: 55, status: "learning" },
        { id: "sk3", name: "Câu điều kiện loại 2 & 3", category: "Ngữ pháp", masteryElo: 54, confidence: 60, status: "learning" },
        { id: "sk4", name: "Collocations chủ đề Môi trường", category: "Từ vựng", masteryElo: 79, confidence: 85, status: "mastered" },
        { id: "sk5", name: "Từ nối Cohesion Task 2", category: "Viết", masteryElo: 52, confidence: 58, status: "learning" },
        { id: "sk6", name: "Ngữ âm nguyên âm đôi /eə/ & /ɪə/", category: "Phát âm", masteryElo: 88, confidence: 92, status: "mastered" },
        { id: "sk7", name: "Kỹ thuật Skimming & Scanning", category: "Đọc", masteryElo: 84, confidence: 88, status: "mastered" },
        { id: "sk8", name: "Nhận diện bẫy Distractor Section 3", category: "Nghe", masteryElo: 46, confidence: 50, status: "weak" }
      ],
      strengths: [
        { name: "Ngữ âm nguyên âm đôi /eə/ & /ɪə/", masteryElo: 88, category: "Phát âm", badge: "Top 1" },
        { name: "Kỹ thuật Skimming & Scanning", masteryElo: 84, category: "Đọc", badge: "Top 2" },
        { name: "Thì Quá khứ đơn & Tiếp diễn", masteryElo: 82, category: "Ngữ pháp", badge: "Top 3" },
        { name: "Collocations chủ đề Môi trường", masteryElo: 79, category: "Từ vựng", badge: "Top 4" },
        { name: "Phản xạ chào hỏi & Giới thiệu bản thân", masteryElo: 76, category: "Nói", badge: "Top 5" }
      ],
      weaknesses: [
        { name: "Nhận diện bẫy Distractor Section 3", masteryElo: 46, category: "Nghe", priority: "Cấp thiết", suggestion: "Luyện thêm 3 bài Section 3 cùng cô Lan Anh" },
        { name: "Mệnh đề quan hệ xác định", masteryElo: 48, category: "Ngữ pháp", priority: "Cấp thiết", suggestion: "Ôn lại quy tắc who/whom/whose/which" },
        { name: "Từ nối Cohesion Task 2", masteryElo: 52, category: "Viết", priority: "Cần cải thiện", suggestion: "Thực hành chuỗi liên kết However, Furthermore" },
        { name: "Câu điều kiện loại 2 & 3", masteryElo: 54, category: "Ngữ pháp", priority: "Cần cải thiện", suggestion: "Làm bài tập phân biệt giả định hiện tại & quá khứ" },
        { name: "Phát âm đuôi /s/ và /z/ trong văn cảnh nhanh", masteryElo: 58, category: "Phát âm", priority: "Nhắc nhở", suggestion: "Ghi âm lặp lại đoạn thoại ngắn" }
      ],
      errorPatterns: [
        { id: "ep1", title: "Nhầm lẫn giữa Relative Pronoun 'which' và 'where'", count: 5, lastOccurred: "2026-03-04", example: "The school which I studied (sai) ➔ where I studied", remedy: "Phân biệt mệnh đề trạng ngữ chỉ nơi chốn và tân ngữ" },
        { id: "ep2", title: "Chia sai thì động từ trong Mệnh đề điều kiện loại 3", count: 4, lastOccurred: "2026-02-28", example: "If I knew ➔ If I had known", remedy: "Nhớ công thức: If + S + had V3/ed, S + would have V3/ed" },
        { id: "ep3", title: "Thiếu s/es ở ngôi thứ ba số ít khi nói nhanh", count: 3, lastOccurred: "2026-03-06", example: "He say ➔ He says", remedy: "Tập nói chậm và ngắt nhịp cuối từ" },
        { id: "ep4", title: "Dùng sai giới từ đi kèm tính từ (Interested on ➔ in)", count: 3, lastOccurred: "2026-02-20", example: "Interested on reading ➔ Interested in reading", remedy: "Học thuộc theo cụm Adjective + Preposition" }
      ]
    },
    spacedRepetitionDeck: {
      streakDays: 5,
      totalReviewedCount: 38,
      dueTodayCount: 5,
      retentionRate: "88%",
      items: [
        {
          id: "sr-1",
          microSkill: "Mệnh đề quan hệ",
          type: "mcq",
          prompt: "Choose the correct relative pronoun: 'The village ______ my grandfather was born is now a famous tourist attraction.'",
          options: ["A. which", "B. where", "C. that", "D. who"],
          correct: "B. where",
          nextReview: "Hôm nay (Đến hạn)",
          intervalDays: 1,
          easeFactor: 2.5,
          repetitions: 2,
          aiExplanation: {
            rule: "Trạng từ quan hệ 'where' thay thế cho cụm trạng ngữ chỉ nơi chốn (in that village).",
            whyCorrect: "Mệnh đề sau là 'my grandfather was born [in the village]' ➔ cần từ nối trạng ngữ 'where'.",
            distractors: "'Which' và 'That' là đại từ chỉ vật, chỉ dùng khi đóng vai trò chủ ngữ hoặc tân ngữ trong mệnh đề."
          }
        },
        {
          id: "sr-2",
          microSkill: "Câu điều kiện loại 3",
          type: "fill",
          prompt: "Điền dạng đúng của động từ trong ngoặc:",
          sentence: "If she ______ (listen) to my advice yesterday, she would not have failed the interview.",
          correct: "had listened",
          nextReview: "Hôm nay (Đến hạn)",
          intervalDays: 2,
          easeFactor: 2.6,
          repetitions: 3,
          aiExplanation: {
            rule: "Câu điều kiện loại 3 diễn tả giả định trái ngược với quá khứ: If + S + had + V3/ed.",
            whyCorrect: "Dấu hiệu 'yesterday' và mệnh đề chính 'would not have failed' xác định đây là Type 3.",
            distractors: "Không dùng 'listened' (loại 2) vì sự việc đã xảy ra và kết thúc trong quá khứ."
          }
        },
        {
          id: "sr-3",
          microSkill: "Sửa lỗi sai",
          type: "error_correction",
          prompt: "Tìm và sửa 1 từ sai trong câu sau:",
          sentence: "Many students are extremely interested on discovering artificial intelligence tools.",
          wrongPart: "on",
          correctReplacement: "in",
          nextReview: "Hôm nay (Đến hạn)",
          intervalDays: 3,
          easeFactor: 2.4,
          repetitions: 2,
          aiExplanation: {
            rule: "Cụm tính từ cố định: 'be interested IN sth/doing sth' (quan tâm, hứng thú với điều gì).",
            whyCorrect: "'interested on' là lỗi dịch thô (word-by-word) từ tiếng Việt sang tiếng Anh. Đúng phải là 'interested in'.",
            distractors: "Không đi với 'on', 'with' hay 'about'."
          }
        },
        {
          id: "sr-4",
          microSkill: "Viết lại câu",
          type: "sentence_transformation",
          prompt: "Viết lại câu sao cho nghĩa không đổi, bắt đầu bằng từ gợi ý:",
          originalSentence: "Although he was exhausted, he completed the report on time.",
          givenStart: "In spite of",
          correct: "In spite of being exhausted, he completed the report on time.",
          acceptableAlternatives: [
            "In spite of his exhaustion, he completed the report on time."
          ],
          nextReview: "Hôm nay (Đến hạn)",
          intervalDays: 4,
          easeFactor: 2.5,
          repetitions: 4,
          aiExplanation: {
            rule: "'Although + S + V' chuyển sang 'In spite of / Despite + V-ing / Noun phrase'.",
            whyCorrect: "Chủ ngữ 2 vế giống nhau (he), nên rút gọn thành V-ing: 'In spite of being exhausted'.",
            distractors: "Tránh nhầm 'In spite of' đi với mệnh đề 'he was exhausted' (phải có 'the fact that')."
          }
        },
        {
          id: "sr-5",
          microSkill: "Collocations IELTS",
          type: "mcq",
          prompt: "Select the most natural collocation: 'The local government should ______ measures to combat air pollution.'",
          options: ["A. make", "B. take", "C. do", "D. bring"],
          correct: "B. take",
          nextReview: "Hôm nay (Đến hạn)",
          intervalDays: 2,
          easeFactor: 2.7,
          repetitions: 3,
          aiExplanation: {
            rule: "Collocation học thuật cố định: 'take measures' (thực hiện các biện pháp / giải pháp).",
            whyCorrect: "Trong tiếng Anh chuẩn học thuật, chỉ dùng 'take steps' hoặc 'take measures'.",
            distractors: "'make measures' hay 'do measures' là lỗi phổ biến do người học ghép từ tự do."
          }
        }
      ]
    },
    effortMetrics: {
      practiceCompletionRate: 94,
      onTimeSubmissionRate: 90,
      spacedRepetitionSessionsThisWeek: 6,
      currentStreak: 5,
      totalHoursLearned: "32.5h"
    },
    progressHistory: [
      { date: "Tuần 1", Nghe: 5, Nói: 5, Đọc: 5, Viết: 4, "Từ vựng": 6, "Ngữ pháp": 5 },
      { date: "Tuần 2", Nghe: 6, Nói: 5, Đọc: 6, Viết: 4, "Từ vựng": 7, "Ngữ pháp": 6 },
      { date: "Tuần 3", Nghe: 6, Nói: 6, Đọc: 7, Viết: 5, "Từ vựng": 7, "Ngữ pháp": 6 },
      { date: "Tuần 4", Nghe: 7, Nói: 6, Đọc: 7, Viết: 5, "Từ vựng": 8, "Ngữ pháp": 7 },
      { date: "Tuần 5", Nghe: 7, Nói: 7, Đọc: 8, Viết: 6, "Từ vựng": 8, "Ngữ pháp": 7 },
    ]
  },
  {
    id: "s2",
    name: "Trần Bảo Ngọc",
    initials: "BN",
    level: "A2",
    grade: "Lớp 7",
    goal: "Lấy lại gốc, giao tiếp cơ bản",
    note: "Bé nhút nhát khi nói tiếng Anh, cần gia sư kiên nhẫn tương tác.",
    schedule: "Thứ 2 - 4 - 6, 17:30-19:00",
    parentName: "Chị Trần Thu Hà",
    parentPhone: "0912 998 877",
    parentTelegram: "@ha_tran92",
    province: "Hà Nội",
    district: "Đống Đa",
    joinedDate: "2026-03-01",
    assignedTutorId: "t1",
    overallProgress: 42,
    approvalStatus: "account_created",
    weakSkill: "Ngữ pháp",
    templateSource: "tpl2",
    learningPath: [
      { id: "lp1", phase: "Giai đoạn 1: Xây nền tảng", week: 1, session: 1, date: "2026-03-02", skills: ["Ngữ pháp"], topic: "Thì hiện tại đơn, cấu trúc câu cơ bản", status: "done" },
      { id: "lp2", phase: "Giai đoạn 1: Xây nền tảng", week: 1, session: 2, date: "2026-03-04", skills: ["Từ vựng", "Nói"], topic: "Từ vựng chào hỏi, giới thiệu bản thân", status: "done" },
      { id: "lp3", phase: "Giai đoạn 1: Xây nền tảng", week: 2, session: 3, date: "2026-03-06", skills: ["Nghe"], topic: "Nghe số đếm, giờ giấc", status: "in_progress" },
      { id: "lp4", phase: "Giai đoạn 2: Giao tiếp tình huống", week: 3, session: 4, date: "2026-03-11", skills: ["Nói", "Từ vựng"], topic: "Hội thoại mua sắm", status: "upcoming" },
    ],
    exercises: [
      { id: "e1", title: "Bài tập thì hiện tại đơn", skill: "Ngữ pháp", difficulty: "Cơ bản", type: "Trắc nghiệm", status: "graded", score: 6, maxScore: 10, assignedDate: "2026-03-02", submittedAt: "2026-03-03", sessionId: "lp1" },
      { id: "e2", title: "Giới thiệu bản thân - viết đoạn ngắn", skill: "Viết", difficulty: "Cơ bản", type: "Tự luận", status: "graded", score: 5, maxScore: 10, assignedDate: "2026-03-04", submittedAt: "2026-03-05", feedback: "Câu còn ngắn, cần luyện thêm cách nối câu.", sessionId: "lp2" },
      { id: "e3", title: "Luyện nghe số đếm", skill: "Nghe", difficulty: "Cơ bản", type: "Trắc nghiệm", status: "submitted", assignedDate: "2026-03-06", submittedAt: "2026-03-07", sessionId: "lp3" },
    ],
    progressHistory: [
      { date: "Tuần 1", Nghe: 3, Nói: 4, Đọc: 3, Viết: 3, "Từ vựng": 4, "Ngữ pháp": 3 },
      { date: "Tuần 2", Nghe: 4, Nói: 4, Đọc: 4, Viết: 3, "Từ vựng": 5, "Ngữ pháp": 4 },
      { date: "Tuần 3", Nghe: 4, Nói: 5, Đọc: 4, Viết: 4, "Từ vựng": 5, "Ngữ pháp": 4 },
    ],
    materials: [
      { id: "m1", title: "Tài liệu: Bảng động từ bất quy tắc thông dụng", type: "doc", topic: "Ngữ pháp", date: "2026-03-02", sessionId: "lp1" },
    ],
  },
  {
    id: "s3",
    name: "Phạm Gia Hân",
    initials: "GH",
    level: "B2",
    grade: "Lớp 10",
    goal: "Giao tiếp phản xạ nhanh",
    note: "Mục tiêu giao tiếp phản xạ nhanh và chuẩn bị du học hè.",
    schedule: "Thứ 3 - 6, Chủ nhật 9:00-10:30",
    parentName: "Anh Phạm Quốc Việt",
    parentPhone: "0908 112 345",
    parentTelegram: "@viet_pham",
    province: "TP. Hồ Chí Minh",
    district: "Quận 1",
    joinedDate: "2026-01-15",
    assignedTutorId: "t4",
    overallProgress: 81,
    approvalStatus: "account_created",
    weakSkill: "Nghe",
    templateSource: "tpl3",
    learningPath: [
      { id: "lp1", phase: "Giai đoạn 2: Phản xạ giao tiếp", week: 6, session: 10, date: "2026-02-24", skills: ["Nói"], topic: "Thảo luận chủ đề công nghệ", status: "done" },
      { id: "lp2", phase: "Giai đoạn 2: Phản xạ giao tiếp", week: 6, session: 11, date: "2026-02-27", skills: ["Nghe"], topic: "Nghe podcast tốc độ tự nhiên", status: "done" },
      { id: "lp3", phase: "Giai đoạn 3: Nâng cao", week: 7, session: 12, date: "2026-03-05", skills: ["Nói", "Từ vựng"], topic: "Debate: Ưu nhược điểm làm việc từ xa", status: "in_progress" },
    ],
    exercises: [
      { id: "e1", title: "Debate chuẩn bị luận điểm", skill: "Nói", difficulty: "Nâng cao", type: "Bài nói (ghi âm)", status: "graded", score: 8, maxScore: 10, assignedDate: "2026-03-05", submittedAt: "2026-03-06", sessionId: "lp3" },
      { id: "e2", title: "Podcast Listening Challenge #5", skill: "Nghe", difficulty: "Nâng cao", type: "Trắc nghiệm", status: "graded", score: 6, maxScore: 10, assignedDate: "2026-02-27", submittedAt: "2026-02-28", sessionId: "lp2" },
    ],
    progressHistory: [
      { date: "Tuần 4", Nghe: 6, Nói: 8, Đọc: 8, Viết: 7, "Từ vựng": 8, "Ngữ pháp": 8 },
      { date: "Tuần 5", Nghe: 6, Nói: 8, Đọc: 8, Viết: 7, "Từ vựng": 8, "Ngữ pháp": 8 },
      { date: "Tuần 6", Nghe: 7, Nói: 9, Đọc: 8, Viết: 8, "Từ vựng": 9, "Ngữ pháp": 8 },
    ],
    materials: [
      { id: "m1", title: "Video: Kỹ năng debate tiếng Anh", type: "video", topic: "Nói", date: "2026-03-05", duration: "22:40", sessionId: "lp3" },
    ],
  },
  {
    id: "s6",
    name: "Đặng Minh Quân",
    initials: "MQ",
    level: "A2",
    grade: "Lớp 9",
    goal: "Lấy lại gốc ngữ pháp, luyện thi vào 10",
    note: "Bé mất gốc phát âm và ngữ pháp, cần gia sư kiên nhẫn giảng kỹ.",
    schedule: "Thứ 2 - Thứ 4, 18:30-20:00",
    parentName: "Anh Đặng Văn Long",
    parentPhone: "0903 445 566",
    parentTelegram: "@danglong_dn",
    province: "Đà Nẵng",
    district: "Hải Châu",
    joinedDate: "2026-03-06",
    assignedTutorId: "t3",
    overallProgress: 0,
    approvalStatus: "approved",
  },
  {
    id: "s9",
    name: "Hoàng Bảo Châu",
    initials: "BC",
    level: "B1",
    grade: "Lớp 7",
    goal: "Luyện thi chứng chỉ Cambridge PET đạt Merit",
    note: "Bé tiếp thu nhanh, cần rèn thêm kỹ năng Viết và phản xạ Nói trôi chảy.",
    schedule: "Thứ 3 - Thứ 6, 19:00-20:30",
    parentName: "Chị Lê Phương Thảo",
    parentPhone: "0978 998 877",
    parentTelegram: "@phuongthao_q1",
    province: "TP. Hồ Chí Minh",
    district: "Quận 1",
    joinedDate: "2026-03-05",
    assignedTutorId: "t1",
    overallProgress: 0,
    approvalStatus: "approved",
  },
  {
    id: "s4",
    name: "Lê Hoàng Nam",
    initials: "HN",
    level: "B1",
    grade: "Lớp 11",
    goal: "IELTS 6.5 cấp tốc 3 buổi/tuần",
    note: "Em Nam cần gia sư tập trung sửa phát âm và viết luận để chuẩn bị hồ sơ du học.",
    schedule: "Thứ 3 - 5 - 7, 19:30-21:00",
    parentName: "Bác Lê Văn Toàn",
    parentPhone: "0934 112 233",
    parentTelegram: "@letoan_hanoi",
    province: "Hà Nội",
    district: "Ba Đình",
    joinedDate: "2026-03-08",
    assignedTutorId: "t1",
    overallProgress: 0,
    approvalStatus: "pending_approval",
  },
  {
    id: "s5",
    name: "Vũ Mai Phương",
    initials: "MP",
    level: "B2",
    grade: "Lớp 12",
    goal: "IELTS 7.0 & Speaking chuyên sâu",
    note: "Học sinh muốn tập trung vào kỹ năng Nói Part 2 & 3 và Từ vựng học thuật C1.",
    schedule: "Thứ 2 - Thứ 6, 17:00-18:30",
    parentName: "Chị Vũ Thị Thảo",
    parentPhone: "0918 889 912",
    parentTelegram: "@thao_vu_sg",
    province: "TP. Hồ Chí Minh",
    district: "Quận 3",
    joinedDate: "2026-03-07",
    assignedTutorId: "t2",
    overallProgress: 0,
    approvalStatus: "pending_approval",
  },
  {
    id: "s7",
    name: "Nguyễn Hoàng Long",
    initials: "HL",
    level: "A1",
    grade: "Lớp 6",
    goal: "Xây dựng nền tảng tiếng Anh giao tiếp",
    note: "Bé mất gốc phát âm, cần gia sư kiên nhẫn, kèm thêm từ vựng SGK.",
    schedule: "Thứ 2 - Thứ 4, 18:00-19:30",
    parentName: "Anh Nguyễn Hoàng Giang",
    parentPhone: "0988 334 455",
    parentTelegram: "@hoanggiang_hn",
    province: "Hà Nội",
    district: "Cầu Giấy",
    joinedDate: "2026-03-09",
    assignedTutorId: "t5",
    overallProgress: 0,
    approvalStatus: "pending_approval",
  },
  {
    id: "s8",
    name: "Bùi Tuấn Kiệt",
    initials: "TK",
    level: "A2",
    grade: "Lớp 8",
    goal: "Luyện phát âm chuẩn IPA & Ngữ pháp căn bản",
    note: "Gia đình muốn gia sư dạy tại nhà hoặc online tương tác tích cực.",
    schedule: "Thứ 4 - Thứ 7, 19:30-21:00",
    parentName: "Chị Phạm Minh Nguyệt",
    parentPhone: "0908 776 655",
    parentTelegram: "@minhnguyet_q3",
    province: "TP. Hồ Chí Minh",
    district: "Quận 3",
    joinedDate: "2026-03-10",
    assignedTutorId: "t4",
    overallProgress: 0,
    approvalStatus: "pending_approval",
  },
];

export const mockSKP = students[0]?.studentKnowledgeProfile;
export const mockSpacedRepetitionDeck = students[0]?.spacedRepetitionDeck;
export const mockEffortMetrics = students[0]?.effortMetrics;
