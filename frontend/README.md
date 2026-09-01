# Academix Frontend

Academix is a modern, production-grade **Class / Institute Management System** built with React, Vite, Tailwind CSS, and shadcn/ui. It connects seamlessly with the Academix Express/MongoDB backend.

---

## 🛠️ Technology Stack

- **Framework:** Vite + React (JavaScript)
- **Routing:** React Router DOM (v7)
- **HTTP Client:** Centralized Axios instance with JWT interceptors
- **Server State & Caching:** TanStack Query (v5)
- **Styling & Design:** Tailwind CSS + shadcn/ui + Magic UI + Lucide React
- **Animations:** Framer Motion
- **Notifications:** Sonner Toast Notifications
- **Form Management & Validation:** React Hook Form + Zod + @hookform/resolvers
- **Date Handling:** date-fns
- **Data Visualization:** Recharts

---

## 📁 Directory Structure

```text
frontend/
├── src/
│   ├── api/          # Domain-specific API modules (axios, auth, users, courses, etc.)
│   ├── components/   # UI components (shadcn/ui, layout, common, domain pages)
│   ├── constants/    # Roles, routes, configuration
│   ├── context/      # AuthContext, ThemeContext
│   ├── hooks/        # useAuth, useTheme, useNotification
│   ├── layouts/      # PublicLayout, DashboardLayout, AdminLayout, TeacherLayout, StudentLayout
│   ├── lib/          # utils.js (cn helper)
│   ├── pages/        # Public (Landing, Login), Admin, Teacher, Student
│   ├── routes/       # AppRoutes, ProtectedRoute, RoleRoute
│   └── utils/        # jwt.js, format.js
├── .env.example
├── components.json
└── vite.config.js
```

---

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install --legacy-peer-deps
   ```

2. **Configure environment:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```

4. **Build for Production:**
   ```bash
   npm run build
   ```
