# MH-8 Phân Tích Lỗi — Trang Đăng Nhập Hiển Thị Và Không Phản Hồi Khi Người Dùng Đã Xác Thực

**Ngày:** 2026-09-17  
**Người phân tích:** Claude Sonnet 4.6  
**Trạng thái:** ĐÃ GIẢI QUYẾT 2026-09-17

---

## Thông Tin Ticket

- **Mã:** MH-8
- **Tóm tắt:** Trang Đăng Nhập Hiển Thị Và Không Phản Hồi Khi Người Dùng Đã Xác Thực
- **Loại:** Bug
- **Ưu tiên:** Medium

---

## Hình Ảnh Tham Chiếu

Không có ảnh chụp màn hình. Phân tích dựa trên mô tả ticket và kiểm tra trực tiếp mã nguồn.

---

## Các Bước Tái Hiện Lỗi

1. Mở ứng dụng và đăng nhập với tài khoản hợp lệ.
2. Xác nhận người dùng được điều hướng đến dashboard chính.
3. Nhấn nút Back của trình duyệt hoặc làm mới trang.
4. *(Suy luận)* Quan sát: Trang Đăng Nhập xuất hiện ngắn, sau đó tự động chuyển hướng về dashboard sau khoảng ~500ms.
5. Nhấn Back lần nữa.
6. Nhập lại email và mật khẩu hợp lệ.
7. Nhấn Sign In.
8. *(Suy luận)* Quan sát: Không có gì xảy ra — nút vẫn hiển thị nhưng nhấn không có phản hồi.

**Kỳ vọng:** Người dùng đã xác thực không bao giờ được thấy trang Đăng Nhập. Nhấn Sign In với thông tin hợp lệ phải điều hướng đến dashboard.

**Thực tế:**
- Lỗi 1: Trang Đăng Nhập xuất hiện chớp nhoáng trước khi chuyển hướng.
- Lỗi 2: Sau chu trình Back→Submit, form trở nên hoàn toàn không phản hồi.

---

## Ngữ Cảnh

| File | Vai trò |
|------|---------|
| `contexts/auth-context.tsx` | Nhà cung cấp trạng thái xác thực — nguyên nhân gốc |
| `app/page.tsx` (`HomeContent`) | Sử dụng trạng thái auth, quyết định render gì |
| `components/login-view.tsx` | Form đăng nhập — nút bị khóa bởi `isLoading` |
| `app/api/auth/session/route.ts` | Endpoint kiểm tra session phía server |

---

## Luồng Hiện Tại (Trạng Thái Lỗi)

```
Mount
  → player = null → isAuthenticated = false → Trang Đăng Nhập render  ← Chớp (Lỗi 1)
  → useEffect kích hoạt → fetch /api/auth/session (bất đồng bộ, 300–1000ms)
    → phân giải → setPlayer(data) → isAuthenticated = true → Dashboard

Nếu người dùng submit form TRONG KHI session check đang chạy:
  → setIsLoading(true) → signIn() POST bắt đầu
  → session check phân giải trước → setPlayer(data) → Dashboard → LoginView unmount
  → signIn() POST vẫn đang chạy
  → Browser Back → bfcache có thể khôi phục trang với isLoading = true bị đóng băng
  → Nút bị vô hiệu hóa vĩnh viễn → Sign In không làm gì (Lỗi 2)
```

---

## Kết Quả Điều Tra

### UI / Component (`app/page.tsx`)
`HomeContent` đọc `isAuthenticated` và `showDashboard`. Lúc mount, `showDashboard = false` và `isAuthenticated = false` cùng lúc — do đó form đăng nhập render trước khi session check bất đồng bộ hoàn tất. Không có cơ chế chờ tải để ngăn điều này.

### State / Context (`contexts/auth-context.tsx`)
- `player` khởi tạo là `null` (dòng 18) → `isAuthenticated = false` ngay lập tức.
- `isLoading` (dòng 19) chỉ điều khiển nút form đăng nhập/đăng ký.
- **Không có cờ `isSessionLoading`** để chỉ ra rằng session check đang chạy nền. Đây là nguyên nhân gốc của Lỗi 1.
- Session check nền (dòng 22–27) hoàn tất bất đồng bộ mà không có cách nào để consumer biết.

### API Route (`app/api/auth/session/route.ts`)
- Gọi `supabase.auth.signOut()` khi `getUser()` không trả về user (dòng 10–13). Trong khi điều này xóa cookie cũ, nó có thể can thiệp vào các yêu cầu đăng nhập đồng thời — rủi ro thứ cấp.
- Không gây ra Lỗi 1 hoặc Lỗi 2 trực tiếp; vấn đề nằm hoàn toàn ở cách trạng thái tải được hiển thị với UI.

### Component (`components/login-view.tsx`)
- `isLoading` được lấy từ `useAuth()` (dòng 11) và vô hiệu hóa nút submit khi `true` (dòng 73).
- Nếu `isLoading = true` khi bfcache khôi phục snapshot trang, nút bị vô hiệu hóa vĩnh viễn.

### Triển Khai Tham Chiếu Đúng
Các context khác (ví dụ: `coin-context`) sử dụng cờ loading rõ ràng trước khi render UI phụ thuộc. Pattern này đã được thiết lập trong project.

### Bộ Nhớ Lỗi
Không tìm thấy entry trước đó cho khu vực này.

---

## Quyết Định Tổng Hợp

Cả hai lỗi đều có cùng nguyên nhân gốc: thiếu cờ `isSessionLoading`.

- Lỗi 1 được loại bỏ bằng cách không render trang đăng nhập cho đến khi session check hoàn tất.
- Lỗi 2 được loại bỏ vì form không thể truy cập trong khi session check đang chạy, do đó người dùng không thể kích hoạt race condition. Kịch bản bfcache được xử lý bằng handler sự kiện `pageshow` reset `isLoading`.

---

## Nguyên Nhân Gốc

**`contexts/auth-context.tsx` dòng 18–27:** `player` khởi tạo là `null`, làm cho `isAuthenticated = false` ở mọi lần mount. Session check bất đồng bộ không có cờ boolean tương ứng (`isSessionLoading`). Consumer không thể phân biệt "chưa xác thực" với "chưa kiểm tra", do đó trang đăng nhập render ngay lập tức ở mọi lần mount.

---

## Giả Thuyết Bị Loại Bỏ

| Giả thuyết | Lý do loại bỏ |
|-----------|---------------|
| Vấn đề session phía server | `apiSuccess(null)` được trả về đúng; dữ liệu đến client |
| Cookie không được đặt | Người dùng được chuyển hướng đến dashboard sau session check, xác nhận auth hoạt động |
| `signOut()` trong session route gây vấn đề | Chỉ kích hoạt khi `getUser()` thất bại; không nằm trong đường dẫn xác thực của người dùng |

---

## Đề Xuất Sửa Lỗi

### Thay đổi 1 — `contexts/auth-context.tsx`

Thêm `isSessionLoading: boolean` vào kiểu context và state.

```tsx
const [isSessionLoading, setIsSessionLoading] = useState(true)

useEffect(() => {
  fetch('/api/auth/session')
    .then(r => r.json())
    .then(({ data }) => { if (data) setPlayer(data) })
    .catch(() => {})
    .finally(() => setIsSessionLoading(false))
}, [])
```

Thêm handler bfcache `pageshow` để reset `isLoading` khi khôi phục từ cache:

```tsx
useEffect(() => {
  const handlePageShow = (e: PageTransitionEvent) => {
    if (e.persisted) setIsLoading(false)
  }
  window.addEventListener('pageshow', handlePageShow)
  return () => window.removeEventListener('pageshow', handlePageShow)
}, [])
```

Hiển thị `isSessionLoading` trong giá trị context.

### Thay đổi 2 — `app/page.tsx` (`HomeContent`)

Bảo vệ render welcome/đăng nhập bằng `isSessionLoading`:

```tsx
const { isAuthenticated, isSessionLoading } = useAuth()

if (isSessionLoading) return null   // hoặc spinner tối giản
```

Điều này ngăn trang đăng nhập xuất hiện chớp nhoáng trong quá trình session check.

---

## Rủi Ro

| Rủi ro | Mức độ | Biện pháp giảm thiểu |
|--------|--------|----------------------|
| Màn hình trắng ngắn trong session check (~300–1000ms) | Thấp | Đánh đổi UX chấp nhận được; tốt hơn so với chớp trang đăng nhập |
| Handler `pageshow` không khả dụng trong SSR | Không có | Handler sử dụng `window` bên trong `useEffect` — chỉ phía client, an toàn |
| Luồng đăng xuất bị ảnh hưởng | Không có | `signOut()` đặt `player = null`; `isSessionLoading` vẫn `false` sau lần kiểm tra đầu tiên |
| Thay đổi API surface `isSessionLoading` | Thấp | Chỉ `HomeContent` sử dụng; thay đổi context là additive |

---

## Độ Tin Cậy

**Cao** — nguyên nhân gốc rõ ràng từ kiểm tra mã; sửa lỗi tối thiểu và additive.

---

## Triển Khai Sửa Lỗi

### Các File Đã Thay Đổi

| File | Thay đổi |
|------|----------|
| `contexts/auth-context.tsx` | Thêm state `isSessionLoading` (bắt đầu `true`, đặt `false` trong `.finally()` của session check); thêm handler bfcache `pageshow` để reset `isLoading`; expose `isSessionLoading` trong context value và type |
| `app/page.tsx` | `HomeContent` trả về `null` khi `isSessionLoading` là `true`, ngăn chớp trang đăng nhập |
| `app/api/auth/session/route.ts` | Xóa lệnh `signOut()` tích cực khi không có session — endpoint giờ chỉ đọc |
| `automation_tests/unit/auth-context.test.tsx` | 6 test hồi quy mới (TC-U-MH8-1 đến TC-U-MH8-6) |

---

## Xác Minh

- `pnpm test` — 249 tests pass, 0 failures
- Tất cả 6 test hồi quy mới pass

---

## Trạng Thái Cuối

ĐÃ GIẢI QUYẾT — Cả hai lỗi đã được sửa. Người dùng đã xác thực không còn thấy trang đăng nhập chớp nữa, và form không thể bị vô hiệu hoá vĩnh viễn qua bfcache.
