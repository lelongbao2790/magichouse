# Hướng Dẫn Quy Trình AIDLC
## AI hỗ trợ phát triển phần mềm từng bước — Giải thích dễ hiểu bằng tiếng Việt

---

## AIDLC Là Gì?

**AIDLC** (AI-Driven Development Lifecycle) là một quy trình có cấu trúc, trong đó AI hướng dẫn
bạn xây dựng tính năng phần mềm theo từng bước rõ ràng.

### Ví dụ dễ hiểu — Giống như xây nhà:

```
❌ Cách làm sai:
   Sáng vừa nghĩ ra → chiều đã cầm búa đập tường
   Kết quả: phòng bếp không có cửa sổ, ống nước chạy qua phòng ngủ

✅ Cách làm đúng (AIDLC):
   Vẽ bản thiết kế → chọn vật liệu → xin giấy phép → rồi mới xây
   Kết quả: đúng như mong muốn, không phải đập đi làm lại
```

**AIDLC áp dụng nguyên tắc đó vào lập trình:**
- Trước tiên nghĩ rõ **cần làm gì** (Inception)
- Sau đó thiết kế **làm như thế nào** (Construction)
- Cuối cùng **triển khai và vận hành** (Operations)

---

## Sơ Đồ Toàn Bộ Quy Trình

```
  BẮT ĐẦU
     |
     v
╔══════════════════════════════════════╗
║  GIAI ĐOẠN 1: INCEPTION              ║
║  "Chúng ta đang xây gì và tại sao?"  ║
╚══════════════════════════════════════╝
     |
     |  [TỰ ĐỘNG] Nhận diện dự án
     |     AI đọc toàn bộ thư mục dự án
     |     → Dự án mới (greenfield) hay đã có sẵn (brownfield)?
     |
     v
     |  [CẦN PHÊ DUYỆT] Phân tích ngược (chỉ với dự án đã có)
     |     AI đọc toàn bộ code cũ, tạo ra 8 tài liệu mô tả hệ thống
     |     Bạn xem → GÕ "approve" để tiếp tục
     |
     v
     |  [CẦN TRẢ LỜI CÂU HỎI] Phân tích yêu cầu
     |     AI hỏi bạn 10-13 câu hỏi về tính năng cần làm
     |     Bạn trả lời → AI tạo tài liệu yêu cầu chính thức
     |
     v
     |  [TÙY CHỌN] Cổng kiểm duyệt QA
     |     Quy trình DỪNG HOÀN TOÀN cho đến khi bạn phê duyệt
     |     Bạn có thể bổ sung/thay đổi yêu cầu trước khi duyệt
     |
     v
     |  [CẦN PHÊ DUYỆT] Lập kế hoạch quy trình
     |     AI quyết định bước nào chạy, bước nào bỏ qua
     |     Hiển thị kế hoạch để bạn xem trước khi làm
     |
     v
╔══════════════════════════════════════╗
║  GIAI ĐOẠN 2: CONSTRUCTION           ║
║  "Làm chính xác như thế nào?"        ║
╚══════════════════════════════════════╝
     |
     |  [CẦN PHÊ DUYỆT] Thiết kế chức năng
     |     AI thiết kế logic nghiệp vụ — chưa viết code
     |     Giống như vẽ bản thiết kế chi tiết trước khi xây
     |
     v
     |  [TRẢ LỜI + PHÊ DUYỆT] Yêu cầu phi chức năng (NFR)
     |     AI hỏi về công cụ kiểm thử, bảo mật, hiệu suất
     |     Bạn trả lời → AI lập tài liệu NFR → Bạn phê duyệt
     |
     v
     |  [CẦN PHÊ DUYỆT] Thiết kế phi chức năng
     |     AI thiết kế cụ thể cách kiểm thử, cách đảm bảo an toàn
     |     Bạn xem → phê duyệt hoặc yêu cầu thay đổi
     |
     v
     |  [PHÊ DUYỆT KẾ HOẠCH → TỰ ĐỘNG] Sinh code
     |     Phần 1: AI viết kế hoạch từng bước — chưa có code
     |     Bạn PHÊ DUYỆT kế hoạch
     |     Phần 2: AI tự động viết tất cả code theo kế hoạch
     |     Bạn xem kết quả → phê duyệt hoặc yêu cầu sửa
     |
     v
     |  [CẦN PHÊ DUYỆT] Build và kiểm thử
     |     AI viết hướng dẫn build, chạy test tự động
     |     Bạn xem kết quả → phê duyệt để hoàn thành
     |
     v
╔══════════════════════════════════════╗
║  GIAI ĐOẠN 3: OPERATIONS (chờ phát  ║
║  triển — hiện tại chưa có nội dung) ║
╚══════════════════════════════════════╝
     |
     v
  HOÀN THÀNH ✅
```

---

## Giải Thích Từng Bước Chi Tiết

### GIAI ĐOẠN 1 — INCEPTION (Khởi đầu)

---

#### Bước 1: Nhận Diện Dự Án
**AI làm gì?**
Đọc toàn bộ thư mục dự án và phân loại:

```
Dự án mới (Greenfield)          Dự án đã có sẵn (Brownfield)
━━━━━━━━━━━━━━━━━━━━━━━━━━━     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Chưa có code gì                 Đã có code, muốn thêm tính năng
→ Bỏ qua bước Phân tích ngược   → Thực hiện bước Phân tích ngược
```

**Bạn cần làm gì?** Không cần làm gì — tự động hoàn toàn.

**Tại sao cần bước này?**
> Giống như bác sĩ cần khám bệnh trước khi kê đơn thuốc.
> AI cần hiểu "bệnh nhân" (dự án) trước khi "điều trị" (thêm tính năng).

**Kết quả tạo ra:** `aidlc-docs/aidlc-state.md` (file theo dõi tiến độ)

---

#### Bước 2: Phân Tích Ngược *(chỉ với dự án đã có sẵn)*
**AI làm gì?**
Đọc toàn bộ code hiện có và tạo ra **8 tài liệu** giải thích hệ thống:

```
📄 business-overview.md      → App này làm gì? Phục vụ ai?
📄 architecture.md           → Các phần của app kết nối như thế nào?
📄 code-structure.md         → File nào ở đâu, tổ chức ra sao?
📄 api-documentation.md      → Các hàm/component có API như thế nào?
📄 component-inventory.md    → Danh sách tất cả component
📄 technology-stack.md       → Dùng công nghệ gì (Next.js, React, v.v.)
📄 dependencies.md           → Các phần phụ thuộc nhau như thế nào?
📄 code-quality-assessment.md → Code có vấn đề gì cần chú ý?
```

**Bạn cần làm gì?** Xem qua → gõ **"approve and continue"** để tiếp tục.

**Tại sao cần bước này?**
> Hãy tưởng tượng bạn là thợ sửa nhà mới được thuê.
> Bạn sẽ không đập tường ngay — bạn đi thăm cả căn nhà trước,
> tìm hiểu ống nước chạy đâu, điện dây nằm chỗ nào.
> AIDLC làm y chang vậy với code.

**Kết quả tạo ra:** 8 tài liệu trong `aidlc-docs/inception/reverse-engineering/`

---

#### Bước 3: Phân Tích Yêu Cầu
**AI làm gì?**
Hỏi bạn các câu hỏi về tính năng cần xây dựng,
rồi biến câu trả lời của bạn thành tài liệu yêu cầu chính thức.

**Bạn cần làm gì?** Trả lời các câu hỏi (dạng trắc nghiệm A/B/C/D).

---

**Các câu hỏi đã hỏi trong dự án này và lý do:**

| Câu hỏi | Tại sao hỏi | Bạn trả lời |
|---|---|---|
| Tính năng Toán bao gồm những phép tính gì? | Để biết cần tạo bao nhiêu danh mục (tab) | Cộng, Trừ, Nhân |
| Phép cộng dùng số trong khoảng nào? | Quy tắc kinh doanh: xác định độ khó và giới hạn đáp án | 1 đến 100 |
| Phép trừ có thể ra kết quả âm không? | Quy tắc UX: trẻ em lớp 2 chưa học số âm | Không — số lớn trừ số nhỏ |
| Bảng nhân dùng bảng nào? | Xác định phạm vi kiến thức (bảng 2→9) | Bảng 2 đến bảng 9 |
| Mỗi lần chơi có bao nhiêu câu hỏi? | Thiết kế cấu trúc quiz | 10 câu |
| Thưởng bao nhiêu xu? | Phải khớp với hệ thống xu đã có trong app | 10 xu |
| Hiển thị đáp án đúng sau khi trả lời sai? | Quyết định UX: phản hồi tức thì giúp trẻ học tốt hơn | Có |
| Học sinh có thể làm lại câu sai không? | Quyết định UX: ảnh hưởng đến logic `disabled` trong UI | Không |
| Cần hỗ trợ mấy ngôn ngữ? | Xác định có cần thêm bản dịch không | Tiếng Việt + Tiếng Anh |
| Chỉ trả lời trắc nghiệm hay có thể gõ tự do? | Quyết định kiến trúc: ảnh hưởng đến component QuizModal | Chỉ trắc nghiệm |
| Có muốn bật kiểm thử bảo mật không? | Tùy chọn mở rộng (extension) | Không |
| Có muốn bật kiểm thử khả năng phục hồi không? | Tùy chọn mở rộng | Không |
| Có muốn bật Property-Based Testing không? | Tùy chọn mở rộng — kiểm thử nâng cao | Có (bật toàn bộ) |

**Kết quả tạo ra:** `requirements.md` với 13 yêu cầu chức năng (FR) + 5 yêu cầu phi chức năng (NFR)

---

#### Bước Đặc Biệt: Cổng Kiểm Duyệt QA *(tùy chọn)*
**AI làm gì?**
Tạo một "cổng chặn" — quy trình **dừng hoàn toàn** cho đến khi người được chỉ định ký duyệt.

**Bạn cần làm gì?**
Đóng vai QA reviewer — đặt câu hỏi, yêu cầu bổ sung, rồi gõ phê duyệt.

**Tại sao có bước này?**
> Giống như ký hợp đồng trước khi xây nhà.
> Một khi đã xây xong, sửa lại rất tốn kém.
> Nhưng thay đổi bản vẽ trên giấy thì miễn phí.

**Ví dụ trong dự án này:**
Trước khi duyệt, bạn hỏi 2 câu với tư cách QA:
- *"Điều gì xảy ra nếu học sinh nhập giá trị không hợp lệ?"*
  → Thêm **FR-12**: chỉ chọn trắc nghiệm, không có ô nhập tự do → không thể nhập sai
- *"Học sinh có thể làm lại câu trả lời sai không?"*
  → Thêm **FR-13**: một lần mỗi câu, không làm lại

Hai yêu cầu này được thêm vào **trước khi** bất kỳ dòng code nào được viết.
Nếu phát hiện sau khi code xong, sẽ mất nhiều thời gian sửa hơn.

**Kết quả tạo ra:** `qa-approval-gate.md` (trạng thái: APPROVED ✅)

---

#### Bước 4: Lập Kế Hoạch Quy Trình
**AI làm gì?**
Phân tích yêu cầu và quyết định bước nào cần chạy, bước nào nên bỏ qua để tiết kiệm thời gian.

**Bạn cần làm gì?** **Phê duyệt** kế hoạch hoặc yêu cầu điều chỉnh.

**Quyết định cho dự án này:**

```
✅ CHẠY:   Thiết kế chức năng     → cần vì có logic mới phức tạp
✅ CHẠY:   Yêu cầu NFR            → cần vì bật Property-Based Testing
✅ CHẠY:   Thiết kế NFR           → cần vì đã bật NFR
✅ CHẠY:   Sinh code              → luôn luôn chạy
✅ CHẠY:   Build và kiểm thử      → luôn luôn chạy

⏭️  BỎ QUA: User Stories          → không cần, chỉ có 1 developer
⏭️  BỎ QUA: Thiết kế ứng dụng     → không thêm component mới
⏭️  BỎ QUA: Tách đơn vị công việc → chỉ có 1 tính năng duy nhất
⏭️  BỎ QUA: Thiết kế hạ tầng      → chỉ chạy trên trình duyệt, không cần server
```

**Kết quả tạo ra:** `execution-plan.md` (sơ đồ kế hoạch thực thi)

---

### GIAI ĐOẠN 2 — CONSTRUCTION (Xây dựng)

---

#### Bước 5: Thiết Kế Chức Năng
**AI làm gì?**
Thiết kế chi tiết logic nghiệp vụ — kiểu dữ liệu, các hàm, thuật toán, quy tắc —
**nhưng chưa viết code thật**.

**Bạn cần làm gì?** **Phê duyệt** hoặc yêu cầu thay đổi.

**Tại sao chưa viết code?**
> Giống như kiến trúc sư vẽ bản thiết kế chi tiết TRƯỚC KHI thợ xây bắt đầu.
> Sửa một đường kẻ trên bản vẽ mất 5 giây.
> Sửa một bức tường đã xây mất 5 ngày.

**Ví dụ cụ thể — Hàm sinh câu hỏi phép cộng:**

```
Tài liệu thiết kế viết:
  Tên hàm: generateAdditionQuestion()
  Đầu vào: không có (tự sinh ngẫu nhiên)
  Đầu ra:  { question: "47 + 83 = ?", options: ["130", "125", "140"], correctIndex: 0 }
  Quy tắc:
    - a và b đều trong [1, 100]
    - Kết quả đúng = a + b (có thể vượt 100)
    - 3 đáp án: 1 đúng + 2 sai, thứ tự ngẫu nhiên
    - Đáp án sai không được trùng với đáp án đúng
```

Chỉ sau khi bạn duyệt thiết kế này, AI mới viết code thật.

**Kết quả tạo ra:**
- `business-logic-model.md` — 5 hàm với đặc tả đầy đủ
- `business-rules.md` — 25 quy tắc (ví dụ: "toán hạng trong [1,100]")
- `domain-entities.md` — các kiểu TypeScript mới
- `frontend-components.md` — thành phần UI nào thay đổi và thay đổi ra sao

---

#### Bước 6: Yêu Cầu Phi Chức Năng (NFR)
**NFR là gì?**

```
Yêu cầu chức năng (FR):          Yêu cầu phi chức năng (NFR):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"App phải tính đúng 47 + 83"     "App phải tính xong trong 1ms"
"Phải có 3 đáp án trắc nghiệm"   "Code phải có 90% test coverage"
"Phải hiển thị tiếng Việt"       "Phải kiểm thử với 2000 bộ số liệu"
```

**AI làm gì?**
Hỏi bạn về công cụ và phương pháp kiểm thử, rồi viết tài liệu NFR.

**Câu hỏi đã hỏi và lý do:**

| Câu hỏi | Tại sao hỏi |
|---|---|
| Dùng Vitest hay Jest làm test runner? | Dự án cần bật Property-Based Testing (PBT) với fast-check. Hai test runner phổ biến nhất là Vitest và Jest. Vitest tương thích tốt hơn với Next.js 16 không cần cấu hình thêm. Jest cần nhiều bước thiết lập hơn với tech stack này. → Bạn chọn **Vitest** |

**Bạn cần làm gì?** Trả lời câu hỏi, rồi **phê duyệt**.

**Kết quả tạo ra:**
- `nfr-requirements.md` — 5 NFR đang hoạt động
- `tech-stack-decisions.md` — ghi lại công cụ nào được chọn và tại sao

---

#### Bước 7: Thiết Kế Phi Chức Năng
**AI làm gì?**
Thiết kế cụ thể **cách thực thi** các NFR — đặc biệt là cách kiểm thử.

**Bạn cần làm gì?** **Phê duyệt** hoặc yêu cầu thay đổi.

**Ví dụ cụ thể — Thiết kế test cho hàm phép cộng:**

```
Property-Based Testing (PBT) — kiểm thử dựa trên thuộc tính:

  Thay vì kiểm tra: "47 + 83 phải bằng 130"
  PBT kiểm tra:     "VỚI BẤT KỲ a,b trong [1,100], đáp án phải bằng a+b"

  fast-check sẽ tự động thử 100 cặp số ngẫu nhiên.
  Nếu 1 trong 100 cặp đó sai → báo lỗi kèm seed để tái tạo lại.

Arbitraries (bộ sinh số liệu đầu vào) được thiết kế sẵn:
  additionArb = fc.tuple(
    fc.integer({ min: 1, max: 100 }),   // số a
    fc.integer({ min: 1, max: 100 })    // số b
  )
```

**Tại sao thiết kế test trước khi viết code?**
> Giống như thiết kế bài kiểm tra trước khi dạy bài.
> Nếu bạn ra đề thi trước, bạn biết chính xác cần dạy gì.
> Nếu ra đề sau khi dạy xong, bạn có thể vô tình chỉ ra đề
> những gì bạn nhớ đã dạy, bỏ sót phần quan trọng.

**Kết quả tạo ra:**
- `nfr-design-patterns.md` — định nghĩa Arbitrary cho từng hàm; danh sách thuộc tính cần kiểm tra
- `logical-components.md` — cấu trúc file test, cách tái tạo lỗi bằng seed

---

#### Bước 8: Sinh Code
**AI làm gì?**
Viết toàn bộ code theo đúng thiết kế đã được phê duyệt. Chia làm 2 phần:

```
Phần 1 — Lập kế hoạch:
  AI viết danh sách kiểm (checklist) từng bước cụ thể.
  Chưa có dòng code nào được viết.
  Bạn đọc kế hoạch → PHÊ DUYỆT

Phần 2 — Thực thi:
  AI thực hiện từng bước, đánh dấu [x] khi hoàn thành.
  Viết tất cả code, test, cấu hình.
  Bạn xem kết quả → PHÊ DUYỆT
```

**Tại sao chia 2 phần?**
> Giống như đặt hàng tại nhà hàng.
> Trước tiên bồi bàn đọc lại order để xác nhận — bạn có thể sửa lúc này.
> Sau khi bếp đã nấu xong thì khó sửa hơn nhiều.

**Files đã thay đổi trong dự án này:**

```
📝 SỬA ĐỔI (3 files):
   components/learning-zone.tsx
     → Thêm tab Lớp 2, 3 danh mục, 5 hàm sinh câu hỏi, 3 danh sách câu hỏi

   data/translations.ts
     → Thêm nhãn tiếng Việt + tiếng Anh cho toàn bộ nội dung Lớp 2

   package.json
     → Thêm 4 thư viện kiểm thử + 3 script test

📄 TẠO MỚI (4 files):
   vitest.config.ts
     → Cấu hình Vitest cho dự án

   __tests__/learning-zone.pbt.test.ts
     → 24 property-based tests (mỗi test chạy 100 bộ số ngẫu nhiên)

   __tests__/learning-zone.test.ts
     → 14 example tests (giá trị biên cụ thể)
```

---

#### Bước 9: Build và Kiểm Thử
**AI làm gì?**
Viết hướng dẫn build và test, sau đó tự chạy test tự động.

**Bạn cần làm gì?** Xem kết quả → **phê duyệt**.

**Kết quả kiểm thử của dự án này:**

```
📊 Kết quả:

  ✓ 24 PBT tests   (property-based — 100 bộ số ngẫu nhiên/test = 2.400 lần kiểm tra)
  ✓ 14 example tests (giá trị biên cụ thể: nhỏ nhất, lớn nhất, trường hợp đặc biệt)
  ─────────────────────────────────────────────────────────
  ✓ 38 / 38 tests ĐẠT   (0 lỗi)
```

**Lỗi nhỏ được phát hiện và sửa trong bước này:**

```
Lỗi: Test "2 × 1 = 2" bị khớp nhầm với câu hỏi "2 × 10 = 20"

Tại sao? Vì "2 × 1" là chuỗi con của "2 × 10 = ?"
  "2 × 10 = ?".includes("2 × 1")  →  true  ← SAI!

Sửa: Dùng so sánh chính xác thay vì kiểm tra chuỗi con
  question === "2 × 1 = ?"   →  chỉ khớp đúng câu đó
```

Đây không phải lỗi của code sinh câu hỏi — mà là lỗi cách viết test.
PBT tests vẫn đang kiểm tra đúng thuộc tính từ đầu.

**Kết quả tạo ra:**
- `build-instructions.md` — cách chạy `npm install`, lint, build
- `unit-test-instructions.md` — cách chạy test và tái tạo lỗi bằng seed
- `integration-test-instructions.md` — checklist 6 bước kiểm tra thủ công
- `build-and-test-summary.md` — bảng truy xuất nguồn gốc yêu cầu đầy đủ

---

### GIAI ĐOẠN 3 — OPERATIONS *(Chờ phát triển)*

**Operations nghĩa là gì?**
Đây là giai đoạn dành cho việc **triển khai** và **vận hành** sau khi code xong:
- Kế hoạch deploy (đưa code lên production)
- Cài đặt monitoring (theo dõi hệ thống đang chạy)
- Quy trình xử lý sự cố
- Checklist sẵn sàng production

**Tại sao thư mục `operations/` trống?**

Có 2 lý do:

```
Lý do 1: AIDLC chưa implement giai đoạn này
  → Thư mục tồn tại trong cấu trúc nhưng chưa có nội dung.
    Đây là thiết kế có chủ ý, không phải lỗi.

Lý do 2: Dự án Magic House dùng Vercel
  → Vercel tự động deploy khi bạn push code lên GitHub.
    Không cần làm gì thêm — Vercel lo toàn bộ phần này.
```

---

## Bảng Hành Động Nhanh

| Tình huống | Bạn gõ gì | Kết quả |
|---|---|---|
| Hài lòng với kết quả, muốn tiếp tục | "approve and continue" | AI chuyển sang bước tiếp theo |
| Muốn thay đổi một phần | Mô tả cần thay đổi gì | AI cập nhật và hỏi lại |
| Muốn thêm yêu cầu mới | "Thêm FR-X: ..." | AI cập nhật tài liệu yêu cầu |
| Muốn tạo cổng QA | "Tạo QA gate — tôi là reviewer" | Quy trình dừng, chờ bạn duyệt |
| Trả lời câu hỏi AI | Điền A/B/C/D vào `[Answer]:` | AI đọc và tiếp tục |

---

## Tóm Tắt: Tại Sao Không Chỉ Nói "Viết Code Cho Tôi"?

```
Nói thẳng "viết code":          Dùng AIDLC:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI đoán bạn muốn gì             AI hỏi đến khi biết chính xác
Hay bỏ sót yêu cầu             Yêu cầu được ghi thành văn bản
Khó review một đống code        Review từng bước riêng lẻ
Test là chuyện sau              Test được thiết kế trước khi code
Không có lịch sử quyết định     Mọi quyết định ghi vào audit.md
Không biết dừng ở đâu nếu       aidlc-state.md ghi đúng vị trí,
bị gián đoạn                    có thể tiếp tục bất kỳ lúc nào
```

---

## Câu Lệnh Thực Tế Để Chạy Dự Án

```bash
# Cài đặt thư viện
npm install

# Kiểm tra kiểu dữ liệu TypeScript
npx tsc --noEmit

# Chạy toàn bộ test (38 tests)
npm test

# Chạy với báo cáo độ phủ code
npm run test:coverage

# Chạy server phát triển để xem kết quả
npm run dev
# Mở trình duyệt: http://localhost:3000
# → Vào Learning Zone → Xem tab "Lớp 2"
```
