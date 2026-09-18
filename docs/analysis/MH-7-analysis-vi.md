# MH-7 — Số Coin Hiển Thị Không Đúng: Phân Tích & Sửa Lỗi (v2)

## Thông Tin Ticket

- **Mã:** MH-7
- **Tóm tắt:** Số coin hiển thị không đúng
- **Loại:** Bug
- **Trạng thái:** Đã giải quyết (v2)
- **Mức độ ưu tiên:** Trung bình

---

## Ảnh Chụp Màn Hình

Không có ảnh chụp màn hình. Phân tích dựa trên mô tả ticket, lịch sử commit và mã nguồn.

---

## Mô Tả Của Người Dùng

Mỗi lần đăng nhập hoặc tải lại trang, số coin hiển thị trong mục "Your Coins" lại thay đổi sang một giá trị khác. Người dùng kỳ vọng luôn thấy đúng số coin được lưu trong cơ sở dữ liệu. Nếu không có dữ liệu thì mặc định hiển thị 0.

---

## Các Bước Tái Hiện Lỗi

1. Tạo tài khoản và đăng nhập.
2. Hoàn thành một bài kiểm tra trong Learning Zone.
3. Ghi nhớ số coin hiển thị trong "Your Coins."
4. Quay lại trang My House (hoặc tải lại trang, đăng xuất rồi đăng nhập lại).
5. Quan sát số coin có thể khác so với bước 3.

**Kỳ vọng:** Số coin luôn hiển thị đúng giá trị lưu trong cơ sở dữ liệu.  
**Thực tế:** Số coin thay đổi hoặc hiển thị giá trị cũ/sai.

---

## Khu Vực Chính

`lib/services/player.ts` — service phía server quản lý việc lưu trữ coin.

---

## Khu Vực Liên Quan

| Khu vực | File | Lý do |
|---------|------|-------|
| Coin context | `contexts/coin-context.tsx` | RC-4: nuốt lỗi âm thầm trong `addCoins`, gây lệch dữ liệu |
| Coins API | `app/api/players/coins/route.ts` | Ủy quyền cho service không atomic |
| Migration | `supabase/migrations/0005_increment_coins_rpc.sql` | RPC mới để cộng coin atomic |
| Types | `lib/database.types.ts` | Đăng ký kiểu dữ liệu cho `increment_player_coins` |

---

## Luồng Xử Lý (trước khi sửa)

```
QuizModal → LearningZone.handleQuizCompleteInternal
  → calculateSessionCoins(difficulties)       ← đã xác định (v1 đã sửa)
  → CoinContext.addCoins(coinsEarned)
      setCoins(newCoins)                       ← cập nhật lạc quan
      POST /api/players/coins
        → addCoins(supabase, userId, amount)
            ĐỌC current.coins                  ← bước 1 không atomic (RC-3)
            GHI coins = current.coins + amt    ← bước 2 không atomic (RC-3)
      .catch(() => {})                         ← RC-4: nuốt lỗi, không rollback

Lần đăng nhập tiếp theo:
  CoinContext useEffect([player])
    GET /api/players/me → setCoins(dbValue)    ← ghi đè giá trị lạc quan cũ
```

---

## Nguyên Nhân Gốc Rễ

### RC-1 (v1 — ĐÃ SỬA): Tính coin ngẫu nhiên
`lib/coin-rewards.ts` dùng `Math.random()`. Đã sửa trong commit `4dceb6b`.

### RC-2 (v2 — ĐÃ SỬA trong PR này): `upsertPlayer` đặt lại coin về 0 khi conflict
`lib/services/player.ts:42` có `coins: 0` trong payload upsert. Mọi lần đăng ký lại hoặc tái sử dụng hàm đều có thể xóa trắng số coin của người chơi. Đã sửa bằng cách bỏ `coins` khỏi upsert — cột đã có `DEFAULT 0` trong schema migration.

### RC-3 (v2 — ĐÃ SỬA trong PR này): `addCoins` không atomic (mất coin do race condition)
`addCoins` trong `lib/services/player.ts` thực hiện `getPlayer()` ĐỌC riêng rồi `UPDATE` GHI riêng. Hai request đồng thời đều đọc cùng giá trị coin cũ và cùng ghi `current.coins + amount` — khiến một phần thưởng bị mất. Đã sửa bằng RPC `increment_player_coins` mới, thực hiện `coins = coins + p_amount` trong một câu SQL atomic.

### RC-4 (v2 — ĐÃ SỬA trong PR này): Nuốt lỗi trong `CoinContext.addCoins`
`.catch(() => {})` trong `contexts/coin-context.tsx:103` nuốt lỗi API mà không rollback. Nếu POST `/api/players/coins` thất bại, màn hình hiển thị giá trị lạc quan cao hơn DB. Lần đăng nhập tiếp theo, `useEffect` lấy lại giá trị DB và ghi đè — gây ra triệu chứng "coin thay đổi khi đăng nhập." Đã sửa bằng cách lưu `previousCoins` trước khi cập nhật lạc quan và khôi phục cả `coins` state lẫn `localStorage` trong handler catch.

---

## Kết Quả Fan-Out

- **UI / Component:** Không cần thay đổi. `Your Coins` dùng `CoinContext.coins` đúng cách.
- **State / Context:** `contexts/coin-context.tsx` — `addCoins` cần rollback khi API thất bại.
- **API Route:** `app/api/players/coins/route.ts` — không cần thay đổi.
- **Data (Supabase):** Migration mới `0005_increment_coins_rpc.sql` thêm `increment_player_coins`.
- **Bug memory:** RC-2/RC-3/RC-4 phát hiện trong phân tích v2.

---

## Phương Án Sửa (đã triển khai)

### Fix 1 — Bỏ `coins: 0` khỏi `upsertPlayer`
File: `lib/services/player.ts`  
Thay đổi: `.upsert({ id: userId, name, coins: 0 }, ...)` → `.upsert({ id: userId, name }, ...)`

### Fix 2 — `addCoins` atomic qua RPC
Migration mới `0005_increment_coins_rpc.sql` định nghĩa `increment_player_coins(p_player_id, p_amount)` — hàm `SECURITY DEFINER` thực hiện `UPDATE players SET coins = coins + p_amount WHERE id = p_player_id` trong một câu SQL duy nhất. `addCoins` trong `lib/services/player.ts` giờ gọi RPC này thay vì đọc rồi ghi riêng.

### Fix 3 — Rollback state lạc quan khi thất bại
File: `contexts/coin-context.tsx`  
Lưu `previousCoins` trước khi cập nhật lạc quan, khôi phục cả `coins` state và `localStorage` trong handler `.catch()`.

---

## Rủi Ro

| Rủi ro | Giảm thiểu |
|--------|-----------|
| Hàm `SECURITY DEFINER` bỏ qua RLS | Hàm tự kiểm tra `auth.uid() = p_player_id` trước khi thay đổi dữ liệu |
| Migration chỉ đi tiến | Dùng `CREATE OR REPLACE FUNCTION` — idempotent |
| `buySticker` và `buyHouseItem` cũng nuốt lỗi | Nằm ngoài phạm vi fix này |

---

## Mức Độ Tin Cậy

**Cao** — ba nguyên nhân gốc rễ đều quan sát được trực tiếp trong mã với ánh xạ rõ ràng đến các tiêu chí chấp nhận.

---

## Triển Khai Fix

### Các File Thay Đổi

| File | Thay đổi |
|------|---------|
| `supabase/migrations/0005_increment_coins_rpc.sql` | Mới: RPC `increment_player_coins` atomic |
| `lib/database.types.ts` | Thêm `increment_player_coins` vào `Functions` |
| `lib/services/player.ts` | Fix 1: bỏ `coins: 0` khỏi upsert; Fix 2: `addCoins` dùng RPC |
| `contexts/coin-context.tsx` | Fix 3: rollback state lạc quan khi API thất bại |
| `automation_tests/unit/player-service.test.ts` | Mới: 10 regression test (TC-U-MH7-1 đến TC-U-MH7-10) |
| `automation_tests/unit/coin-context.test.tsx` | Mới: 4 regression test (TC-U-MH7-11 đến TC-U-MH7-14) |

---

## Xác Minh

- `pnpm test`: **263 tests pass** (tất cả 24 file test)
- 14 regression test mới đều pass
- Không có test cũ nào bị ảnh hưởng

---

## Trạng Thái Cuối

**ĐÃ GIẢI QUYẾT** — Cả ba nguyên nhân gốc rễ v2 đã được sửa. 14 regression test bao phủ từng path sửa lỗi.
