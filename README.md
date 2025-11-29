# TourismTogether

## Cài đặt và Chạy Dự án

### Yêu cầu
- Node.js 18+ 
- npm hoặc yarn
- Tài khoản Supabase

### Bước 1: Cài đặt dependencies
```bash
npm install
```

### Bước 2: Cấu hình Supabase
Tạo file `.env.local` trong thư mục gốc với nội dung:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Lấy các giá trị này từ Supabase Dashboard: Settings > API

### Bước 3: Chạy database migrations
Chạy file `supabase/migrations/schema.sql` trong Supabase SQL Editor để tạo các bảng cần thiết.

### Bước 4: Chạy development server
```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trong trình duyệt.

## Cấu trúc Dự án

- `src/app/` - Next.js App Router pages
- `src/components/` - React components
- `src/contexts/` - React contexts (AuthContext)
- `src/lib/` - Utilities và Supabase client
- `src/screens/` - Screen components
- `supabase/migrations/` - Database schema

## Git Workflow

Bước 1: pull dev
Bước 2: tạo nhánh mới trong local 
Bước 3: code trong nhánh mới 
Bước 4: push nhánh mới với tên featureX 

Lưu ý: 
- không push main, không push dev
- Làm việc với main mới nhất
