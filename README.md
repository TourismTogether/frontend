# Tourism Together - Journey Together

Nền tảng du lịch kết nối cộng đồng, giúp bạn lập kế hoạch chuyến đi, tìm bạn đồng hành, chia sẻ trải nghiệm và khám phá những điểm đến tuyệt vời.

## 👥 Thành viên nhóm

- **Đức** - Leader + Project Manager
- **Việt** - AI Engineer
- **Phú** - Frontend Developer + Database Security
- **Lâm** - Backend Developer + Network Security + Optimize
- **Sơn** - Test System

## 🚀 Cài đặt

### Yêu cầu hệ thống
- Node.js 18+
- npm hoặc yarn
- PostgreSQL (cho backend)
- Tài khoản Supabase (cho frontend)

### Bước 1: Clone repository
```bash
git clone <repository-url>
cd SEProject
```

### Bước 2: Cài đặt dependencies

**Frontend:**
```bash
cd frontend
npm install
```

**Backend:**
```bash
cd backend
npm install
```

### Bước 3: Cấu hình môi trường

**Frontend (.env.local):**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Backend (.env):**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
SESSION_SECRET=your_session_secret
OPENAI_API_KEY=your_openai_api_key
```

### Bước 4: Chạy ứng dụng

**Frontend:**
```bash
cd frontend
npm run dev
```
Truy cập: [http://localhost:3000](http://localhost:3000)

**Backend:**
```bash
cd backend
npm run dev
```
Backend chạy tại: [http://localhost:5000](http://localhost:5000)

## 📖 Giới thiệu trang web

**Tourism Together** là một nền tảng du lịch toàn diện, được thiết kế để kết nối cộng đồng du lịch và hỗ trợ người dùng trong mọi khía cạnh của hành trình du lịch.

### ✨ Tính năng chính

#### 🗺️ Quản lý chuyến đi (Trips)
- Tạo và quản lý các chuyến đi cá nhân
- Lập kế hoạch lộ trình chi tiết
- Tìm và tham gia các nhóm du lịch
- Theo dõi chi phí và ngân sách
- AI Route Planner - Tư vấn lộ trình thông minh bằng AI

#### 📍 Điểm đến (Destinations)
- Khám phá các điểm đến phổ biến
- Xem đánh giá và nhận xét từ cộng đồng
- Tạo và chia sẻ đánh giá về điểm đến
- Tìm kiếm điểm đến theo khu vực

#### 📔 Nhật ký du lịch (Diaries)
- Viết và chia sẻ nhật ký du lịch
- Lưu trữ kỷ niệm và hình ảnh
- Chỉnh sửa và quản lý nhật ký
- Xem nhật ký của cộng đồng

#### 💬 Diễn đàn (Forum)
- Thảo luận và chia sẻ kinh nghiệm
- Đặt câu hỏi và nhận tư vấn
- Tương tác với cộng đồng du lịch
- Tìm kiếm bài viết theo chủ đề

#### 👤 Hồ sơ cá nhân (Profile)
- Quản lý thông tin cá nhân
- Xem lịch sử chuyến đi và hoạt động
- Cài đặt tài khoản

#### 🆘 Tính năng an toàn
- Hệ thống SOS khẩn cấp
- Chia sẻ vị trí với nhóm
- Quản lý đội hỗ trợ

#### 🌤️ Thời tiết
- Xem dự báo thời tiết
- Bản đồ thời tiết tương tác

## 🖼️ Demo

### Trang đăng nhập/Đăng ký
![Authentication](./frontend/public/readme_intro/auth.png)

### Dashboard
![Dashboard](./frontend/public/readme_intro/dashboard.png)

### Điểm đến
![Destinations](./frontend/public/readme_intro/destination.png)

### Nhật ký du lịch
![Diaries](./frontend/public/readme_intro/diaries.png)

### Diễn đàn
![Forum](./frontend/public/readme_intro/forum.png)

### Quản lý chuyến đi
![Trips](./frontend/public/readme_intro/trip.png)

## 🛠️ Công nghệ sử dụng

### Frontend
- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Leaflet** - Maps
- **Supabase** - Backend as a Service

### Backend
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **Passport.js** - Authentication
- **OpenAI API** - AI Route Planning
- **Multer** - File uploads

## 📁 Cấu trúc dự án

```
SEProject/
├── frontend/          # Next.js frontend application
│   ├── src/
│   │   ├── app/       # Next.js App Router pages
│   │   ├── components/# React components
│   │   ├── screens/   # Screen components
│   │   ├── contexts/  # React contexts
│   │   └── services/  # API services
│   └── public/        # Static assets
├── backend/           # Express.js backend API
│   ├── src/
│   │   ├── controllers/# Route controllers
│   │   ├── services/   # Business logic
│   │   ├── models/     # Database models
│   │   ├── routes/     # API routes
│   │   └── configs/   # Configuration files
└── testing/           # Test suite
```

## 🔐 Bảo mật

- Xác thực người dùng với Passport.js
- Bảo mật database với Row Level Security (RLS)
- Bảo mật mạng và tối ưu hóa hiệu suất
- Quản lý session an toàn

## 📝 Git Workflow

1. Pull branch `dev` mới nhất
2. Tạo nhánh mới trong local
3. Code trong nhánh mới
4. Push nhánh mới với tên `featureX`

**Lưu ý:**
- Không push trực tiếp vào `main` hoặc `dev`
- Luôn làm việc với `main` mới nhất

## 📄 License

ISC

## 👨‍💻 Đóng góp

Dự án này được phát triển bởi nhóm SEProject. Mọi đóng góp đều được chào đón!

---

**Tourism Together** - Kết nối cộng đồng, chia sẻ hành trình 🌍✈️
