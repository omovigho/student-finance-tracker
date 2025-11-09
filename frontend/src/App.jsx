import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Incomes from './pages/Finances/Incomes.jsx';
import Expenses from './pages/Finances/Expenses.jsx';
import Summary from './pages/Finances/Summary.jsx';
import ScholarshipsList from './pages/Scholarships/ScholarshipsList.jsx';
import ScholarshipDetail from './pages/Scholarships/ScholarshipDetail.jsx';
import ScholarshipHistory from './pages/Scholarships/ScholarshipHistory.jsx';
import ScholarshipCreate from './pages/Admin/ScholarshipCreate.jsx';
import ScholarshipAdminList from './pages/Admin/ScholarshipAdminList.jsx';
import ScholarshipApplications from './pages/Admin/ScholarshipApplications.jsx';
import Categories from './pages/Admin/Categories.jsx';
import LoanSchemes from './pages/Admin/LoanSchemes.jsx';
import LoanApplications from './pages/Admin/LoanApplications.jsx';
import LoansList from './pages/Loans/LoansList.jsx';
import LoanDetail from './pages/Loans/LoanDetail.jsx';
import Notifications from './pages/Notifications.jsx';
import Profile from './pages/Profile.jsx';
import AppShell from './components/AppShell.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

const FullscreenSpinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-background text-primary">
    <div className="flex items-center gap-3 text-lg font-semibold">
      <span className="inline-block h-3 w-3 animate-ping rounded-full bg-primary" aria-hidden="true" />
      Loading…
    </div>
  </div>
);

const App = () => {
  return (
    <Suspense fallback={<FullscreenSpinner />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/finances/incomes" element={<Incomes />} />
            <Route path="/finances/expenses" element={<Expenses />} />
            <Route path="/finances/summary" element={<Summary />} />
            <Route path="/scholarships" element={<ScholarshipsList />} />
            <Route path="/scholarships/:scholarshipId" element={<ScholarshipDetail />} />
            <Route path="/scholarships/history" element={<ScholarshipHistory />} />
            <Route path="/admin/scholarships" element={<ScholarshipAdminList />} />
            <Route path="/admin/scholarships/create" element={<ScholarshipCreate />} />
            <Route path="/admin/scholarships/:scholarshipId/applications" element={<ScholarshipApplications />} />
            <Route path="/admin/categories" element={<Categories />} />
            <Route path="/admin/loan-schemes" element={<LoanSchemes />} />
            <Route path="/admin/loan-applications" element={<LoanApplications />} />
            <Route path="/loans" element={<LoansList />} />
            <Route path="/loans/:loanId" element={<LoanDetail />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
