-- =============================================================================
-- Migration: 0003_subject_content_seed.sql
-- Initiative: subject-content-db
--
-- Seeds `subjects` and `subject_questions`.
--   * subjects        : ON CONFLICT (key) DO UPDATE  -> re-run realigns metadata
--   * subject_questions: ON CONFLICT (subject_id, source_key) DO UPDATE
--
-- IMPORTANT (BR-4.2 / FD Q6=B): re-running this file RESETS every seeded question
-- to its file value. Admin-API edits to *seeded* rows are therefore reverted on
-- re-seed. Admin-CREATED rows (source_key IS NULL) and admin edits to non-seeded
-- rows are never touched.
--
-- Correct answers for MIGRATED questions were transcribed from the correctIndex
-- literals in components/learning-zone.tsx (pre-migration).
-- Difficulty: migrated rows = 'medium'; new Grade 2 rows target ~40/40/20.
-- Final content + difficulty spread is reviewed at TC-M001 before release.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Subjects (7)
-- ---------------------------------------------------------------------------
INSERT INTO subjects (key, title_vi, title_en, grade, target_language, content_mode, questions_per_session, sort_order) VALUES
  ('shapes',           'Quiz Hình dạng',        'Shapes Quiz',            'preschool', 'vi', 'localized', 10, 10),
  ('colors',           'Quiz Màu sắc',          'Colors Quiz',           'preschool', 'vi', 'localized', 10, 20),
  ('animals',          'Quiz Con vật',          'Animals Quiz',          'preschool', 'vi', 'localized', 10, 30),
  ('vietnamese',       'Quiz Tiếng Việt',       'Vietnamese Quiz',       'grade1',    'vi', 'fixed',      10, 40),
  ('english',          'Quiz Anh Văn',          'English Quiz',          'grade1',    'en', 'fixed',      10, 50),
  ('grade2Vietnamese', 'Quiz Tiếng Việt Lớp 2', 'Grade 2 Vietnamese Quiz','grade2',   'vi', 'fixed',      10, 60),
  ('grade2English',    'Quiz Tiếng Anh Lớp 2',  'Grade 2 English Quiz',  'grade2',    'en', 'fixed',      10, 70)
ON CONFLICT (key) DO UPDATE SET
  title_vi = EXCLUDED.title_vi,
  title_en = EXCLUDED.title_en,
  grade = EXCLUDED.grade,
  target_language = EXCLUDED.target_language,
  content_mode = EXCLUDED.content_mode,
  questions_per_session = EXCLUDED.questions_per_session,
  sort_order = EXCLUDED.sort_order;

-- Helper: every INSERT below joins to `subjects s` by key and carries a stable
-- source_key so it is idempotent via ON CONFLICT (subject_id, source_key).

-- ===========================================================================
-- shapes (localized, preschool)  — 10 migrated, difficulty medium
-- ===========================================================================
INSERT INTO subject_questions
  (subject_id, source_key, prompt_vi, prompt_en, options_vi, options_en, correct_index, difficulty, sort_order)
SELECT s.id, v.source_key, v.prompt_vi, v.prompt_en, v.options_vi::jsonb, v.options_en::jsonb, v.ci, 'medium', v.so
FROM subjects s, (VALUES
  ('shapes-001','Đây là hình gì? (Có 4 cạnh bằng nhau và 4 góc vuông)','What shape is this? (Has 4 equal sides and 4 right angles)','["Hình tròn","Hình vuông","Hình tam giác"]','["Circle","Square","Triangle"]',1,1),
  ('shapes-002','Hình nào có 3 cạnh?','Which shape has 3 sides?','["Hình tam giác","Hình chữ nhật","Hình tròn"]','["Triangle","Rectangle","Circle"]',0,2),
  ('shapes-003','Bánh xe có hình gì?','What shape is a wheel?','["Hình vuông","Hình tròn","Hình tam giác"]','["Square","Circle","Triangle"]',1,3),
  ('shapes-004','Hình nào giống quả bóng?','Which shape looks like a ball?','["Hình chữ nhật","Hình tam giác","Hình tròn"]','["Rectangle","Triangle","Circle"]',2,4),
  ('shapes-005','Màn hình TV có hình gì?','What shape is a TV screen?','["Hình tròn","Hình tam giác","Hình chữ nhật"]','["Circle","Triangle","Rectangle"]',2,5),
  ('shapes-006','Miếng bánh pizza thường có hình gì?','What shape is a pizza slice?','["Hình tròn","Hình tam giác","Hình vuông"]','["Circle","Triangle","Square"]',1,6),
  ('shapes-007','Hình nào không có góc?','Which shape has no corners?','["Hình vuông","Hình tam giác","Hình tròn"]','["Square","Triangle","Circle"]',2,7),
  ('shapes-008','Cuốn sách có hình gì?','What shape is a book?','["Hình tròn","Hình chữ nhật","Hình tam giác"]','["Circle","Rectangle","Triangle"]',1,8),
  ('shapes-009','Hình nào có 3 góc?','Which shape has 3 corners?','["Hình tròn","Hình vuông","Hình tam giác"]','["Circle","Square","Triangle"]',2,9),
  ('shapes-010','Cánh diều có hình gì?','What shape is a kite?','["Hình tròn","Hình chữ nhật","Hình thoi"]','["Circle","Rectangle","Diamond"]',2,10)
) AS v(source_key, prompt_vi, prompt_en, options_vi, options_en, ci, so)
WHERE s.key = 'shapes'
ON CONFLICT (subject_id, source_key) DO UPDATE SET
  prompt_vi = EXCLUDED.prompt_vi, prompt_en = EXCLUDED.prompt_en,
  options_vi = EXCLUDED.options_vi, options_en = EXCLUDED.options_en,
  correct_index = EXCLUDED.correct_index, difficulty = EXCLUDED.difficulty,
  is_active = EXCLUDED.is_active, sort_order = EXCLUDED.sort_order;

-- ===========================================================================
-- colors (localized, preschool)  — 10 migrated, difficulty medium
-- ===========================================================================
INSERT INTO subject_questions
  (subject_id, source_key, prompt_vi, prompt_en, options_vi, options_en, correct_index, difficulty, sort_order)
SELECT s.id, v.source_key, v.prompt_vi, v.prompt_en, v.options_vi::jsonb, v.options_en::jsonb, v.ci, 'medium', v.so
FROM subjects s, (VALUES
  ('colors-001','Lá cây có màu gì?','What color are leaves?','["Màu đỏ","Màu xanh lá","Màu vàng"]','["Red","Green","Yellow"]',1,1),
  ('colors-002','Mặt trời có màu gì?','What color is the sun?','["Màu xanh","Màu tím","Màu vàng"]','["Blue","Purple","Yellow"]',2,2),
  ('colors-003','Quả táo chín thường có màu gì?','What color is a ripe apple?','["Màu đỏ","Màu xanh","Màu trắng"]','["Red","Blue","White"]',0,3),
  ('colors-004','Bầu trời có màu gì?','What color is the sky?','["Màu đỏ","Màu xanh lam","Màu vàng"]','["Red","Blue","Yellow"]',1,4),
  ('colors-005','Chuối có màu gì?','What color is a banana?','["Màu đỏ","Màu xanh","Màu vàng"]','["Red","Green","Yellow"]',2,5),
  ('colors-006','Tuyết có màu gì?','What color is snow?','["Màu trắng","Màu đen","Màu xanh"]','["White","Black","Blue"]',0,6),
  ('colors-007','Cà rốt có màu gì?','What color is a carrot?','["Màu xanh","Màu cam","Màu đỏ"]','["Green","Orange","Red"]',1,7),
  ('colors-008','Dâu tây có màu gì?','What color is a strawberry?','["Màu đỏ","Màu vàng","Màu xanh"]','["Red","Yellow","Blue"]',0,8),
  ('colors-009','Nho có màu gì?','What color are grapes?','["Màu đỏ","Màu cam","Màu tím"]','["Red","Orange","Purple"]',2,9),
  ('colors-010','Con voi có màu gì?','What color is an elephant?','["Màu xanh","Màu xám","Màu vàng"]','["Blue","Gray","Yellow"]',1,10)
) AS v(source_key, prompt_vi, prompt_en, options_vi, options_en, ci, so)
WHERE s.key = 'colors'
ON CONFLICT (subject_id, source_key) DO UPDATE SET
  prompt_vi = EXCLUDED.prompt_vi, prompt_en = EXCLUDED.prompt_en,
  options_vi = EXCLUDED.options_vi, options_en = EXCLUDED.options_en,
  correct_index = EXCLUDED.correct_index, difficulty = EXCLUDED.difficulty,
  is_active = EXCLUDED.is_active, sort_order = EXCLUDED.sort_order;

-- ===========================================================================
-- animals (localized, preschool)  — 10 migrated, difficulty medium
-- ===========================================================================
INSERT INTO subject_questions
  (subject_id, source_key, prompt_vi, prompt_en, options_vi, options_en, correct_index, difficulty, sort_order)
SELECT s.id, v.source_key, v.prompt_vi, v.prompt_en, v.options_vi::jsonb, v.options_en::jsonb, v.ci, 'medium', v.so
FROM subjects s, (VALUES
  ('animals-001','Con vật nào kêu ''Gâu gâu''?','Which animal says ''Woof woof''?','["Con mèo","Con chó","Con gà"]','["Cat","Dog","Chicken"]',1,1),
  ('animals-002','Con vật nào sống dưới nước?','Which animal lives in water?','["Con chim","Con cá","Con thỏ"]','["Bird","Fish","Rabbit"]',1,2),
  ('animals-003','Con vật nào có vòi dài?','Which animal has a long trunk?','["Con hươu","Con voi","Con sư tử"]','["Deer","Elephant","Lion"]',1,3),
  ('animals-004','Con vật nào có cánh và biết bay?','Which animal has wings and can fly?','["Con thỏ","Con chim","Con bò"]','["Rabbit","Bird","Cow"]',1,4),
  ('animals-005','Con vật nào kêu ''Meo meo''?','Which animal says ''Meow''?','["Con mèo","Con chó","Con gà"]','["Cat","Dog","Chicken"]',0,5),
  ('animals-006','Con vật nào cho chúng ta sữa?','Which animal gives us milk?','["Con chó","Con mèo","Con bò"]','["Dog","Cat","Cow"]',2,6),
  ('animals-007','Con vật nào có cổ rất dài?','Which animal has a very long neck?','["Con voi","Hươu cao cổ","Con ngựa"]','["Elephant","Giraffe","Horse"]',1,7),
  ('animals-008','Con vật nào hay nhảy và có tai dài?','Which animal hops and has long ears?','["Con mèo","Con chó","Con thỏ"]','["Cat","Dog","Rabbit"]',2,8),
  ('animals-009','Con vật nào là vua của rừng?','Which animal is the king of the jungle?','["Con sư tử","Con cọp","Con gấu"]','["Lion","Tiger","Bear"]',0,9),
  ('animals-010','Con vật nào có sọc đen và trắng?','Which animal has black and white stripes?','["Con ngựa vằn","Con hổ","Con gấu trúc"]','["Zebra","Tiger","Panda"]',0,10)
) AS v(source_key, prompt_vi, prompt_en, options_vi, options_en, ci, so)
WHERE s.key = 'animals'
ON CONFLICT (subject_id, source_key) DO UPDATE SET
  prompt_vi = EXCLUDED.prompt_vi, prompt_en = EXCLUDED.prompt_en,
  options_vi = EXCLUDED.options_vi, options_en = EXCLUDED.options_en,
  correct_index = EXCLUDED.correct_index, difficulty = EXCLUDED.difficulty,
  is_active = EXCLUDED.is_active, sort_order = EXCLUDED.sort_order;

-- ===========================================================================
-- vietnamese (fixed vi, grade1)  — 3 migrated, difficulty medium
-- ===========================================================================
INSERT INTO subject_questions
  (subject_id, source_key, prompt_vi, options_vi, correct_index, difficulty, sort_order)
SELECT s.id, v.source_key, v.prompt_vi, v.options_vi::jsonb, v.ci, 'medium', v.so
FROM subjects s, (VALUES
  ('vietnamese-001','Chữ cái nào đứng đầu bảng chữ cái?','["A","B","C"]',0,1),
  ('vietnamese-002','"Mẹ" bắt đầu bằng chữ gì?','["N","M","L"]',1,2),
  ('vietnamese-003','Từ nào chỉ người sinh ra mình?','["Bạn","Thầy","Mẹ"]',2,3)
) AS v(source_key, prompt_vi, options_vi, ci, so)
WHERE s.key = 'vietnamese'
ON CONFLICT (subject_id, source_key) DO UPDATE SET
  prompt_vi = EXCLUDED.prompt_vi, options_vi = EXCLUDED.options_vi,
  correct_index = EXCLUDED.correct_index, difficulty = EXCLUDED.difficulty,
  is_active = EXCLUDED.is_active, sort_order = EXCLUDED.sort_order;

-- ===========================================================================
-- english (fixed en, grade1)  — 10 FRESH fully-English questions, difficulty medium
-- (Q4=B: not migrated; sight words / letters / phonics for ~6-year-olds)
-- ===========================================================================
INSERT INTO subject_questions
  (subject_id, source_key, prompt_en, options_en, correct_index, difficulty, sort_order)
SELECT s.id, v.source_key, v.prompt_en, v.options_en::jsonb, v.ci, 'medium', v.so
FROM subjects s, (VALUES
  ('english-001','Which letter comes after B?','["A","C","D"]',1,1),
  ('english-002','What sound does the letter S make?','["sss","mmm","ttt"]',0,2),
  ('english-003','Which word rhymes with "cat"?','["dog","hat","sun"]',1,3),
  ('english-004','How many letters are in the word "sun"?','["2","3","4"]',1,4),
  ('english-005','Which one is a vowel?','["b","e","t"]',1,5),
  ('english-006','What is the first letter of "apple"?','["a","p","e"]',0,6),
  ('english-007','Which word means more than one dog?','["dog","dogs","doggy"]',1,7),
  ('english-008','Pick the word that starts with "b".','["ball","cat","hat"]',0,8),
  ('english-009','Which letter is missing?  c _ t','["a","o","u"]',0,9),
  ('english-010','What is the opposite of "up"?','["down","big","fast"]',0,10)
) AS v(source_key, prompt_en, options_en, ci, so)
WHERE s.key = 'english'
ON CONFLICT (subject_id, source_key) DO UPDATE SET
  prompt_en = EXCLUDED.prompt_en, options_en = EXCLUDED.options_en,
  correct_index = EXCLUDED.correct_index, difficulty = EXCLUDED.difficulty,
  is_active = EXCLUDED.is_active, sort_order = EXCLUDED.sort_order;

-- ===========================================================================
-- grade2Vietnamese (fixed vi, grade2)
--   001-015 : migrated (difficulty medium)
--   016-050 : newly authored (~40% easy / ~40% medium / ~20% hard)
-- ===========================================================================
INSERT INTO subject_questions
  (subject_id, source_key, prompt_vi, options_vi, correct_index, difficulty, sort_order)
SELECT s.id, v.source_key, v.prompt_vi, v.options_vi::jsonb, v.ci, v.diff, v.so
FROM subjects s, (VALUES
  ('grade2Vietnamese-001','Từ nào là từ chỉ màu sắc?','["Chạy","Đỏ","Bàn"]',1,'medium',1),
  ('grade2Vietnamese-002','Từ trái nghĩa của "to lớn" là?','["Nhỏ bé","Nặng","Cao"]',0,'medium',2),
  ('grade2Vietnamese-003','"Học sinh" là gì?','["Giáo viên","Bác sĩ","Người đi học"]',2,'medium',3),
  ('grade2Vietnamese-004','Con vật nào sống trong rừng?','["Con cá","Con hổ","Con vịt"]',1,'medium',4),
  ('grade2Vietnamese-005','Từ nào là động từ (chỉ hành động)?','["Nhảy","Cái ghế","Xanh"]',0,'medium',5),
  ('grade2Vietnamese-006','Từ trái nghĩa của "ngắn" là?','["Nặng","Cao","Dài"]',2,'medium',6),
  ('grade2Vietnamese-007','Mùa nào có nhiều hoa đẹp nở rộ?','["Mùa đông","Mùa xuân","Mùa thu"]',1,'medium',7),
  ('grade2Vietnamese-008','Dụng cụ nào dùng để viết?','["Cái thước","Cái kéo","Cái bút"]',2,'medium',8),
  ('grade2Vietnamese-009','Câu nào viết đúng chuẩn?','["bạn ơi!","Bạn ơi!","BẠN ƠI!"]',1,'medium',9),
  ('grade2Vietnamese-010','Gia đình thường gồm những ai?','["Thầy cô giáo","Cha mẹ và con cái","Bạn bè cùng lớp"]',1,'medium',10),
  ('grade2Vietnamese-011','Từ nào chỉ tình cảm?','["Vui mừng","Quyển sách","Chiếc xe"]',0,'medium',11),
  ('grade2Vietnamese-012','Dấu câu nào dùng cuối câu hỏi?','["Dấu chấm (.)","Dấu phẩy (,)","Dấu hỏi (?)"]',2,'medium',12),
  ('grade2Vietnamese-013','Đâu là tên một mùa trong năm?','["Tháng Ba","Mùa hè","Thứ Hai"]',1,'medium',13),
  ('grade2Vietnamese-014','Tháng nào trong năm có ít ngày nhất?','["Tháng Hai","Tháng Ba","Tháng Giêng"]',0,'medium',14),
  ('grade2Vietnamese-015','Bài thơ thường có đặc điểm gì?','["Không có vần điệu","Chỉ có một dòng","Có vần điệu đẹp"]',2,'medium',15),
  ('grade2Vietnamese-016','Từ nào chỉ đồ vật?','["Cái bàn","Chạy nhanh","Vui vẻ"]',0,'easy',16),
  ('grade2Vietnamese-017','Từ trái nghĩa của "nóng" là gì?','["Ấm","Lạnh","Ướt"]',1,'easy',17),
  ('grade2Vietnamese-018','Con vật nào biết gáy vào buổi sáng?','["Con gà trống","Con mèo","Con cá"]',0,'easy',18),
  ('grade2Vietnamese-019','Từ nào viết đúng chính tả?','["Quả suồi","Quả xoài","Quả soài"]',1,'medium',19),
  ('grade2Vietnamese-020','Một tuần có mấy ngày?','["5 ngày","7 ngày","10 ngày"]',1,'easy',20),
  ('grade2Vietnamese-021','Từ nào là tính từ (chỉ đặc điểm)?','["Cao lớn","Con chó","Đi học"]',0,'medium',21),
  ('grade2Vietnamese-022','Đồ dùng nào dùng để đo chiều dài?','["Cái thước","Cục tẩy","Bút chì"]',0,'easy',22),
  ('grade2Vietnamese-023','Câu nào nói về việc chăm chỉ?','["Bé lười học bài.","Bé chăm chỉ học bài.","Bé quên học bài."]',1,'medium',23),
  ('grade2Vietnamese-024','Từ nào chỉ người trong gia đình?','["Ông bà","Cái tủ","Ngôi sao"]',0,'easy',24),
  ('grade2Vietnamese-025','Từ đồng nghĩa với "vui" là gì?','["Buồn","Sung sướng","Giận"]',1,'medium',25),
  ('grade2Vietnamese-026','Trong câu "Chú mèo lười nằm ngủ", từ nào chỉ đặc điểm?','["Chú mèo","Lười","Nằm ngủ"]',1,'hard',26),
  ('grade2Vietnamese-027','Mùa nào trời thường có tuyết rơi ở xứ lạnh?','["Mùa hè","Mùa đông","Mùa xuân"]',1,'easy',27),
  ('grade2Vietnamese-028','Dấu câu nào đặt ở cuối câu kể?','["Dấu chấm (.)","Dấu hỏi (?)","Dấu chấm than (!)"]',0,'medium',28),
  ('grade2Vietnamese-029','Từ nào chỉ màu của lá cây tươi?','["Xanh lá","Đen","Trắng"]',0,'easy',29),
  ('grade2Vietnamese-030','Từ nào không cùng nhóm với các từ còn lại?','["Bàn","Ghế","Chạy"]',2,'hard',30),
  ('grade2Vietnamese-031','Câu nào dùng đúng dấu phẩy?','["Em thích táo cam và nho.","Em thích táo, cam và nho.","Em, thích táo cam nho."]',1,'hard',31),
  ('grade2Vietnamese-032','Con vật nào kêu "ục ục" và thích tắm bùn?','["Con lợn","Con chim","Con thỏ"]',0,'easy',32),
  ('grade2Vietnamese-033','"Chăm chỉ" trái nghĩa với từ nào?','["Siêng năng","Lười biếng","Nhanh nhẹn"]',1,'medium',33),
  ('grade2Vietnamese-034','Buổi nào trong ngày mặt trời mọc?','["Buổi sáng","Buổi tối","Nửa đêm"]',0,'easy',34),
  ('grade2Vietnamese-035','Từ nào chỉ nghề nghiệp?','["Bác sĩ","Cái áo","Con sông"]',0,'medium',35),
  ('grade2Vietnamese-036','Trong câu "Bé đọc sách rất to", từ "to" nói về việc gì?','["Bé","Đọc","Sách"]',1,'hard',36),
  ('grade2Vietnamese-037','Từ nào chỉ hành động?','["Nhảy múa","Cái trống","Đỏ tươi"]',0,'easy',37),
  ('grade2Vietnamese-038','Câu nào viết hoa đúng?','["hôm nay em đi học.","Hôm nay em đi học.","Hôm Nay Em Đi Học."]',1,'medium',38),
  ('grade2Vietnamese-039','Quả nào có màu vàng và vị chua?','["Quả chanh","Quả dưa hấu","Quả nho"]',0,'easy',39),
  ('grade2Vietnamese-040','Từ nào chỉ nơi chốn?','["Trường học","Vui vẻ","Chạy bộ"]',0,'medium',40),
  ('grade2Vietnamese-041','Từ nào là từ ghép?','["Nhà cửa","Đỏ","Chạy"]',0,'hard',41),
  ('grade2Vietnamese-042','Một năm ở Việt Nam thường được chia thành mấy mùa?','["2 hoặc 4 mùa","10 mùa","1 mùa"]',0,'easy',42),
  ('grade2Vietnamese-043','Từ trái nghĩa của "nhanh" là gì?','["Vội","Chậm","Gấp"]',1,'medium',43),
  ('grade2Vietnamese-044','Con vật nào sống ở ao và kêu "ộp ộp"?','["Con ếch","Con gà","Con bò"]',0,'easy',44),
  ('grade2Vietnamese-045','Câu nào là câu hỏi?','["Em đi học.","Em đi học phải không?","Em đi học đi!"]',1,'hard',45),
  ('grade2Vietnamese-046','Trong câu "Mẹ nấu cơm ngon", ai là người nấu cơm?','["Mẹ","Cơm","Ngon"]',0,'hard',46),
  ('grade2Vietnamese-047','Từ nào chỉ đồ ăn?','["Bánh mì","Cái ghế","Ngôi sao"]',0,'easy',47),
  ('grade2Vietnamese-048','Từ đồng nghĩa với "to" là gì?','["Bé","Lớn","Thấp"]',1,'medium',48),
  ('grade2Vietnamese-049','Thứ mấy là ngày đầu tuần đi học?','["Thứ Hai","Chủ Nhật","Thứ Bảy"]',0,'easy',49),
  ('grade2Vietnamese-050','Từ nào viết đúng chính tả?','["Cây che","Cây tre","Cây tche"]',1,'medium',50)
) AS v(source_key, prompt_vi, options_vi, ci, diff, so)
WHERE s.key = 'grade2Vietnamese'
ON CONFLICT (subject_id, source_key) DO UPDATE SET
  prompt_vi = EXCLUDED.prompt_vi, options_vi = EXCLUDED.options_vi,
  correct_index = EXCLUDED.correct_index, difficulty = EXCLUDED.difficulty,
  is_active = EXCLUDED.is_active, sort_order = EXCLUDED.sort_order;

-- ===========================================================================
-- grade2English (fixed en, grade2)
--   001-015 : migrated (difficulty medium)
--   016-050 : newly authored (~40% easy / ~40% medium / ~20% hard)
-- ===========================================================================
INSERT INTO subject_questions
  (subject_id, source_key, prompt_en, options_en, correct_index, difficulty, sort_order)
SELECT s.id, v.source_key, v.prompt_en, v.options_en::jsonb, v.ci, v.diff, v.so
FROM subjects s, (VALUES
  ('grade2English-001','Which word is a noun (name of a thing)?','["Run","Beautiful","Apple"]',2,'medium',1),
  ('grade2English-002','What is the opposite of "hot"?','["Warm","Cold","Wet"]',1,'medium',2),
  ('grade2English-003','How many days are in a week?','["5","6","7"]',2,'medium',3),
  ('grade2English-004','Which word is a verb (action word)?','["Happy","Jump","Tall"]',1,'medium',4),
  ('grade2English-005','What do you call a baby dog?','["Puppy","Kitten","Cub"]',0,'medium',5),
  ('grade2English-006','Which season comes after Winter?','["Autumn","Summer","Spring"]',2,'medium',6),
  ('grade2English-007','What color do you get mixing blue and yellow?','["Purple","Green","Orange"]',1,'medium',7),
  ('grade2English-008','Which animal is the largest?','["Elephant","Cat","Dog"]',0,'medium',8),
  ('grade2English-009','What is the plural of "child"?','["Childs","Childes","Children"]',2,'medium',9),
  ('grade2English-010','Which word has a silent letter?','["Knife","Cat","Dog"]',0,'medium',10),
  ('grade2English-011','How many sides does a rectangle have?','["3","4","5"]',1,'medium',11),
  ('grade2English-012','Which word is an adjective (describes a thing)?','["Big","Run","Eat"]',0,'medium',12),
  ('grade2English-013','Which sentence is correct?','["i like cats.","I like cats.","I like Cats."]',1,'medium',13),
  ('grade2English-014','What is the opposite of "open"?','["Wide","Near","Closed"]',2,'medium',14),
  ('grade2English-015','Which is a type of weather?','["Rainy","Monday","Happy"]',0,'medium',15),
  ('grade2English-016','Which one is a vowel?','["b","a","t"]',1,'easy',16),
  ('grade2English-017','What is the opposite of "big"?','["Small","Tall","Fast"]',0,'easy',17),
  ('grade2English-018','Which word rhymes with "sun"?','["fun","car","dog"]',0,'easy',18),
  ('grade2English-019','Which word is spelled correctly?','["frend","friend","freind"]',1,'medium',19),
  ('grade2English-020','How many letters are in the English alphabet?','["24","26","28"]',1,'easy',20),
  ('grade2English-021','Choose the correct word: I have two ___.','["cat","cats","cates"]',1,'medium',21),
  ('grade2English-022','What do bees make?','["Milk","Honey","Bread"]',1,'easy',22),
  ('grade2English-023','Which word is a question word?','["Where","Table","Happy"]',0,'medium',23),
  ('grade2English-024','What is the opposite of "day"?','["Night","Morning","Noon"]',0,'easy',24),
  ('grade2English-025','Pick the past tense of "play".','["play","played","playing"]',1,'medium',25),
  ('grade2English-026','In "The quick fox runs", which word is the verb?','["quick","fox","runs"]',2,'hard',26),
  ('grade2English-027','Which animal can fly?','["Bird","Cow","Fish"]',0,'easy',27),
  ('grade2English-028','Which sentence ends correctly?','["Where are you","Where are you?","Where are you."]',1,'medium',28),
  ('grade2English-029','Which season is the hottest?','["Winter","Summer","Autumn"]',1,'easy',29),
  ('grade2English-030','Choose the correct word: She ___ happy.','["is","are","am"]',0,'medium',30),
  ('grade2English-031','Which word is a pronoun?','["She","Book","Jump"]',0,'hard',31),
  ('grade2English-032','What is the first letter of "zebra"?','["z","e","a"]',0,'easy',32),
  ('grade2English-033','Which word means "not happy"?','["Glad","Sad","Kind"]',1,'medium',33),
  ('grade2English-034','How many wheels does a bicycle have?','["1","2","3"]',1,'easy',34),
  ('grade2English-035','Choose the correct spelling.','["becaus","because","becuase"]',1,'medium',35),
  ('grade2English-036','In "a red apple", which word describes the apple?','["a","red","apple"]',1,'hard',36),
  ('grade2English-037','What do you use to see?','["Ears","Eyes","Nose"]',1,'easy',37),
  ('grade2English-038','Which is a complete sentence?','["The big dog.","The dog runs.","Running fast."]',1,'hard',38),
  ('grade2English-039','What is the opposite of "happy"?','["Sad","Tall","Loud"]',0,'easy',39),
  ('grade2English-040','Pick the plural of "box".','["box","boxs","boxes"]',2,'medium',40),
  ('grade2English-041','Which word has three syllables?','["cat","banana","dog"]',1,'hard',41),
  ('grade2English-042','Which word starts with the same sound as "moon"?','["man","sun","tree"]',0,'easy',42),
  ('grade2English-043','Choose the correct word: They ___ playing.','["is","are","am"]',1,'medium',43),
  ('grade2English-044','What color is a school bus (usually)?','["Yellow","Purple","Black"]',0,'easy',44),
  ('grade2English-045','Which word names a place?','["School","Run","Green"]',0,'medium',45),
  ('grade2English-046','In "I gave the book to her", who received the book?','["I","the book","her"]',2,'hard',46),
  ('grade2English-047','What do you wear on your feet?','["Shoes","Hat","Gloves"]',0,'easy',47),
  ('grade2English-048','Which sentence uses "a" correctly?','["I see a apple.","I see an apple.","I see apple a."]',1,'medium',48),
  ('grade2English-049','How many months are in a year?','["10","12","14"]',1,'easy',49),
  ('grade2English-050','What is the opposite of "fast"?','["Slow","Big","Hot"]',0,'medium',50)
) AS v(source_key, prompt_en, options_en, ci, diff, so)
WHERE s.key = 'grade2English'
ON CONFLICT (subject_id, source_key) DO UPDATE SET
  prompt_en = EXCLUDED.prompt_en, options_en = EXCLUDED.options_en,
  correct_index = EXCLUDED.correct_index, difficulty = EXCLUDED.difficulty,
  is_active = EXCLUDED.is_active, sort_order = EXCLUDED.sort_order;
