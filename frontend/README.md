# Student Project Finance Tracker – Frontend

A Vite + React + Tailwind CSS frontend for the Student Project Finance Tracker platform. It connects to the provided Django REST API to help students manage project incomes, expenses, scholarships, loans, and notifications.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables:

   Create a `.env` file in the project root with the backend base URL:

   ```bash
   VITE_API_BASE_URL=http://localhost:8000
   ```

   Ensure backend CORS settings allow requests from `http://localhost:5173`.

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Build for production:

   ```bash
   npm run build
   ```

## Key features

- JWT authentication with refresh token handling and auto logout on failure.
- Protected routes with responsive AppShell layout, sidebar navigation, and notification preview.
- Finance modules for income, expenses, and summaries with charts powered by Recharts.
- Scholarship listings with modal applications, plus loan management with repayment tracking.
- Profile management with avatar uploads (multipart form data) and form validation using `react-hook-form` + `yup`.
- Global toast notifications, react-query data caching, and framer-motion animations that respect `prefers-reduced-motion`.

## Tech stack

- [Vite](https://vitejs.dev/) + [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/), PostCSS, Autoprefixer
- [`@tanstack/react-query`](https://tanstack.com/query/latest) for server state
- [axios](https://axios-http.com/), [react-hook-form](https://react-hook-form.com/), [yup](https://github.com/jquense/yup)
- [Recharts](https://recharts.org/), [framer-motion](https://www.framer.com/motion/), [Heroicons](https://heroicons.com/), [react-icons](https://react-icons.github.io/react-icons/)

## Folder structure

```
frontend/
├─ public/
├─ src/
│  ├─ api/
│  ├─ components/
│  ├─ contexts/
│  ├─ hooks/
│  ├─ pages/
│  ├─ styles/
│  ├─ utils/
│  └─ assets/
└─ ...
```

Feel free to extend components, adjust API paths, or layer in additional analytics to match evolving backend features.
