# DeskAI_DocFinder
# Luôn giúp các pro chống chàn bộ nhớ khi làm việc với AI
# Good luck and have fun!

# Hướng dẫn sửa lỗi Indexing - DeskAI DocFinder

## 🔍 Vấn đề đã phát hiện

Khi index tài liệu từ desktop app, có 6/7 files bị lỗi với thông báo **"fetch failed"**.

### Nguyên nhân:
1. **Backend API đã dừng hoặc chưa khởi động**
2. **UUID validation issue** - API yêu cầu chunkId phải là UUID hợp lệ

## ✅ Giải pháp đã áp dụng

### 1. Sửa API để chấp nhận non-UUID IDs
File: `apps/pyservice/app/api/index.py`

**Thay đổi:**
- Thêm logic tự động generate UUID nếu ID không hợp lệ
- Không còn reject requests với invalid UUID

### 2. Khởi động lại Backend
Backend cần chạy để desktop app có thể gửi data.

## 🚀 Cách khởi động Backend

### Option 1: Sử dụng batch file (Khuyến nghị)
```bash
# Từ thư mục gốc project
.\apps\pyservice\start_backend.bat
```

### Option 2: Chạy trực tiếp
```bash
cd apps\pyservice
venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Option 3: Sử dụng run_backend.bat (nếu đã setup)
```bash
.\apps\pyservice\run_backend.bat
```

## 🧪 Kiểm tra Backend đang chạy

### Cách 1: Check port
```bash
netstat -ano | findstr :8000
```
Nếu thấy `LISTENING` trên port 8000 = backend đang chạy

### Cách 2: Test API
```bash
python apps\pyservice\test_index_endpoint.py
```
Nếu thấy `✅ Success` = API hoạt động tốt

### Cách 3: Truy cập browser
Mở: http://127.0.0.1:8000/health/
Nếu thấy `{"status":"ok"}` = backend OK

## 📋 Quy trình sử dụng đúng

1. **Khởi động Backend trước**
   ```bash
   .\apps\pyservice\start_backend.bat
   ```

2. **Đợi backend khởi động** (khoảng 5-10 giây)
   - Xem log xuất hiện: "Uvicorn running on http://127.0.0.1:8000"

3. **Khởi động Desktop App**
   ```bash
   npm run dev
   # hoặc
   npm start
   ```

4. **Add Sources và Index**
   - Click "Add Source" trong desktop app
   - Chọn folder chứa tài liệu
   - Click "Re-index All"
   - Đợi indexing hoàn tất

## 🔧 Troubleshooting

### Lỗi: "fetch failed"
**Nguyên nhân:** Backend không chạy hoặc không thể kết nối

**Giải pháp:**
1. Kiểm tra backend có đang chạy không
2. Restart backend
3. Kiểm tra firewall không block port 8000

### Lỗi: "FOREIGN KEY constraint failed"  
**Nguyên nhân:** Database schema issue (đã fix)

**Giải pháp:**
1. Chạy: `python apps\pyservice\check_desktop_db.py`
2. Database sẽ tự động được kiểm tra

### Lỗi: "Point id ... is not a valid UUID"
**Nguyên nhân:** API yêu cầu UUID (đã fix)

**Giải pháp:**
- Đã được fix trong code, API tự động generate UUID

## 📊 Kiểm tra trạng thái hệ thống

### Check Database
```bash
python apps\pyservice\inspect_db_schema.py
```

### Check Qdrant
```bash
python apps\pyservice\test_search_api.py
```

### Check Gemini API
```bash
python apps\pyservice\check_quota.py
```

## ✅ Kết quả mong đợi

Sau khi áp dụng fix:
- ✅ Backend API chạy ổn định
- ✅ Desktop app có thể index files thành công
- ✅ Không còn lỗi "fetch failed"
- ✅ Files được index vào Qdrant database
- ✅ RAG system có thể trả lời câu hỏi về tài liệu

## 💡 Lưu ý quan trọng

1. **Luôn khởi động Backend trước Desktop App**
2. **Kiểm tra port 8000 không bị chiếm bởi process khác**
3. **Đảm bảo Python virtual environment đã được setup**
4. **Gemini API key phải hợp lệ trong file .env**

## 🆘 Nếu vẫn gặp vấn đề

1. Stop tất cả processes:
   ```bash
   taskkill /F /IM python.exe
   taskkill /F /IM node.exe
   ```

2. Xóa database cũ (nếu cần):
   ```bash
   # Backup trước khi xóa!
   del %APPDATA%\deskai-desktop\deskai.db
   ```

3. Restart lại từ đầu:
   - Khởi động backend
   - Khởi động desktop app
   - Add sources lại
   - Re-index

## 📞 Support

Nếu cần hỗ trợ thêm, cung cấp:
- Log từ `apps/desktop/logs/backend-debug.log`
- Output từ backend terminal
- Screenshot lỗi trong desktop app