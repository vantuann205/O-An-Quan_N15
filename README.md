# Ô Ăn Quan Web

Một phiên bản web trực tuyến của trò chơi dân gian truyền thống Việt Nam **Ô Ăn Quan**. Dự án được xây dựng với kiến trúc Client-Server, cung cấp giao diện đẹp mắt và trải nghiệm mượt mà.

## Tính năng nổi bật

- **Giao diện trực quan:** Bàn cờ và các quân cờ được thiết kế dễ nhìn, cùng với các hiệu ứng chuyển động mượt mà.
- **Luật chơi chuẩn:** Tuân thủ đúng luật lệ của trò chơi truyền thống (chia quân, ăn điểm, xử lý ô quan, đồng hồ đếm ngược).
- **Trải nghiệm mượt mà:** Cập nhật trạng thái tức thời giữa Frontend và Backend.

## Trải nghiệm Công nghệ

- **Frontend:** Next.js (React)
- **Backend:** Flask (Python)

## Cấu trúc dự án

- `frontend/`: Chứa mã nguồn giao diện tương tác người dùng. Mặc định chạy trên cổng `3003`.
- `backend/`: Chứa mã nguồn xử lý logic máy chủ và giao tiếp API. Mặc định chạy trên cổng `5000`.

## Hướng dẫn cài đặt và khởi chạy

Yêu cầu môi trường có cài đặt sẵn **Node.js** và **Python**.

### 1. Khởi chạy Frontend

Mở một cửa sổ Terminal (hoặc Command Prompt) và di chuyển vào thư mục `frontend`:

```bash
cd frontend
npm install       # Cài đặt các thư viện phụ thuộc
npm run dev       # Khởi chạy máy chủ phát triển
```

Giao diện sẽ hiển thị tại: [http://localhost:3003](http://localhost:3003)

### 2. Khởi chạy Backend

Mở một cửa sổ Terminal mới và di chuyển vào thư mục `backend`:

```bash
cd backend
pip install -r requirements.txt   # Cài đặt các dependencies cần thiết
python app.py                     # Khởi chạy server Backend
```

Backend sẽ lắng nghe API tại: [http://localhost:5000](http://localhost:5000)

## Cách chơi (Tóm tắt)

1. Bàn cờ gồm 2 ô Quan (ở 2 đầu) và 10 ô Dân (chia đều 2 bên).
2. Khi đến lượt, người chơi chọn một ô Dân của mình (những ô có quân) và rải các hạt theo một chiều tùy ý (trái hoặc phải).
3. Hạt được rải lần lượt vào các ô tiếp theo. Nếu sau khi rải hết hạt mà gặp một ô trống, liền sau là ô có hạt, người chơi được trọn quyền "ăn" ô có hạt đó.
4. Trò chơi kết thúc khi 2 ô Quan đều trống. Người nào có tổng điểm cao hơn sẽ giành chiến thắng.
