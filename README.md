# HODLISMA - Crypto & Finance Dashboard

![Next.js 16](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)
![React 19](https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-green?style=flat-square&logo=supabase)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)

**HODLISMA** là một nền tảng quản lý tài chính cá nhân và danh mục đầu tư tiền điện tử (Crypto Portfolio) tất cả-trong-một. Dự án được xây dựng với hiệu năng cao, giao diện hiện đại và tích hợp trợ lý AI thông minh.

## 🚀 Tính năng chính

- **📊 Crypto Portfolio Tracker:**
  - Theo dõi biến động tài sản crypto theo thời gian thực.
  - Tự động cập nhật giá từ CoinMarketCap API.
  - Quản lý danh sách tài sản (Add/Edit Assets) trực quan.

- **💰 Quản lý Tài chính Cá nhân (Finance):**
  - Ghi chép thu/chi (Income/Expense).
  - Biểu đồ phân tích chi tiêu (Expense Chart) sử dụng Recharts.
  - Bảng thống kê giao dịch chi tiết.

- **🤖 AI Assistant (Chat Widget):**
  - Trợ lý ảo tích hợp sẵn (Powered by Vercel AI SDK & OpenRouter).
  - Hỗ trợ giải đáp thắc mắc về thị trường hoặc phân tích dữ liệu cá nhân.

- **⚡ Real-time Updates:**
  - Đồng bộ dữ liệu tức thì giữa các thiết bị nhờ Supabase Realtime.
  - Giao diện phản hồi nhanh với Optimistic UI updates.

- **🎨 Modern UI/UX:**
  - Thiết kế Holo/Glassmorphism độc đáo.
  - Hiệu ứng chuyển động mượt mà với Framer Motion.
  - Dark mode mặc định, tối ưu cho trader.

## 🛠 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/), `clsx`, `tailwind-merge`
- **Database & Auth:** [Supabase](https://supabase.com/)
- **AI Integration:** [Vercel AI SDK](https://sdk.vercel.ai/docs), OpenRouter
- **Charts:** [Recharts](https://recharts.org/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Animation:** [Framer Motion](https://www.framer.com/motion/)

## ⚙️ Cài đặt & Chạy dự án

### 1. Clone dự án

```bash
git clone https://github.com/TAV99/HODLISMA.git
cd HODLISMA
```

### 2. Cài đặt dependencies

```bash
npm install
# hoặc
pnpm install
# hoặc
bun install
```

### 3. Cấu hình biến môi trường

Tạo file `.env.local` tại thư mục gốc và điền các thông tin sau:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI & LLM Provider (OpenRouter/OpenAI/Google)
OPENROUTER_API_KEY=your_openrouter_api_key

# Crypto Data Provider
CMC_PRO_API_KEY=your_coinmarketcap_api_key
```

### 4. Chạy môi trường phát triển

```bash
npm run dev
```

Truy cập [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## 📂 Cấu trúc dự án

```
HODLISMA/
├── src/
│   ├── app/                 # Next.js App Router (Pages & Layouts)
│   │   ├── api/             # API Routes (Chat, Crypto)
│   │   ├── finance/         # Finance Module
│   │   ├── history/         # History/Audit Module
│   │   └── page.tsx         # Dashboard Home
│   ├── components/          # React Components
│   │   ├── ai/              # AI Chat Widget
│   │   ├── dashboard/       # Portfolio Components
│   │   ├── finance/         # Finance Components
│   │   ├── ui/              # Reusable UI Elements (Buttons, Cards...)
│   │   └── layout/          # Sidebar, Header, AppLayout
│   ├── lib/                 # Utilities, Hooks, Supabase Client
│   │   ├── actions/         # Server Actions
│   │   └── supabase.ts      # Supabase Config
│   └── hooks/               # Custom React Hooks
├── public/                  # Static Assets
├── tailwind.config.ts       # Tailwind Configuration
└── package.json             # Dependencies
```

## 🤝 Đóng góp

Mọi đóng góp đều được hoan nghênh! Vui lòng tạo Pull Request hoặc mở Issue để thảo luận về các thay đổi lớn.

## 📄 License

Dự án này thuộc quyền sở hữu của **TAV99**.
